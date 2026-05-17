import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signIn, signOut, signUp, watchAuthState } from '@/services/firebase/auth';
import type { AuthProfile, AuthStatus } from '@/types';

type AuthStore = {
  user: AuthProfile | null;
  status: AuthStatus;
  error: string | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

let unsubscribeAuth: (() => void) | null = null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      error: null,
      initialized: false,
      initialize: async () => {
        if (get().initialized) return;
        set({ status: 'loading' });
        unsubscribeAuth = await watchAuthState((user) => {
          set({
            user,
            status: user ? 'authenticated' : 'anonymous',
            initialized: true,
            error: null
          });
        });
      },
      login: async (email, password) => {
        set({ status: 'loading', error: null });
        const user = await signIn(email, password);
        set({ user, status: 'authenticated', initialized: true });
      },
      register: async (email, password) => {
        set({ status: 'loading', error: null });
        const user = await signUp(email, password);
        set({ user, status: 'authenticated', initialized: true });
      },
      logout: async () => {
        await signOut();
        set({ user: null, status: 'anonymous' });
      },
      clearError: () => set({ error: null })
    }),
    {
      name: 'secureship-auth',
      partialize: (state) => ({ user: state.user, status: state.status, initialized: state.initialized })
    }
  )
);

export function stopAuthSubscription() {
  unsubscribeAuth?.();
  unsubscribeAuth = null;
}