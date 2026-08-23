import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { api, setApiLocale, setAuthToken, setOnUnauthorized } from '@/api/client';
import type { LoginResponse, Me, PermissionKey } from '@/api/types';

const TOKEN_KEY = 'nitermin.token';

interface AuthState {
  status: 'booting' | 'signedOut' | 'signedIn';
  token: string | null;
  me: Me | null;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string, deviceName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'booting',
  token: null,
  me: null,

  hydrate: async () => {
    setOnUnauthorized(() => {
      void get().signOut();
    });

    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ status: 'signedOut', token: null, me: null });
      return;
    }

    setAuthToken(token);
    try {
      const { data } = await api<{ data: Me }>('/me');
      setApiLocale(data.user.locale);
      set({ status: 'signedIn', token, me: data });
    } catch {
      // Token revoked or server unreachable with 401 — fall back to login.
      setAuthToken(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ status: 'signedOut', token: null, me: null });
    }
  },

  signIn: async (email, password, deviceName) => {
    const response = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password, device_name: deviceName },
    });

    setAuthToken(response.token);
    setApiLocale(response.me.user.locale);
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    set({ status: 'signedIn', token: response.token, me: response.me });
  },

  signOut: async () => {
    const { token } = get();
    if (token) {
      try {
        await api('/auth/logout', { method: 'DELETE' });
      } catch {
        // Best effort — the token may already be revoked.
      }
    }
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ status: 'signedOut', token: null, me: null });
  },

  refreshMe: async () => {
    const { data } = await api<{ data: Me }>('/me');
    setApiLocale(data.user.locale);
    set({ me: data });
  },

  hasPermission: (permission) => {
    const me = get().me;
    return me?.permissions.includes(permission) ?? false;
  },
}));
