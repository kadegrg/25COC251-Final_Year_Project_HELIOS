import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRole } from '@/hooks/use-iam';
import { PageHeader, FormField, SectionCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';

export function CreateRolePage() {
  const navigate = useNavigate();
  const mutation = useCreateRole();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const role = await mutation.mutateAsync({
        name,
        displayName: displayName || undefined,
        description: description || undefined,
      });
      navigate(`/iam/roles/${role.id}`);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Role"
        breadcrumbs={[
          { label: 'Roles', href: '/iam/roles' },
          { label: 'Create' },
        ]}
      />
      <SectionCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required />
          </FormField>
          <FormField label="Display Name" htmlFor="displayName">
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={200} />
          </FormField>
          <FormField label="Description" htmlFor="description">
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Role'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/iam/roles')}>
              Cancel
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

