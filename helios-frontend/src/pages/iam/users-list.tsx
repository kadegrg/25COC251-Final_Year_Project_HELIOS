import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/use-iam';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, DataTable, PaginationFooter, AutoStatusBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Column } from '@/components/common/data-table';
import type { UserSummary } from '@/types/iam.types';
import { ErrorState } from '@/components/common';
import { parseApiError } from '@/lib/api-errors';

export function UsersListPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const query = useUsers(page, limit);
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const columns: Column<UserSummary>[] = [
    { id: 'username', header: 'Username', cell: (r) => r.username },
    { id: 'email', header: 'Email', cell: (r) => r.email },
    { id: 'displayName', header: 'Display Name', cell: (r) => r.displayName ?? '—' },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  if (query.error) {
    const parsed = parseApiError(query.error);
    return <ErrorState message={parsed.message} onRetry={() => query.refetch()} />;
  }

  const users = query.data?.data ?? [];
  const pagination = query.data?.meta?.pagination;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage user accounts"
        actions={
          hasPermission('iam.users.create') ? (
            <Button onClick={() => navigate('/iam/users/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={users}
        keyField="id"
        isLoading={query.isLoading}
        emptyTitle="No users found"
        emptyDescription="Create your first user to get started."
        onRowClick={(row) => navigate(`/iam/users/${row.id}`)}
      />
      {pagination && pagination.total > 0 && (
        <PaginationFooter
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

