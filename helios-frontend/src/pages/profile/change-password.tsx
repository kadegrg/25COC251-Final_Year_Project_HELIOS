import { useState } from 'react';
import { passwordApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { PageHeader, SectionCard, FormField } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = currentPassword && newPassword.length >= 10 && newPassword === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await passwordApi.change({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Change Password"
        description="Update your account password"
        breadcrumbs={[{ label: 'Profile', href: '/profile' }, { label: 'Password' }]}
      />

      <SectionCard title="Change Password">
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">Password changed successfully.</div>}

          <FormField label="Current Password" htmlFor="current-pw" required>
            <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </FormField>

          <FormField label="New Password" htmlFor="new-pw" required error={newPassword && newPassword.length < 10 ? 'Minimum 10 characters' : undefined}>
            <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </FormField>

          <FormField label="Confirm New Password" htmlFor="confirm-pw" required error={confirm && confirm !== newPassword ? 'Passwords do not match' : undefined}>
            <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </FormField>

          <Button type="submit" disabled={!valid || loading}>
            {loading ? 'Changing…' : 'Change Password'}
          </Button>
        </form>
      </SectionCard>
    </>
  );
}

