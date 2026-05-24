import { useParams, useNavigate } from 'react-router-dom';
import { useSkuDetail, useArchiveSku, useCategories } from '@/hooks/use-sku-metadata';
import { useHasPermissions } from '@/hooks/use-has-permission';
import { SKU_METADATA_PERMISSIONS } from '@/types/sku-metadata.types';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { DetailPanel } from '@/components/common/detail-panel';
import { TabbedDetailLayout } from '@/components/common/tabbed-detail-layout';
import { QueryResult } from '@/components/common/query-result';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { AutoStatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { SkuMetadataPanel } from './sku-metadata-panel';

export function SkuDetailPage() {
  const { skuId } = useParams<{ skuId: string }>();
  const navigate = useNavigate();
  const q = useSkuDetail(skuId!);
  const categoriesQ = useCategories();
  const archive = useArchiveSku();
  const sku = q.data;
  const perms = useHasPermissions({
    canEdit: SKU_METADATA_PERMISSIONS.SKU_UPDATE,
    canArchive: SKU_METADATA_PERMISSIONS.SKU_ARCHIVE,
  });

  const categories = categoriesQ.data ?? [];
  const categoryMap = new Map(categories.map((c) => [c.categoryId, c.categoryName]));

  const handleArchive = async () => {
    await archive.mutateAsync(skuId!);
    navigate('/inventory/catalogue/skus');
  };

  return (
    <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="SKU" onRetry={() => q.refetch()}>
      {sku && (
        <>
          <PageHeader
            title={sku.skuName}
            breadcrumbs={[
              { label: 'Catalogue', href: '/inventory/catalogue' },
              { label: 'SKUs', href: '/inventory/catalogue/skus' },
              { label: sku.skuCode },
            ]}
            actions={
              <div className="flex gap-2">
                {perms.canEdit && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/inventory/catalogue/skus/${skuId}/edit`)}>
                    <Pencil className="mr-1.5 h-4 w-4" /> Edit
                  </Button>
                )}
                {perms.canArchive && sku.status !== 'DISCONTINUED' && (
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="destructive">
                        <Trash2 className="mr-1.5 h-4 w-4" /> Archive
                      </Button>
                    }
                    title="Archive SKU"
                    description={`This will set "${sku.skuCode}" to DISCONTINUED.`}
                    confirmLabel="Archive"
                    variant="destructive"
                    onConfirm={handleArchive}
                  />
                )}
              </div>
            }
          />
          <TabbedDetailLayout
            tabs={[
              {
                id: 'details',
                label: 'Details',
                content: (
                  <SectionCard>
                    <DetailPanel
                      fields={[
                        { label: 'SKU Code', value: sku.skuCode },
                        { label: 'SKU Name', value: sku.skuName },
                        { label: 'Barcode', value: sku.barcode },
                        { label: 'Category', value: sku.categoryId ? categoryMap.get(sku.categoryId) : null },
                        { label: 'Tracking Mode', value: sku.trackingMode },
                        { label: 'Status', value: <AutoStatusBadge status={sku.status} /> },
                        { label: 'Default UoM', value: sku.defaultUom },
                        { label: 'Weight', value: sku.weight },
                        { label: 'Sellable by Default', value: sku.sellableByDefault ? 'Yes' : 'No' },
                        { label: 'Requires Expiry Tracking', value: sku.requiresExpiryTracking ? 'Yes' : 'No' },
                        { label: 'Requires Batch Tracking', value: sku.requiresBatchTracking ? 'Yes' : 'No' },
                        { label: 'Short Description', value: sku.shortDescription },
                        { label: 'Long Description', value: sku.longDescription },
                        { label: 'Created', value: new Date(sku.createdAt).toLocaleString() },
                        { label: 'Updated', value: new Date(sku.updatedAt).toLocaleString() },
                      ]}
                    />
                  </SectionCard>
                ),
              },
              {
                id: 'metadata',
                label: 'Metadata',
                content: <SkuMetadataPanel skuId={skuId!} categoryId={sku.categoryId} />,
              },
            ]}
          />
        </>
      )}
    </QueryResult>
  );
}
