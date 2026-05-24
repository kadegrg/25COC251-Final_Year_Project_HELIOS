import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSites, useArchiveSite } from '@/hooks/use-inventory-structure';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, DataTable, PaginationFooter, AutoStatusBadge, ActionMenu, ConfirmDialog, ErrorState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/components/common/data-table';
import type { Site } from '@/types/inventory-structure.types';
import { parseApiError } from '@/lib/api-errors';

export function SitesListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;
  const query = useSites({ page, limit, status: statusFilter || undefined });
  const archiveMutation = useArchiveSite();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const columns: Column<Site>[] = [
    { id: 'siteId', header: 'Site ID', cell: (r) => r.siteId },
    { id: 'siteName', header: 'Name', cell: (r) => r.siteName },
    { id: 'siteType', header: 'Type', cell: (r) => r.siteType },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    { id: 'timezone', header: 'Timezone', cell: (r) => r.timezone ?? '—' },
    {
      id: 'actions',
      header: '',
      cell: (r) => {
        const items = [
          { label: 'View', onClick: () => navigate(`/inventory/structure/sites/${r.siteId}`) },
          ...(hasPermission('inventory.site.update')
            ? [{ label: 'Edit', onClick: () => navigate(`/inventory/structure/sites/${r.siteId}/edit`) }]
            : []),
        ];
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <ActionMenu actions={items} />
            {hasPermission('inventory.site.archive') && (
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Archive Site"
                description={`Archive "${r.siteName}"? This sets status to DECOMMISSIONED.`}
                confirmLabel="Archive"
                variant="destructive"
                onConfirm={async () => { await archiveMutation.mutateAsync(r.siteId); }}
              />
            )}
          </div>
        );
      },
    },
  ];

  if (query.error) {
    const parsed = parseApiError(query.error);
    return <ErrorState message={parsed.message} onRetry={() => query.refetch()} />;
  }

  const sites = query.data?.data ?? [];
  const pagination = query.data?.meta?.pagination;

  return (
    <div>
      <PageHeader
        title="Sites"
        description="Manage inventory sites"
        actions={
          hasPermission('inventory.site.create') ? (
            <Button onClick={() => navigate('/inventory/structure/sites/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Site
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={sites}
        keyField="inventorySiteId"
        isLoading={query.isLoading}
        emptyTitle="No sites found"
        emptyDescription="Create your first site to get started."
        onRowClick={(row) => navigate(`/inventory/structure/sites/${row.siteId}`)}
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



