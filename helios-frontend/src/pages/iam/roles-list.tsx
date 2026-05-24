import { useNavigate } from 'react-router-dom';
import { useRoles } from '@/hooks/use-iam';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, DataTable } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { ErrorState } from '@/components/common';
import { parseApiError } from '@/lib/api-errors';
import type { Column } from '@/components/common/data-table';
import type { Role } from '@/types/iam.types';

export function RolesListPage() {
  const query = useRoles();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const columns: Column<Role>[] = [
    { id: 'name', header: 'Name', cell: (r) => r.name },
    { id: 'displayName', header: 'Display Name', cell: (r) => r.display_name ?? '—' },
    { id: 'description', header: 'Description', cell: (r) => r.description ?? '—' },
    {
      id: 'isSystem',
      header: 'System',
      cell: (r) =>
        r.is_system ? (
          <Badge variant="outline" className="text-xs">System</Badge>
        ) : null,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (r) => new Date(r.created_at).toLocaleDateString(),
    },
  ];

  if (query.error) {
    const parsed = parseApiError(query.error);
    return <ErrorState message={parsed.message} onRetry={() => query.refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Manage roles and role assignments"
        actions={
          hasPermission('iam.roles.create') ? (
            <Button onClick={() => navigate('/iam/roles/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={query.data ?? []}
        keyField="id"
        isLoading={query.isLoading}
        emptyTitle="No roles found"
        onRowClick={(row) => navigate(`/iam/roles/${row.id}`)}
      />
    </div>
  );
}


