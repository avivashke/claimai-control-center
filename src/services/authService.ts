import { AppUser, UserRole, UserPermissions } from '../types';
import { getAppUsers, saveAppUser, findUserByEmail } from './db';
import seedUsers from '../data/seedUsers.json';

const CURRENT_USER_STORAGE_KEY = 'claimai_current_user';
const AUTH_TOKEN_STORAGE_KEY = 'claimai_auth_token';
const USER_PASSWORDS_STORAGE_KEY = 'claimai_user_passwords';
const ADMIN_RESET_CODES_STORAGE_KEY = 'claimai_admin_reset_codes';

// Default fallback password when environment variable is not configured
export const DEFAULT_FALLBACK_PASSWORD = 'ClaimAI2026!';

// Read Netlify Environment Variable passwords by user email or role
export const getNetlifyPasswordForUser = (email: string, role: UserRole): string | undefined => {
  const env = import.meta.env;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Direct personal password for Aviv (VITE_AVIV_PASSWORD or VITE_PASSWORD_AVIV)
  if (cleanEmail === 'aviv.claimai@gmail.com' || cleanEmail === 'avivashke95@gmail.com' || cleanEmail.includes('aviv')) {
    const avivPass = env.VITE_AVIV_PASSWORD || env.VITE_PASSWORD_AVIV;
    if (avivPass) return avivPass;
  }

  // 2. Direct personal password for Eyal (VITE_EYAL_PASSWORD or VITE_PASSWORD_EYAL)
  if (cleanEmail === 'eyal@claimi.co.il' || cleanEmail === 'eyal@claimai.com' || cleanEmail.includes('eyal')) {
    const eyalPass = env.VITE_EYAL_PASSWORD || env.VITE_PASSWORD_EYAL;
    if (eyalPass) return eyalPass;
  }

  // 3. Admin / role fallback password (VITE_ADMIN_PASSWORD or VITE_APP_PASSWORD)
  if (role === 'admin') {
    return env.VITE_ADMIN_PASSWORD || env.VITE_APP_PASSWORD;
  }
  if (role === 'editor') {
    return env.VITE_EDITOR_PASSWORD || env.VITE_APP_PASSWORD;
  }
  if (role === 'viewer') {
    return env.VITE_VIEWER_PASSWORD || env.VITE_APP_PASSWORD;
  }
  return env.VITE_APP_PASSWORD;
};

// Read Netlify Environment Variable passwords
export const getNetlifyPasswordForRole = (role: UserRole): string | undefined => {
  const env = import.meta.env;
  if (role === 'admin') {
    return env.VITE_ADMIN_PASSWORD || env.VITE_APP_PASSWORD;
  }
  if (role === 'editor') {
    return env.VITE_EDITOR_PASSWORD || env.VITE_APP_PASSWORD;
  }
  if (role === 'viewer') {
    return env.VITE_VIEWER_PASSWORD || env.VITE_APP_PASSWORD;
  }
  return env.VITE_APP_PASSWORD;
};

// Check if user is currently logged in with a valid session
export const isUserAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const userRaw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return Boolean(token && userRaw);
  } catch {
    return false;
  }
};

// Get currently logged-in user or null if not authenticated
export const getCurrentUser = (): AppUser | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (token && raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse current user from localStorage', e);
  }
  return null;
};

export const setCurrentUser = (user: AppUser): void => {
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, `session_${Date.now()}`);
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

// Check module permissions
export const hasPermission = (
  user: AppUser | null,
  permission: keyof UserPermissions
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Boolean(user.permissions?.[permission]);
};

