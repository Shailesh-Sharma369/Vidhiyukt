import type { ReactNode } from 'react';
import { Footer } from './footer';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <Footer />
    </div>
  );
}