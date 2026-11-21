import { AppUser, UserRole, UserPermissions } from '../types';
import { getAppUsers, saveAppUser, findUserByEmail } from './db';
import seedUsers from '../data/seedUsers.json';

const CURRENT_USER_STORAGE_KEY = 'claimai_current_user';
const GOOGLE_CLIENT_ID_KEY = 'claimai_google_client_id';

// Default Admin user fallback
const DEFAULT_ADMIN: AppUser = seedUsers[0] as AppUser;

export const getGoogleClientId = (): string => {
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
};

export const setGoogleClientId = (id: string): void => {
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, id.trim());
};

export const getCurrentUser = (): AppUser => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse current user from localStorage', e);
  }
  return DEFAULT_ADMIN;
};

export const setCurrentUser = (user: AppUser): void => {
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
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

// Authenticate via Google email
export const loginWithGoogleEmail = async (email: string, name?: string): Promise<AppUser> => {
  const cleanEmail = email.trim().toLowerCase();
  
  // Look up user in database
  let user = await findUserByEmail(cleanEmail);

  if (!user) {
    // If user is from aviv.claimai or eyal, auto-assign admin
    const isAdminDomain = cleanEmail.includes('aviv.claimai') || cleanEmail.includes('eyal@claimai');
    const role: UserRole = isAdminDomain ? 'admin' : 'viewer';
    const isEditorOrAdmin = role === 'admin';

    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role,
      permissions: {
        canEditCrm: isEditorOrAdmin,
        canEditProduct: isEditorOrAdmin,
        canEditTables: isEditorOrAdmin,
        canManageUsers: isAdminDomain
      },
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
      lastLogin: new Date().toLocaleString('he-IL')
    };

    await saveAppUser(newUser);
    user = newUser;
  } else {
    // Update last login
    const updated = {
      ...user,
      lastLogin: new Date().toLocaleString('he-IL')
    };
    await saveAppUser(updated);
    user = updated;
  }

  setCurrentUser(user);
  return user;
};

// Initiate Google Identity Services (GIS) Client
export const initGoogleIdentityServices = (
  onSuccess: (email: string, name: string) => void
): boolean => {
  const clientId = getGoogleClientId();
  if (!clientId || typeof window === 'undefined') return false;

  const w = window as any;
  if (w.google?.accounts?.id) {
    try {
      w.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          try {
            // Decode Google JWT credential
            const payloadBase64 = response.credential.split('.')[1];
            const decodedJson = JSON.parse(atob(payloadBase64));
            if (decodedJson.email) {
              onSuccess(decodedJson.email, decodedJson.name || decodedJson.email.split('@')[0]);
            }
          } catch (err) {
            console.error('Failed to decode Google token', err);
          }
        }
      });
      return true;
    } catch (err) {
      console.warn('GIS init error:', err);
      return false;
    }
  }
  return false;
};

// Load the Google Identity Services client library from CDN
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let gsiLoaded = false;
let gsiLoadPromise: Promise<void> | null = null;

export const loadGoogleIdentityServices = (): Promise<void> => {
  if (gsiLoaded) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;
  gsiLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => { gsiLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library'));
    document.head.appendChild(script);
  });
  return gsiLoadPromise;
};

// Render the official Google "Sign in with Google" button into a container
export const renderGoogleSignInButton = (
  containerId: string,
  clientId: string,
  onSuccess: (email: string, name: string) => void
): boolean => {
  const w = window as any;
  if (!w.google?.accounts?.id) return false;
  const container = document.getElementById(containerId);
  if (!container) return false;
  container.innerHTML = '';
  try {
    w.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        try {
          const payloadBase64 = response.credential.split('.')[1];
          const decodedJson = JSON.parse(atob(payloadBase64));
          if (decodedJson.email) {
            onSuccess(decodedJson.email, decodedJson.name || decodedJson.email.split('@')[0]);
          }
        } catch (err) {
          console.error('Failed to decode Google token', err);
        }
      }
    });
    w.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      logo_alignment: 'center'
    } as any);
    try { w.google.accounts.id.prompt(); } catch {}
    return true;
  } catch (err) {
    console.warn('Google Sign-In button render error:', err);
    return false;
  }
};

// ========================================================
// Local secure authentication (WhatsApp code / password reset)
// ========================================================

const LOCAL_USERS_KEY = 'claimai_local_users';
const AUTH_CODES_KEY = 'claimai_auth_codes';
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface LocalUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCode {
  phone: string;
  code: string;
  type: 'login' | 'reset';
  createdAt: number;
  expiresAt: number;
}

const defaultPermissions: UserPermissions = {
  canEditCrm: false,
  canEditProduct: false,
  canEditTables: false,
  canManageUsers: false
};

