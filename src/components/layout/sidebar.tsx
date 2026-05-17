import { NavLink } from 'react-router-dom';
import { ShieldCheck, FileText, ScanLine, BarChart3, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dashboardNavigation } from '@/constants/navigation';
import { useUiStore } from '@/store/uiStore';

const iconMap = {
  '/dashboard': ShieldCheck,
  '/generate': FileText,
  '/audit': ScanLine,
  '/reports': BarChart3
} as const;

export function Sidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        'hidden border-r border-white/10 bg-slate-950/80 backdrop-blur xl:flex xl:flex-col',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
          <ShieldAlert className="size-5" />
        </div>
        {sidebarOpen && (
          <div>
            <div className="font-display text-lg font-semibold">SecureShip</div>
            <div className="text-xs text-muted-foreground">Compliance operating system</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {dashboardNavigation.map((item) => {
          const Icon = iconMap[item.href as keyof typeof iconMap];
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-glow'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {Icon ? <Icon className="size-4 shrink-0" /> : null}
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-5 text-xs text-muted-foreground">
        {sidebarOpen ? 'Privacy-first AI workflows for legal and compliance teams.' : 'SecureShip'}
      </div>
    </aside>
  );
}