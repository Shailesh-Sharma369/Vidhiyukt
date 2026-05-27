import { AlertCircle, CheckCircle2, Info, X, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore, type ToastVariant } from '@/store/toastStore';

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-white/10 bg-slate-950/95 text-slate-100',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-50',
  error: 'border-red-500/30 bg-red-500/10 text-red-50',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-50'
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4 sm:justify-end sm:px-6 sm:pb-6">
      <div className="flex w-full max-w-md flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant];

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto rounded-2xl border px-4 py-4 shadow-panel backdrop-blur-xl',
                variantStyles[toast.variant]
              )}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white/10 p-2">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-6">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm leading-6 opacity-90">{toast.description}</p> : null}
                </div>
                <button
                  type="button"
                  className="rounded-xl p-1 text-current/80 transition hover:bg-white/10 hover:text-current"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// `showToast` is exported from the toast store; no local re-export needed here.