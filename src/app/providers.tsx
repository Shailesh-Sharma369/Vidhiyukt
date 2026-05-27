import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { ToastViewport } from '@/components/common/toast-viewport';
import { stopAuthSubscription } from '@/store/authStore';
import { useDocumentStore } from '@/store/documentStore';
import { useComplianceStore } from '@/store/complianceStore';
import { ensureUserProfile } from '@/services/firestore/users';
import { showToast } from '@/store/toastStore';
import { firebaseReady } from '@/config/firebase';

function AuthBootstrap() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
    return () => stopAuthSubscription();
  }, [initialize]);

  return null;
}

function FirestoreBootstrap() {
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const loadUserDocuments = useDocumentStore((state) => state.loadUserDocuments);
  const resetDocuments = useDocumentStore((state) => state.resetDocuments);
  const loadUserReports = useComplianceStore((state) => state.loadUserReports);
  const resetCompliance = useComplianceStore((state) => state.resetCompliance);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      syncedUserId.current = null;
      resetDocuments();
      resetCompliance();
      return;
    }

    if (syncedUserId.current === user.uid) {
      return;
    }

    syncedUserId.current = user.uid;

    void (async () => {
      try {
        console.debug('[firestore][bootstrap] profile sync start', { uid: user.uid });
        if (!firebaseReady) {
          console.debug('[firestore][bootstrap] firebase unavailable, skipping sync', { uid: user.uid });
          return;
        }

        await ensureUserProfile(user);
        console.debug('[firestore][bootstrap] hydration start', { uid: user.uid });
        await Promise.all([loadUserDocuments(), loadUserReports()]);
        console.debug('[firestore][bootstrap] hydration end', { uid: user.uid });
      } catch (error) {
        console.debug('[firestore][bootstrap] sync failed', { uid: user.uid, error });
        const message = error instanceof Error ? error.message : 'Failed to sync your Firestore workspace.';
        showToast({ title: 'Workspace sync failed', description: message, variant: 'error' });
      }
    })();
  }, [initialized, user, loadUserDocuments, loadUserReports, resetCompliance, resetDocuments]);

  return null;
}

function ThemeBootstrap() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrap />
      <AuthBootstrap />
      <FirestoreBootstrap />
      <ToastViewport />
      {children}
    </QueryClientProvider>
  );
}