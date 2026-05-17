import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">SecureShip</div>
            <div className="text-sm text-muted-foreground">Privacy-first AI compliance platform</div>
          </div>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          SecureShip helps teams generate legal artifacts, audit compliance posture, and present clear reports without sending sensitive workflows off-device.
        </p>
      </div>
    </footer>
  );
}