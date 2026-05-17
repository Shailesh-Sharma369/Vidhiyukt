import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

export function AuthShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-panel lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:block">
            <div className="absolute inset-0 hero-grid opacity-25" />
            <div className="absolute inset-0 bg-hero-radial opacity-80" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="font-display text-xl font-semibold">SecureShip</div>
                  <div className="text-sm text-slate-300">Compliance OS for privacy-first teams</div>
                </div>
              </div>
              <div className="max-w-lg space-y-4">
                <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  {eyebrow}
                </span>
                <h1 className="text-4xl font-semibold text-white">{title}</h1>
                <p className="text-lg leading-8 text-slate-300">{description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Local AI drafts</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">GDPR scorecards</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Audit-ready reports</div>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-10">{children}</div>
        </div>
      </div>
    </div>
  );
}