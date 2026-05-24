import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MeResponse, Permission } from '@/types/auth.types';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  aal: number;
  permissions: Permission[];
  expiresAt: number | null;

  setAuth: (accessToken: string, expiresIn: number) => void;
  setUserFromMe: (me: MeResponse) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (key: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  accessToken: null,
  user: null,
  aal: 0,
  permissions: [],
  expiresAt: null,

  setAuth: (accessToken, expiresIn) =>
    set({
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    }),

  setUserFromMe: (me) =>
    set({
      user: {
        id: me.id,
        username: me.username,
        displayName: me.displayName,
        email: me.email,
        status: me.status,
        emailVerifiedAt: me.emailVerifiedAt,
        createdAt: me.createdAt,
      },
      aal: me.aal,
      permissions: me.permissions,
    }),

  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      aal: 0,
      permissions: [],
      expiresAt: null,
    }),

  isAuthenticated: () => !!get().accessToken,

  hasPermission: (key) => get().permissions.some((p) => p.key === key),
    }),
    {
      name: 'helios-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        aal: state.aal,
        permissions: state.permissions,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
