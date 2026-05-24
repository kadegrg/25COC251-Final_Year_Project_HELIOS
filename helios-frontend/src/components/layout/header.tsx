import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Key, Monitor } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/auth-api';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* proceed anyway */ }
    clearAuth();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Profile', icon: User, to: '/profile' },
    { label: 'Security', icon: Key, to: '/profile/mfa' },
    { label: 'Sessions', icon: Monitor, to: '/profile/sessions' },
    { label: 'Settings', icon: Settings, to: '/settings' },
  ];

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
        >
          <User className="h-4 w-4" />
          <span>{user?.displayName || user?.username || 'User'}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover py-1 shadow-md">
            {menuItems.map((item) => (
              <button
                key={item.to}
                onClick={() => { setMenuOpen(false); navigate(item.to); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </button>
            ))}
            <hr className="my-1 border-border" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
