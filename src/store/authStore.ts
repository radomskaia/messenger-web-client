import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { isRecord, isString } from '@/api/guards.ts';
import type { Credentials } from '@/domain/types';

interface AuthState {
  credentials: Credentials | null;
  isVerified: boolean;
  signIn: (credentials: Credentials) => void;
  markVerified: () => void;
  signOut: () => void;
}

function isCredentials(value: unknown): value is Credentials {
  return (
    isRecord(value) &&
    isString(value['idInstance']) &&
    isString(value['apiTokenInstance']) &&
    isString(value['apiUrl'])
  );
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      credentials: null,
      isVerified: false,
      signIn: (credentials) => {
        set({ credentials, isVerified: true });
      },
      markVerified: () => {
        set({ isVerified: true });
      },
      signOut: () => {
        set({ credentials: null, isVerified: false });
      },
    }),
    {
      name: 'messenger:auth',
      version: 1,
      partialize: (state) => ({ credentials: state.credentials }),
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<AuthState>;

        return {
          ...current,
          credentials: isCredentials(state.credentials) ? state.credentials : null,
          isVerified: false,
        };
      },
    },
  ),
);
