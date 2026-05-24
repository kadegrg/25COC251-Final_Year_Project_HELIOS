import { useParams, useNavigate } from 'react-router-dom';
import { useLocation as useLocationQuery, useArchiveLocation } from '@/hooks/use-inventory-structure';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, SectionCard, QueryResult, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const query = useLocationQuery(locationId!);
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const archiveMutation = useArchiveLocation();

  return (
    <QueryResult isLoading={query.isLoading} error={query.error} data={query.data} notFoundNoun="location" onRetry={() => query.refetch()}>
      {query.data && (
        <div className="space-y-6">
          <PageHeader
            title={query.data.locationName}
            breadcrumbs={[
              { label: 'Locations', href: '/inventory/structure/locations' },
              { label: query.data.locationCode },
            ]}
            actions={
              <div className="flex gap-2">
                {hasPermission('inventory.location.update') && (
                  <Button variant="outline" onClick={() => navigate(`/inventory/structure/locations/${locationId}/edit`)}>Edit</Button>
                )}
                {hasPermission('inventory.location.archive') && (
                  <ConfirmDialog
                    trigger={<Button variant="destructive">Archive</Button>}
                    title="Archive Location"
                    description={`Archive "${query.data.locationName}"?`}
                    confirmLabel="Archive"
                    variant="destructive"
                    onConfirm={async () => {
                      await archiveMutation.mutateAsync(locationId!);
                      navigate('/inventory/structure/locations');
                    }}
                  />
                )}
              </div>
            }
          />
          <SectionCard title="Location Information">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-lg">
              <dt className="text-muted-foreground">Code</dt>
              <dd>{query.data.locationCode}</dd>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{query.data.locationName}</dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{query.data.locationType}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd><AutoStatusBadge status={query.data.status} /></dd>
              <dt className="text-muted-foreground">Site</dt>
              <dd>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/inventory/structure/sites/${query.data!.siteId}`)}>
                  {query.data.siteId}
                </Button>
              </dd>
              <dt className="text-muted-foreground">Warehouse</dt>
              <dd>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/inventory/structure/warehouses/${query.data!.warehouseId}`)}>
                  {query.data.warehouseId}
                </Button>
              </dd>
              <dt className="text-muted-foreground">Parent Location</dt>
              <dd>
                {query.data.parentLocationId ? (
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/inventory/structure/locations/${query.data!.parentLocationId}`)}>
                    {query.data.parentLocationId}
                  </Button>
                ) : '—'}
              </dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(query.data.createdAt).toLocaleString()}</dd>
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{new Date(query.data.updatedAt).toLocaleString()}</dd>
            </dl>
          </SectionCard>
          <SectionCard title="Flags">
            <div className="flex gap-2 flex-wrap">
              <Badge variant={query.data.isPickable ? 'default' : 'outline'}>Pickable: {query.data.isPickable ? 'Yes' : 'No'}</Badge>
              <Badge variant={query.data.isReceivable ? 'default' : 'outline'}>Receivable: {query.data.isReceivable ? 'Yes' : 'No'}</Badge>
              <Badge variant={query.data.isDispatchable ? 'default' : 'outline'}>Dispatchable: {query.data.isDispatchable ? 'Yes' : 'No'}</Badge>
              <Badge variant={query.data.isQuarantine ? 'destructive' : 'outline'}>Quarantine: {query.data.isQuarantine ? 'Yes' : 'No'}</Badge>
            </div>
          </SectionCard>
          {query.data.capacityJson && Object.keys(query.data.capacityJson).length > 0 && (
            <SectionCard title="Capacity">
              <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(query.data.capacityJson, null, 2)}</pre>
            </SectionCard>
          )}
          {query.data.metadata && Object.keys(query.data.metadata).length > 0 && (
            <SectionCard title="Metadata">
              <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(query.data.metadata, null, 2)}</pre>
            </SectionCard>
          )}
        </div>
      )}
    </QueryResult>
  );
}




