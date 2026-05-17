import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({
  title = 'Loading SecureShip',
  description = 'Preparing your compliance workspace.'
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}