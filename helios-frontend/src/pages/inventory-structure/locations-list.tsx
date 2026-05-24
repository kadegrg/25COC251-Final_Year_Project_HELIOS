import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLocations, useArchiveLocation, useSites, useWarehouses } from '@/hooks/use-inventory-structure';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, DataTable, PaginationFooter, AutoStatusBadge, ActionMenu, ConfirmDialog, ErrorState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/components/common/data-table';
import type { Location } from '@/types/inventory-structure.types';
import { parseApiError } from '@/lib/api-errors';

export function LocationsListPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [siteFilter, setSiteFilter] = useState(searchParams.get('siteId') ?? '');
  const [warehouseFilter, setWarehouseFilter] = useState(searchParams.get('warehouseId') ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const limit = 20;

  const query = useLocations({
    page, limit,
    siteId: siteFilter || undefined,
    warehouseId: warehouseFilter || undefined,
    status: statusFilter || undefined,
    locationType: typeFilter || undefined,
  });
  const sitesQuery = useSites({ limit: 100 });
  const warehousesQuery = useWarehouses({ limit: 100, siteId: siteFilter || undefined });
  const archiveMutation = useArchiveLocation();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const columns: Column<Location>[] = [
    { id: 'locationCode', header: 'Code', cell: (r) => r.locationCode },
    { id: 'locationName', header: 'Name', cell: (r) => r.locationName },
    { id: 'locationType', header: 'Type', cell: (r) => r.locationType },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    {
      id: 'flags', header: 'Flags', cell: (r) => (
        <div className="flex gap-1 flex-wrap">
          {r.isPickable && <Badge variant="outline">Pick</Badge>}
          {r.isReceivable && <Badge variant="outline">Recv</Badge>}
          {r.isDispatchable && <Badge variant="outline">Disp</Badge>}
          {r.isQuarantine && <Badge variant="destructive">Quar</Badge>}
        </div>
      ),
    },
    {
      id: 'actions', header: '', cell: (r) => {
        const items = [
          { label: 'View', onClick: () => navigate(`/inventory/structure/locations/${r.locationId}`) },
          ...(hasPermission('inventory.location.update') ? [{ label: 'Edit', onClick: () => navigate(`/inventory/structure/locations/${r.locationId}/edit`) }] : []),
        ];
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <ActionMenu actions={items} />
            {hasPermission('inventory.location.archive') && (
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Archive Location"
                description={`Archive "${r.locationName}"?`}
                confirmLabel="Archive"
                variant="destructive"
                onConfirm={async () => { await archiveMutation.mutateAsync(r.locationId); }}
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

  const locations = query.data?.data ?? [];
  const pagination = query.data?.meta?.pagination;
  const sites = sitesQuery.data?.data ?? [];
  const warehouses = warehousesQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Manage inventory locations"
        actions={
          hasPermission('inventory.location.create') ? (
            <Button onClick={() => navigate('/inventory/structure/locations/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Location
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex gap-3 flex-wrap">
        <select value={siteFilter} onChange={(e) => { setSiteFilter(e.target.value); setWarehouseFilter(''); setPage(1); }} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
        </select>
        <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Warehouses</option>
          {warehouses.map((w) => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <input value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} placeholder="Location type…" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs w-40" />
      </div>
      <DataTable columns={columns} data={locations} keyField="locationId" isLoading={query.isLoading} emptyTitle="No locations found" emptyDescription="Create your first location to get started." onRowClick={(row) => navigate(`/inventory/structure/locations/${row.locationId}`)} />
      {pagination && pagination.total > 0 && (
        <PaginationFooter page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  );
}



