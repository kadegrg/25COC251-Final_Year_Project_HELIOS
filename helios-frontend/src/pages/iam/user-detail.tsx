import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser, useUpdateUser, useRoles, useAssignRoleToUser, useRemoveRoleFromUser } from '@/hooks/use-iam';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, SectionCard, FormField, QueryResult, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { parseApiError } from '@/lib/api-errors';
import type { RoleAssignment, ScopeType } from '@/types/iam.types';
import { Trash2 } from 'lucide-react';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const userQuery = useUser(userId!);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  return (
    <QueryResult isLoading={userQuery.isLoading} error={userQuery.error} data={userQuery.data} notFoundNoun="user" onRetry={() => userQuery.refetch()}>
      {userQuery.data && (
        <div className="space-y-6">
          <PageHeader
            title={userQuery.data.displayName || userQuery.data.username}
            breadcrumbs={[
              { label: 'Users', href: '/iam/users' },
              { label: userQuery.data.username },
            ]}
          />
          <UserInfoSection userId={userId!} />
          {hasPermission('iam.roles.assign') && <UserRolesSection userId={userId!} />}
        </div>
      )}
    </QueryResult>
  );
}

function UserInfoSection({ userId }: { userId: string }) {
  const userQuery = useUser(userId);
  const updateMutation = useUpdateUser(userId);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canEdit = hasPermission('iam.users.update');

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const user = userQuery.data;
  if (!user) return null;

  const startEdit = () => {
    setDisplayName(user.displayName ?? '');
    setStatus(user.status);
    setEditing(true);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    try {
      await updateMutation.mutateAsync({
        displayName: displayName || undefined,
        status: status as 'active' | 'locked' | 'disabled',
      });
      setEditing(false);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <SectionCard
      title="User Information"
      actions={
        canEdit && !editing ? (
          <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>
        ) : undefined
      }
    >
      {editing ? (
        <div className="space-y-4 max-w-md">
          <FormField label="Display Name" htmlFor="dn">
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
          </FormField>
          <FormField label="Status" htmlFor="st">
            <select
              id="st"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="disabled">Disabled</option>
            </select>
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
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted-foreground">Username</dt>
          <dd>{user.username}</dd>
          <dt className="text-muted-foreground">Display Name</dt>
          <dd>{user.displayName ?? '—'}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd><AutoStatusBadge status={user.status} /></dd>
          <dt className="text-muted-foreground">Email Verified</dt>
          <dd>{user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleString() : 'Not verified'}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{new Date(user.createdAt).toLocaleString()}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{new Date(user.updatedAt).toLocaleString()}</dd>
        </dl>
      )}
    </SectionCard>
  );
}

function UserRolesSection({ userId }: { userId: string }) {
  const rolesQuery = useRoles();
  const assignMutation = useAssignRoleToUser(userId);
  const removeMutation = useRemoveRoleFromUser(userId);

  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [roleId, setRoleId] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('GLOBAL');
  const [scopeValue, setScopeValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const roles = rolesQuery.data ?? [];

  const handleAssign = async () => {
    if (!roleId) return;
    setError('');
    try {
      const assignment = await assignMutation.mutateAsync({
        roleId,
        scopeType,
        scopeValue: scopeValue || undefined,
        expiresAt: expiresAt || undefined,
      });
      setAssignments((prev) => [...prev, assignment]);
      setRoleId('');
      setScopeValue('');
      setExpiresAt('');
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      await removeMutation.mutateAsync(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const getRoleName = (rid: string) => roles.find((r) => r.id === rid)?.name ?? rid;

  return (
    <SectionCard title="Role Assignments">
      {/* Current assignments */}
      {assignments.length > 0 && (
        <div className="mb-4 space-y-2">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getRoleName(a.role_id)}</Badge>
                <span className="text-muted-foreground">{a.scope_type}</span>
                {a.scope_value && <span className="text-muted-foreground">({a.scope_value})</span>}
                {a.expires_at && <span className="text-muted-foreground">expires {new Date(a.expires_at).toLocaleDateString()}</span>}
              </div>
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Remove Role Assignment"
                description={`Remove the "${getRoleName(a.role_id)}" role assignment from this user?`}
                confirmLabel="Remove"
                variant="destructive"
                onConfirm={() => handleRemove(a.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Assign new role */}
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Role" htmlFor="assign-role">
          <select
            id="assign-role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.display_name || r.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Scope" htmlFor="scope-type">
          <select
            id="scope-type"
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value as ScopeType)}
            className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value="GLOBAL">GLOBAL</option>
            <option value="SITE">SITE</option>
            <option value="LOCATION">LOCATION</option>
            <option value="OWN">OWN</option>
          </select>
        </FormField>
        <FormField label="Scope Value" htmlFor="scope-val">
          <Input id="scope-val" value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} placeholder="Optional" className="w-36" />
        </FormField>
        <FormField label="Expires At" htmlFor="expires">
          <Input id="expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-48" />
        </FormField>
        <Button size="sm" onClick={handleAssign} disabled={!roleId || assignMutation.isPending}>
          {assignMutation.isPending ? 'Assigning…' : 'Assign'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive-foreground">{error}</p>}
    </SectionCard>
  );
}