export const getLocalUsers = (): LocalUser[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const saveLocalUsers = (users: LocalUser[]): void => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

export const ensureDefaultAdmin = (): void => {
  const users = getLocalUsers();
  if (users.length === 0) {
    const admin: LocalUser = {
      id: 'admin-1',
      phone: '0500000000',
      name: 'מנהל מערכת',
      role: 'admin',
      permissions: {
        canEditCrm: true,
        canEditProduct: true,
        canEditTables: true,
        canManageUsers: true
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveLocalUsers([admin]);
  }
};

export const findLocalUserByPhone = (phone: string): LocalUser | undefined => {
  return getLocalUsers().find(u => u.phone === phone);
};

export const generateAuthCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeAuthCode = (phone: string, code: string, type: 'login' | 'reset'): void => {
  try {
    const raw = localStorage.getItem(AUTH_CODES_KEY);
    const codes: AuthCode[] = raw ? JSON.parse(raw) : [];
    // Remove old codes for this phone + type
    const filtered = codes.filter(c => !(c.phone === phone && c.type === type));
    const now = Date.now();
    filtered.push({
      phone,
      code,
      type,
      createdAt: now,
      expiresAt: now + CODE_TTL_MS
    });
    localStorage.setItem(AUTH_CODES_KEY, JSON.stringify(filtered));
  } catch {}
};

export const verifyAuthCode = (phone: string, code: string, type: 'login' | 'reset'): boolean => {
  try {
    const raw = localStorage.getItem(AUTH_CODES_KEY);
    if (!raw) return false;
    const codes: AuthCode[] = JSON.parse(raw);
    const now = Date.now();
    const match = codes.find(
      c => c.phone === phone && c.code === code && c.type === type && c.expiresAt > now
    );
    if (!match) return false;
    // Consume the code
    const remaining = codes.filter(c => !(c.phone === phone && c.code === code));
    localStorage.setItem(AUTH_CODES_KEY, JSON.stringify(remaining));
    return true;
  } catch {
    return false;
  }
};

export const sendAuthCodeToWhatsApp = (phone: string, code: string, type: 'login' | 'reset'): { success: boolean; message: string } => {
  // In production, integrate with a WhatsApp Business API / SMS gateway.
  // For local operation, the code is stored in localStorage and displayed to the user.
  storeAuthCode(phone, code, type);
  return {
    success: true,
    message: `קוד האימות ${code} נשלח לוואטסאפ ${phone} (נשמר מקומית לפיתוח ובדיקה).`
  };
};

export const localLogin = (phone: string, code: string): { success: boolean; user?: LocalUser; message: string } => {
  ensureDefaultAdmin();
  const user = findLocalUserByPhone(phone);
  if (!user) {
    return { success: false, message: 'משתמש לא נמצא במערכת. פנה למנהל מערכת.' };
  }
  if (!user.isActive) {
    return { success: false, message: 'חשבונך הושבת על ידי מנהל המערכת.' };
  }
  if (!verifyAuthCode(phone, code, 'login')) {
    return { success: false, message: 'קוד האימות שגוי או פג תוקפו.' };
  }
  setCurrentUser({
    id: user.id,
    email: user.phone,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: new Date().toISOString()
  });
  return { success: true, user, message: 'התחברת בהצלחה למערכת.' };
};

export const requestPasswordReset = (phone: string): { success: boolean; message: string } => {
  const user = findLocalUserByPhone(phone);
  if (!user) {
    // Don't reveal whether phone exists
    return { success: true, message: 'אם המספר רשום במערכת, קוד איפוס נשלח אליו בוואטסאפ.' };
  }
  const code = generateAuthCode();
  return sendAuthCodeToWhatsApp(phone, code, 'reset');
};

export const resetPasswordWithCode = (phone: string, code: string, newPassword: string): { success: boolean; message: string } => {
  const user = findLocalUserByPhone(phone);
  if (!user) {
    return { success: false, message: 'משתמש לא נמצא.' };
  }
  if (!verifyAuthCode(phone, code, 'reset')) {
    return { success: false, message: 'קוד האיפוס שגוי או פג תוקפו.' };
  }
  const users = getLocalUsers().map(u => {
    if (u.id === user.id) {
      return { ...u, passwordHash: newPassword, updatedAt: new Date().toISOString() };
    }
    return u;
  });
  saveLocalUsers(users);
  return { success: true, message: 'הסיסמה אופסה בהצלחה. ניתן להיכנס עם הקוד החדש.' };
};

export const updateLocalUserStatus = (userId: string, isActive: boolean): boolean => {
  const users = getLocalUsers().map(u => {
    if (u.id === userId) {
      return { ...u, isActive, updatedAt: new Date().toISOString() };
    }
    return u;
  });
  saveLocalUsers(users);
  return true;
};

export const updateLocalUserRole = (userId: string, role: UserRole, permissions: UserPermissions): boolean => {
  const users = getLocalUsers().map(u => {
    if (u.id === userId) {
      return { ...u, role, permissions, updatedAt: new Date().toISOString() };
    }
    return u;
  });
  saveLocalUsers(users);
  return true;
};

export const addLocalUser = (user: Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>): LocalUser => {
  const users = getLocalUsers();
  const newUser: LocalUser = {
    ...user,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveLocalUsers([...users, newUser]);
  return newUser;
};
