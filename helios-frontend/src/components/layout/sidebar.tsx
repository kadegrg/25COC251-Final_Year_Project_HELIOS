import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Package,
  ArrowRightLeft,
  ClipboardList,
  Users,
  KeyRound,
  Lock,
  Puzzle,
  GitCommitHorizontal,
  BarChart3,
  Upload,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavGroup {
  label: string;
  items: { label: string; to: string; icon: LucideIcon }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Structure', to: '/inventory/structure', icon: Building2 },
      { label: 'Catalogue', to: '/inventory/catalogue', icon: BookOpen },
      { label: 'Stock', to: '/inventory/stock', icon: Package },
      { label: 'Movements', to: '/inventory/movements', icon: GitCommitHorizontal },
      { label: 'Reports', to: '/inventory/reports', icon: BarChart3 },
      { label: 'Imports', to: '/inventory/imports', icon: Upload },
      { label: 'Audit Events', to: '/inventory/audit-events', icon: Shield },
      { label: 'Transfers', to: '/inventory/transfers', icon: ArrowRightLeft },
      { label: 'Adjustments', to: '/inventory/adjustments', icon: ClipboardList },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', to: '/iam/users', icon: Users },
      { label: 'Roles', to: '/iam/roles', icon: KeyRound },
      { label: 'Permissions', to: '/iam/permissions', icon: Lock },
      { label: 'Plugins', to: '/system/plugins', icon: Puzzle },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar-background text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold tracking-tight">Helios</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

