import { useState } from 'react';
import { usePermissions, useCreatePermission } from '@/hooks/use-iam';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, DataTable, SectionCard, FormField } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/common';
import { parseApiError } from '@/lib/api-errors';
import { Plus, X } from 'lucide-react';
import type { Column } from '@/components/common/data-table';
import type { PermissionRecord } from '@/types/iam.types';

export function PermissionsListPage() {
  const query = usePermissions();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');

  const columns: Column<PermissionRecord>[] = [
    { id: 'key', header: 'Key', cell: (r) => <code className="text-xs">{r.key}</code> },
    { id: 'displayName', header: 'Display Name', cell: (r) => r.display_name ?? '—' },
    { id: 'description', header: 'Description', cell: (r) => r.description ?? '—' },
    {
      id: 'aal',
      header: 'AAL',
      cell: (r) => <Badge variant="outline">{r.default_required_aal}</Badge>,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (r) => new Date(r.created_at).toLocaleDateString(),
    },
  ];

  if (query.error) {
    return <ErrorState message={parseApiError(query.error).message} onRetry={() => query.refetch()} />;
  }

  const allPerms = query.data ?? [];
  const filtered = filter
    ? allPerms.filter((p) => p.key.includes(filter.toLowerCase()))
    : allPerms;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Permissions"
        description="View and manage permissions"
        actions={
          hasPermission('iam.permissions.create') ? (
            <Button onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {showCreate ? 'Cancel' : 'Create Permission'}
            </Button>
          ) : undefined
        }
      />

      {showCreate && <CreatePermissionForm onDone={() => setShowCreate(false)} />}

      <div className="max-w-xs">
        <Input
          placeholder="Filter by key prefix…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyField="id"
        isLoading={query.isLoading}
        emptyTitle="No permissions found"
      />
    </div>
  );
}

function CreatePermissionForm({ onDone }: { onDone: () => void }) {
  const mutation = useCreatePermission();
  const [key, setKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [aal, setAal] = useState(1);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({
        key,
        displayName: displayName || undefined,
        description: description || undefined,
        defaultRequiredAal: aal,
      });
      onDone();
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <SectionCard title="New Permission" className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Key" htmlFor="pkey" required>
          <Input
            id="pkey"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="service.resource.action"
            pattern="^[a-z]+\.[a-z_]+\.[a-z]+$"
            required
          />
        </FormField>
        <FormField label="Display Name" htmlFor="pdisplay">
          <Input id="pdisplay" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={200} />
        </FormField>
        <FormField label="Description" htmlFor="pdesc">
          <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </FormField>
        <FormField label="Default Required AAL" htmlFor="paal">
          <select
            id="paal"
            value={aal}
            onChange={(e) => setAal(Number(e.target.value))}
            className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </FormField>
        {error && <p className="text-sm text-destructive-foreground">{error}</p>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </Button>
      </form>
    </SectionCard>
  );
}

