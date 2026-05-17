import { Menu, MoonStar, PanelLeft, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden xl:inline-flex" onClick={toggleSidebar}>
            <PanelLeft className="size-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Compliance dashboard</p>
            <h1 className="text-lg font-semibold">SecureShip workspace</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunMedium className="size-5" /> : <MoonStar className="size-5" />}
          </Button>
          {user ? (
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <div className="grid size-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}