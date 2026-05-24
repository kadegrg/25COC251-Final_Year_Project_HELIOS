import { useState, useEffect } from 'react';
import { sessionsApi, authApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { PageHeader, SectionCard, AALBadge, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading';
import { ErrorState } from '@/components/common';
import { Monitor, Trash2, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@/types/auth.types';

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      setSessions(await sessionsApi.list());
    } catch {
      setError('Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleRevoke = async (id: string) => {
    await sessionsApi.revoke(id);
    fetchSessions();
  };

  const handleLogoutAll = async () => {
    try {
      await authApi.logoutAll();
      clearAuth();
      navigate('/login');
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  if (loading) return <PageLoading />;
  if (error && sessions.length === 0) return <ErrorState message={error} onRetry={fetchSessions} />;

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <>
      <PageHeader
        title="Sessions"
        description="Manage your active sessions"
        breadcrumbs={[{ label: 'Profile', href: '/profile' }, { label: 'Sessions' }]}
        actions={
          otherSessions.length > 0 ? (
            <ConfirmDialog
              trigger={<Button variant="destructive" size="sm"><LogOut className="mr-1 h-3.5 w-3.5" /> Revoke All Others</Button>}
              title="Revoke All Other Sessions"
              description="This will sign you out of all other devices. Your current session will remain active."
              confirmLabel="Revoke All"
              variant="destructive"
              onConfirm={handleLogoutAll}
            />
          ) : undefined
        }
      />

      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}

      <SectionCard noPadding>
        <div className="divide-y">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{parseUA(s.userAgent)}</p>
                    {s.isCurrent && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">Current</span>
                    )}
                    <AutoStatusBadge status={s.status} />
                    <AALBadge level={s.aal} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.ipAddress} · Created {new Date(s.createdAt).toLocaleString()} · Expires {new Date(s.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!s.isCurrent && (
                <ConfirmDialog
                  trigger={<Button variant="destructive" size="icon-sm"><Trash2 className="h-3.5 w-3.5" /></Button>}
                  title="Revoke Session"
                  description="This will sign out the device associated with this session."
                  confirmLabel="Revoke"
                  variant="destructive"
                  onConfirm={() => handleRevoke(s.id)}
                />
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No active sessions.</p>
          )}
        </div>
      </SectionCard>
    </>
  );
}

function parseUA(ua: string): string {
  if (!ua) return 'Unknown device';
  // Simple extraction
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 50);
}

