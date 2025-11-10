import type { AuthResponse } from '../services/authService';

type StorageKey = 'token' | 'user';

type StorageTarget = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const persistentStorage: StorageTarget = localStorage;
const sessionStorageTarget: StorageTarget = sessionStorage;

const storageKeys: StorageKey[] = ['token', 'user'];

export const clearStoredAuth = () => {
  storageKeys.forEach((key) => {
    persistentStorage.removeItem(key);
    sessionStorageTarget.removeItem(key);
  });
};

const setAuthValue = (storage: StorageTarget, response: AuthResponse) => {
  storage.setItem('token', response.token);
  storage.setItem('user', JSON.stringify(response.user));
};

const getStorageWithToken = (): StorageTarget | null => {
  if (sessionStorageTarget.getItem('token')) {
    return sessionStorageTarget;
  }

  if (persistentStorage.getItem('token')) {
    return persistentStorage;
  }

  return null;
};

export const storeAuthCredentials = (response: AuthResponse, remember: boolean) => {
  const primaryStorage = remember ? persistentStorage : sessionStorageTarget;
  const secondaryStorage = remember ? sessionStorageTarget : persistentStorage;

  // Clear existing auth data from both storage types before writing
  clearStoredAuth();

  setAuthValue(primaryStorage, response);

  // Ensure secondary storage is empty (clearStoredAuth already did this, but keep explicit)
  storageKeys.forEach((key) => secondaryStorage.removeItem(key));
};

export const getStoredToken = (): string | null => {
  return sessionStorageTarget.getItem('token') || persistentStorage.getItem('token');
};

export const getStoredUser = <T = unknown>(): T | null => {
  const raw = sessionStorageTarget.getItem('user') || persistentStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const persistUser = (user: AuthResponse['user']) => {
  const target = getStorageWithToken();
  if (!target) return;

  target.setItem('user', JSON.stringify(user));

  const secondary = target === persistentStorage ? sessionStorageTarget : persistentStorage;
  secondary.removeItem('user');
};
