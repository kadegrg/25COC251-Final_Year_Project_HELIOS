import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { passwordApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = token && newPassword.length >= 10 && newPassword === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await passwordApi.reset({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'NOT_IMPLEMENTED') {
        setError('Password reset is not yet available. Contact an administrator.');
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 rounded-lg border p-8 text-center">
          <h1 className="text-xl font-semibold">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground">No reset token provided.</p>
          <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your new password</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              Password has been reset. You can now sign in.
            </div>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">Go to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
            <FormField label="New Password" htmlFor="reset-pw" required error={newPassword && newPassword.length < 10 ? 'Minimum 10 characters' : undefined}>
              <Input id="reset-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </FormField>
            <FormField label="Confirm Password" htmlFor="reset-confirm" required error={confirm && confirm !== newPassword ? 'Passwords do not match' : undefined}>
              <Input id="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </FormField>
            <Button type="submit" disabled={!valid || loading} className="w-full">
              {loading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

