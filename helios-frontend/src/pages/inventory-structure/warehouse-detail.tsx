import { useParams, useNavigate } from 'react-router-dom';
import { useWarehouse, useArchiveWarehouse } from '@/hooks/use-inventory-structure';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, SectionCard, QueryResult, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';

export function WarehouseDetailPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const query = useWarehouse(warehouseId!);
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const archiveMutation = useArchiveWarehouse();

  return (
    <QueryResult isLoading={query.isLoading} error={query.error} data={query.data} notFoundNoun="warehouse" onRetry={() => query.refetch()}>
      {query.data && (
        <div className="space-y-6">
          <PageHeader
            title={query.data.warehouseName}
            breadcrumbs={[
              { label: 'Warehouses', href: '/inventory/structure/warehouses' },
              { label: query.data.warehouseCode },
            ]}
            actions={
              <div className="flex gap-2">
                {hasPermission('inventory.warehouse.update') && (
                  <Button variant="outline" onClick={() => navigate(`/inventory/structure/warehouses/${warehouseId}/edit`)}>Edit</Button>
                )}
                {hasPermission('inventory.warehouse.update') && (
                  <ConfirmDialog
                    trigger={<Button variant="destructive">Archive</Button>}
                    title="Archive Warehouse"
                    description={`Archive "${query.data.warehouseName}"?`}
                    confirmLabel="Archive"
                    variant="destructive"
                    onConfirm={async () => {
                      await archiveMutation.mutateAsync(warehouseId!);
                      navigate('/inventory/structure/warehouses');
                    }}
                  />
                )}
              </div>
            }
          />
          <SectionCard title="Warehouse Information">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-lg">
              <dt className="text-muted-foreground">Warehouse Code</dt>
              <dd>{query.data.warehouseCode}</dd>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{query.data.warehouseName}</dd>
              <dt className="text-muted-foreground">Site</dt>
              <dd>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/inventory/structure/sites/${query.data!.siteId}`)}>
                  {query.data.siteId}
                </Button>
              </dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd><AutoStatusBadge status={query.data.status} /></dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(query.data.createdAt).toLocaleString()}</dd>
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{new Date(query.data.updatedAt).toLocaleString()}</dd>
            </dl>
          </SectionCard>
          {query.data.metadata && Object.keys(query.data.metadata).length > 0 && (
            <SectionCard title="Metadata">
              <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(query.data.metadata, null, 2)}</pre>
            </SectionCard>
          )}
          <SectionCard title="Related">
            <Button variant="link" className="p-0" onClick={() => navigate(`/inventory/structure/locations?warehouseId=${query.data!.warehouseId}`)}>
              View Locations →
            </Button>
          </SectionCard>
        </div>
      )}
    </QueryResult>
  );
}


