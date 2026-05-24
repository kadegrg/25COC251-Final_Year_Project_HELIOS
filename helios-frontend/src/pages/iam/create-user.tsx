import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '@/hooks/use-iam';
import { PageHeader, FormField, SectionCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseApiError } from '@/lib/api-errors';

export function CreateUserPage() {
  const navigate = useNavigate();
  const mutation = useCreateUser();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'pending'>('active');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await mutation.mutateAsync({
        email,
        username,
        password,
        displayName: displayName || undefined,
        status,
      });
      navigate(`/iam/users/${user.id}`);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create User"
        breadcrumbs={[
          { label: 'Users', href: '/iam/users' },
          { label: 'Create' },
        ]}
      />
      <SectionCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" htmlFor="email" required>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <FormField label="Username" htmlFor="username" required>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={50} required />
          </FormField>
          <FormField label="Display Name" htmlFor="displayName">
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
          </FormField>
          <FormField label="Password" htmlFor="password" required>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} maxLength={128} required />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'pending')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/iam/users')}>
              Cancel
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

