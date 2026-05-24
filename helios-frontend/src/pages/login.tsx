import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth.store';
import { parseApiError } from '@/lib/api-errors';
import { MfaChallenge } from '@/components/auth/mfa-challenge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';
import type { MfaMethod } from '@/types/auth.types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA challenge state
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<MfaMethod[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUserFromMe = useAuthStore((s) => s.setUserFromMe);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const completeLogin = async (accessToken: string, expiresIn: number) => {
    setAuth(accessToken, expiresIn);
    const me = await authApi.me();
    setUserFromMe(me);
    navigate(from, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      if (data.type === 'authenticated') {
        await completeLogin(data.accessToken, data.expiresIn);
      } else {
        setChallengeId(data.challengeId);
        setAvailableMethods(data.availableMethods);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'ACCOUNT_LOCKED') {
        setError('Account temporarily locked. Please try again later.');
      } else if (parsed.code === 'ACCOUNT_DISABLED') {
        setError('Account is disabled. Contact an administrator.');
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSuccess = async (accessToken: string, expiresIn: number) => {
    await completeLogin(accessToken, expiresIn);
  };

  const handleMfaCancel = () => {
    setChallengeId(null);
    setAvailableMethods([]);
  };

  if (challengeId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border p-8">
          <MfaChallenge
            challengeId={challengeId}
            availableMethods={availableMethods}
            onSuccess={handleMfaSuccess}
            onCancel={handleMfaCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Helios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormField>
          <FormField label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </FormField>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="hover:text-foreground hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
