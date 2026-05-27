import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastEntry = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastStore = {
  toasts: ToastEntry[];
  pushToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const toastTimers = new Map<string, number>();

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clearToastTimer(id: string) {
  const timer = toastTimers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    toastTimers.delete(id);
  }
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = createToastId();
    const durationMs = toast.durationMs ?? 5000;

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          title: toast.title,
          description: toast.description,
          variant: toast.variant ?? 'default'
        }
      ]
    }));

    const timer = window.setTimeout(() => {
      useToastStore.getState().dismissToast(id);
    }, durationMs);

    toastTimers.set(id, timer);
    return id;
  },
  dismissToast: (id) => {
    clearToastTimer(id);
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
  clearToasts: () => {
    for (const id of toastTimers.keys()) {
      clearToastTimer(id);
    }
    set({ toasts: [] });
  }
}));

export function showToast(toast: ToastInput) {
  return useToastStore.getState().pushToast(toast);
}