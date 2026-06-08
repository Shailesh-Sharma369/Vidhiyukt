import { create } from 'zustand';
import {
  clearAuthRateLimit,
  getAuthErrorMessage,
  signInWithRateLimit,
  signOut,
  signUpWithRateLimit,
  watchAuthState
} from '@/services/firebase/auth';
import { firebaseReady } from '@/config/firebase';
import { syncUserProfile } from '@/services/firestore/users';
import type { AuthProfile, AuthStatus } from '@/types';
import { showToast } from '@/store/toastStore';
import { createLogger } from '@/lib/logger';

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
const authLogger = createLogger('auth');

function emitAuthError(set: (partial: Partial<AuthStore>) => void, error: unknown) {
  const message = getAuthErrorMessage(error);
  set({ error: message });
  showToast({
    title: 'Authentication failed',
    description: message,
    variant: 'error'
  });
}

function isAuthBusy(status: AuthStatus) {
  return status === 'loading';
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
  initialize: async () => {
    if (get().initialized) return;

    set({ status: 'loading' });

    try {
      unsubscribeAuth = await watchAuthState((user) => {
        set({
          user,
          status: user ? 'authenticated' : 'anonymous',
          initialized: true,
          error: null
        });
      });
    } catch (error) {
      emitAuthError(set, error);
      set({ user: null, status: 'anonymous', initialized: true });
    }
  },
  login: async (email, password) => {
    if (isAuthBusy(get().status)) {
      const message = 'Please wait for the current sign-in attempt to finish.';
      set({ error: message });
      showToast({ title: 'Authentication in progress', description: message, variant: 'error' });
      throw new Error(message);
    }

    set({ status: 'loading', error: null });

    try {
      const user = await signInWithRateLimit(email, password);
      if (firebaseReady && user.provider === 'firebase') {
        authLogger.debug('profile sync after login', { authCurrentUser: user, uid: user.uid });
        await syncUserProfile(user).catch((error) => {
          authLogger.error('profile sync failed after login', { authCurrentUser: user, uid: user.uid, error });
          throw error;
        });
      }
      clearAuthRateLimit(email);
      set({ user, status: 'authenticated', initialized: true, error: null });
    } catch (error) {
      emitAuthError(set, error);
      set({ user: null, status: 'anonymous', initialized: true });
      throw error;
    } finally {
      if (get().status === 'loading') {
        set({ status: 'anonymous' });
      }
    }
  },
  register: async (email, password) => {
    if (isAuthBusy(get().status)) {
      const message = 'Please wait for the current sign-up attempt to finish.';
      set({ error: message });
      showToast({ title: 'Authentication in progress', description: message, variant: 'error' });
      throw new Error(message);
    }

    set({ status: 'loading', error: null });

    try {
      const user = await signUpWithRateLimit(email, password);
      if (firebaseReady && user.provider === 'firebase') {
        authLogger.debug('profile sync after register', { authCurrentUser: user, uid: user.uid });
        await syncUserProfile(user).catch((error) => {
          authLogger.error('profile sync failed after register', { authCurrentUser: user, uid: user.uid, error });
          throw error;
        });
      }
      clearAuthRateLimit(email);
      set({ user, status: 'authenticated', initialized: true, error: null });
    } catch (error) {
      emitAuthError(set, error);
      set({ user: null, status: 'anonymous', initialized: true });
      throw error;
    } finally {
      if (get().status === 'loading') {
        set({ status: 'anonymous' });
      }
    }
  },
  logout: async () => {
    if (isAuthBusy(get().status)) {
      const message = 'Please wait for the current authentication operation to finish.';
      set({ error: message });
      showToast({ title: 'Authentication in progress', description: message, variant: 'error' });
      throw new Error(message);
    }

    set({ status: 'loading', error: null });

    try {
      await signOut();
      const { useIntakeStore } = await import('@/store/intakeStore');
      useIntakeStore.getState().resetIntakeState();
      set({ user: null, status: 'anonymous', initialized: true, error: null });
    } catch (error) {
      emitAuthError(set, error);
      throw error;
    } finally {
      if (get().status === 'loading') {
        set({ status: 'anonymous' });
      }
    }
  },
  clearError: () => set({ error: null })
}));

export function stopAuthSubscription() {
  unsubscribeAuth?.();
  unsubscribeAuth = null;
}