// Storage helper for user passwords
export const getStoredPasswords = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(USER_PASSWORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setUserPassword = (emailOrId: string, newPassword: string): void => {
  const passwords = getStoredPasswords();
  passwords[emailOrId.trim().toLowerCase()] = newPassword;
  localStorage.setItem(USER_PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
};

// Storage helper for Admin Reset Codes
interface ResetCodeRecord {
  code: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

export const getResetCodes = (): ResetCodeRecord[] => {
  try {
    const raw = localStorage.getItem(ADMIN_RESET_CODES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveResetCodes = (codes: ResetCodeRecord[]): void => {
  localStorage.setItem(ADMIN_RESET_CODES_STORAGE_KEY, JSON.stringify(codes));
};

// Admin generates a 6-digit one-time reset code for a user
export const generateAdminResetCode = (userEmail: string): { success: boolean; code: string; message: string } => {
  const cleanEmail = userEmail.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // valid for 24 hours

  const codes = getResetCodes().filter(c => c.email !== cleanEmail && c.expiresAt > now);
  codes.push({
    code,
    email: cleanEmail,
    createdAt: now,
    expiresAt
  });
  saveResetCodes(codes);

  return {
    success: true,
    code,
    message: `קוד איפוס סיסמה נוצר בהצלחה עבור ${cleanEmail}: ${code}. מסור קוד זה למשתמש.`
  };
};

// User verifies reset code and sets their password
export const resetPasswordWithAdminCode = async (
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message: string; user?: AppUser }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanEmail || !cleanCode || !newPassword) {
    return { success: false, message: 'נא למלא את כל השדות' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'הסיסמה חייבת לכלול לפחות 6 תווים' };
  }

  // Validate reset code
  const now = Date.now();
  const codes = getResetCodes();
  const matchingCode = codes.find(c => c.email === cleanEmail && c.code === cleanCode && c.expiresAt > now);

  if (!matchingCode) {
    return { success: false, message: 'קוד האיפוס שגוי או פג תוקפו. פנה למנהל המערכת לקבלת קוד חדש.' };
  }

  // Save new password
  setUserPassword(cleanEmail, newPassword);

  // Invalidate used code
  saveResetCodes(codes.filter(c => c !== matchingCode));

  // Find user and log them in
  let user = await findUserByEmail(cleanEmail);
  if (!user) {
    user = (seedUsers as AppUser[]).find(u => u.email.toLowerCase() === cleanEmail);
  }

  if (user) {
    setCurrentUser(user);
    return {
      success: true,
      message: 'הסיסמה עודכנה בהצלחה! התחברת למערכת.',
      user
    };
  }

  return {
    success: true,
    message: 'הסיסמה עודכנה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה.'
  };
};

// Main Login Function: Authenticate with Email & Password
export const loginWithPassword = async (
  email: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; message: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!cleanEmail || !password) {
    return { success: false, message: 'נא להזין אימייל וסיסמה' };
  }

  // 1. Locate user in DB or seed users
  let allUsers: AppUser[] = [];
  try {
    allUsers = await getAppUsers();
  } catch {
    allUsers = seedUsers as AppUser[];
  }

  if (!allUsers || allUsers.length === 0) {
    allUsers = seedUsers as AppUser[];
  }

  let user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user && (cleanEmail === 'admin@claimai.co.il' || cleanEmail === 'admin')) {
    user = allUsers.find(u => u.role === 'admin') || (seedUsers as AppUser[])[0];
  }

  if (!user && (cleanEmail === 'eyal@claimi.co.il' || cleanEmail === 'eyal@claimai.com' || cleanEmail.includes('eyal'))) {
    user = allUsers.find(u => u.id === 'user-eyal' || u.name.includes('אייל'));
  }

  if (!user) {
    return { success: false, message: 'משתמש עם כתובת אימייל זו לא נמצא במערכת' };
  }

  if (!user.isActive) {
    return { success: false, message: 'חשבון המשתמש מושבת. פנה למנהל המערכת.' };
  }

  // 2. Validate Password against:
  // a) Netlify Environment Variable for this user or role
  const netlifyPass = getNetlifyPasswordForUser(cleanEmail, user.role);

  // b) Custom user password stored in system
  const storedPasswords = getStoredPasswords();
  const userCustomPass = storedPasswords[cleanEmail] || storedPasswords[user.id];

  // c) Default fallback password if nothing set yet
  const isMatch = 
    (netlifyPass && password === netlifyPass) ||
    (userCustomPass && password === userCustomPass) ||
    (!netlifyPass && !userCustomPass && password === DEFAULT_FALLBACK_PASSWORD);

  if (!isMatch) {
    return { 
      success: false, 
      message: 'סיסמה שגויה. נסה שוב או פנה למנהל לקבלת קוד איפוס סיסמה.' 
    };
  }

  // 3. Login successful
  const updatedUser: AppUser = {
    ...user,
    lastLogin: new Date().toLocaleString('he-IL')
  };

  try {
    await saveAppUser(updatedUser);
  } catch {}

  setCurrentUser(updatedUser);

  return {
    success: true,
    user: updatedUser,
    message: 'התחברת בהצלחה למערכת!'
  };
};
