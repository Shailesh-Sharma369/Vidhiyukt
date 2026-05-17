import { cn } from '@/lib/cn';

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-3 overflow-hidden rounded-full bg-white/8', className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand-blue via-accent to-secondary transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}