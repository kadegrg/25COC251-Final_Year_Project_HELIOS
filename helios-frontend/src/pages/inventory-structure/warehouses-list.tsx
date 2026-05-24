import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWarehouses, useArchiveWarehouse, useSites } from '@/hooks/use-inventory-structure';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, DataTable, PaginationFooter, AutoStatusBadge, ActionMenu, ConfirmDialog, ErrorState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/components/common/data-table';
import type { Warehouse } from '@/types/inventory-structure.types';
import { parseApiError } from '@/lib/api-errors';

export function WarehousesListPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [siteFilter, setSiteFilter] = useState(searchParams.get('siteId') ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;
  const query = useWarehouses({ page, limit, siteId: siteFilter || undefined, status: statusFilter || undefined });
  const sitesQuery = useSites({ limit: 100 });
  const archiveMutation = useArchiveWarehouse();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const columns: Column<Warehouse>[] = [
    { id: 'warehouseCode', header: 'Code', cell: (r) => r.warehouseCode },
    { id: 'warehouseName', header: 'Name', cell: (r) => r.warehouseName },
    { id: 'siteId', header: 'Site', cell: (r) => r.siteId },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    {
      id: 'actions', header: '', cell: (r) => {
        const items = [
          { label: 'View', onClick: () => navigate(`/inventory/structure/warehouses/${r.warehouseId}`) },
          ...(hasPermission('inventory.warehouse.update') ? [{ label: 'Edit', onClick: () => navigate(`/inventory/structure/warehouses/${r.warehouseId}/edit`) }] : []),
        ];
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <ActionMenu actions={items} />
            {hasPermission('inventory.warehouse.update') && (
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Archive Warehouse"
                description={`Archive "${r.warehouseName}"?`}
                confirmLabel="Archive"
                variant="destructive"
                onConfirm={async () => { await archiveMutation.mutateAsync(r.warehouseId); }}
              />
            )}
          </div>
        );
      },
    },
  ];

  if (query.error) {
    return <ErrorState message={parseApiError(query.error).message} onRetry={() => query.refetch()} />;
  }

  const warehouses = query.data?.data ?? [];
  const pagination = query.data?.meta?.pagination;
  const sites = sitesQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Manage inventory warehouses"
        actions={
          hasPermission('inventory.warehouse.create') ? (
            <Button onClick={() => navigate('/inventory/structure/warehouses/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Warehouse
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex gap-3">
        <select value={siteFilter} onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName} ({s.siteId})</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <DataTable columns={columns} data={warehouses} keyField="warehouseId" isLoading={query.isLoading} emptyTitle="No warehouses found" emptyDescription="Create your first warehouse to get started." onRowClick={(row) => navigate(`/inventory/structure/warehouses/${row.warehouseId}`)} />
      {pagination && pagination.total > 0 && (
        <PaginationFooter page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  );
}



