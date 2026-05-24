import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRoles, useUpdateRole, usePermissions, useAssignPermissionToRole, useRemovePermissionFromRole } from '@/hooks/use-iam';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, SectionCard, FormField, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading';
import { NotFoundState, ErrorState } from '@/components/common';
import { parseApiError } from '@/lib/api-errors';
import { Trash2 } from 'lucide-react';

export function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const rolesQuery = useRoles();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (rolesQuery.isLoading) return <PageLoading />;
  if (rolesQuery.error) return <ErrorState message={parseApiError(rolesQuery.error).message} onRetry={() => rolesQuery.refetch()} />;

  const role = rolesQuery.data?.find((r) => r.id === roleId);
  if (!role) return <NotFoundState noun="role" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.display_name || role.name}
        breadcrumbs={[
          { label: 'Roles', href: '/iam/roles' },
          { label: role.name },
        ]}
      />
      <RoleInfoSection roleId={roleId!} />
      {hasPermission('iam.permissions.assign') && <RolePermissionsSection roleId={roleId!} />}
    </div>
  );
}

function RoleInfoSection({ roleId }: { roleId: string }) {
  const rolesQuery = useRoles();
  const updateMutation = useUpdateRole(roleId);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canEdit = hasPermission('iam.roles.update');

  const role = rolesQuery.data?.find((r) => r.id === roleId);
  if (!role) return null;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const startEdit = () => {
    setDisplayName(role.display_name ?? '');
    setDescription(role.description ?? '');
    setEditing(true);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    try {
      await updateMutation.mutateAsync({
        displayName: displayName || undefined,
        description: description || undefined,
      });
      setEditing(false);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <SectionCard
      title="Role Information"
      actions={
        canEdit && !editing ? (
          <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>
        ) : undefined
      }
    >
      {editing ? (
        <div className="space-y-4 max-w-md">
          <FormField label="Display Name" htmlFor="rdn">
            <Input id="rdn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={200} />
          </FormField>
          <FormField label="Description" htmlFor="rdesc">
            <Textarea id="rdesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-lg">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{role.name}</dd>
          <dt className="text-muted-foreground">Display Name</dt>
          <dd>{role.display_name ?? '—'}</dd>
          <dt className="text-muted-foreground">Description</dt>
          <dd>{role.description ?? '—'}</dd>
          <dt className="text-muted-foreground">System Role</dt>
          <dd>{role.is_system ? <Badge variant="outline">System</Badge> : 'No'}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{new Date(role.created_at).toLocaleString()}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{new Date(role.updated_at).toLocaleString()}</dd>
        </dl>
      )}
    </SectionCard>
  );
}

function RolePermissionsSection({ roleId }: { roleId: string }) {
  const permissionsQuery = usePermissions();
  const assignMutation = useAssignPermissionToRole(roleId);
  const removeMutation = useRemovePermissionFromRole(roleId);

  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [selectedPermId, setSelectedPermId] = useState('');
  const [error, setError] = useState('');

  const allPermissions = permissionsQuery.data ?? [];

  const handleAssign = async () => {
    if (!selectedPermId) return;
    setError('');
    try {
      await assignMutation.mutateAsync({ permissionId: selectedPermId });
      setAssignedIds((prev) => new Set(prev).add(selectedPermId));
      setSelectedPermId('');
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const handleRemove = async (permId: string) => {
    setError('');
    try {
      await removeMutation.mutateAsync(permId);
      setAssignedIds((prev) => {
        const next = new Set(prev);
        next.delete(permId);
        return next;
      });
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const assignedPermissions = allPermissions.filter((p) => assignedIds.has(p.id));
  const availablePermissions = allPermissions.filter((p) => !assignedIds.has(p.id));

  return (
    <SectionCard title="Permission Assignments">
      {assignedPermissions.length > 0 && (
        <div className="mb-4 space-y-2">
          {assignedPermissions.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="text-xs">{p.key}</code>
                {p.display_name && <span className="text-muted-foreground">— {p.display_name}</span>}
              </div>
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Remove Permission"
                description={`Remove "${p.key}" from this role?`}
                confirmLabel="Remove"
                variant="destructive"
                onConfirm={() => handleRemove(p.id)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <FormField label="Permission" htmlFor="assign-perm">
          <select
            id="assign-perm"
            value={selectedPermId}
            onChange={(e) => setSelectedPermId(e.target.value)}
            className="flex h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value="">Select permission…</option>
            {availablePermissions.map((p) => (
              <option key={p.id} value={p.id}>{p.key}</option>
            ))}
          </select>
        </FormField>
        <Button size="sm" onClick={handleAssign} disabled={!selectedPermId || assignMutation.isPending}>
          {assignMutation.isPending ? 'Assigning…' : 'Assign'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive-foreground">{error}</p>}
    </SectionCard>
  );
}



