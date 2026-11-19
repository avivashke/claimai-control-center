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
