import { useParams, useNavigate } from 'react-router-dom';
import { useSite, useArchiveSite } from '@/hooks/use-inventory-structure';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, SectionCard, QueryResult, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const query = useSite(siteId!);
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const archiveMutation = useArchiveSite();

  return (
    <QueryResult isLoading={query.isLoading} error={query.error} data={query.data} notFoundNoun="site" onRetry={() => query.refetch()}>
      {query.data && (
        <div className="space-y-6">
          <PageHeader
            title={query.data.siteName}
            breadcrumbs={[
              { label: 'Sites', href: '/inventory/structure/sites' },
              { label: query.data.siteId },
            ]}
            actions={
              <div className="flex gap-2">
                {hasPermission('inventory.site.update') && (
                  <Button variant="outline" onClick={() => navigate(`/inventory/structure/sites/${siteId}/edit`)}>Edit</Button>
                )}
                {hasPermission('inventory.site.archive') && query.data.status !== 'DECOMMISSIONED' && (
                  <ConfirmDialog
                    trigger={<Button variant="destructive">Archive</Button>}
                    title="Archive Site"
                    description={`Archive "${query.data.siteName}"? This sets status to DECOMMISSIONED.`}
                    confirmLabel="Archive"
                    variant="destructive"
                    onConfirm={async () => {
                      await archiveMutation.mutateAsync(siteId!);
                      navigate('/inventory/structure/sites');
                    }}
                  />
                )}
              </div>
            }
          />
          <SectionCard title="Site Information">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-lg">
              <dt className="text-muted-foreground">Site ID</dt>
              <dd>{query.data.siteId}</dd>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{query.data.siteName}</dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{query.data.siteType}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd><AutoStatusBadge status={query.data.status} /></dd>
              <dt className="text-muted-foreground">Timezone</dt>
              <dd>{query.data.timezone ?? '—'}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(query.data.createdAt).toLocaleString()}</dd>
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{new Date(query.data.updatedAt).toLocaleString()}</dd>
            </dl>
          </SectionCard>
          {query.data.addressJson && Object.keys(query.data.addressJson).length > 0 && (
            <SectionCard title="Address">
              <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(query.data.addressJson, null, 2)}</pre>
            </SectionCard>
          )}
          {query.data.contactJson && Object.keys(query.data.contactJson).length > 0 && (
            <SectionCard title="Contact">
              <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(query.data.contactJson, null, 2)}</pre>
            </SectionCard>
          )}
          {query.data.metadata && Object.keys(query.data.metadata).length > 0 && (
            <SectionCard title="Metadata">
              <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(query.data.metadata, null, 2)}</pre>
            </SectionCard>
          )}
          <SectionCard title="Related">
            <Button variant="link" className="p-0" onClick={() => navigate(`/inventory/structure/warehouses?siteId=${query.data!.siteId}`)}>
              View Warehouses →
            </Button>
          </SectionCard>
        </div>
      )}
    </QueryResult>
  );
}



