import { useParams } from 'react-router-dom';
import { useStockItem } from '@/hooks/use-stock-movements';
import { PageHeader, SectionCard, DetailPanel, QueryResult, AutoStatusBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function StockItemDetailPage() {
  const { stockItemId } = useParams<{ stockItemId: string }>();
  const navigate = useNavigate();
  const q = useStockItem(stockItemId!);
  const item = q.data;

  return (
    <>
      <PageHeader
        title="Stock Item"
        breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: 'Item Detail' }]}
        actions={
          item ? (
            <Button size="sm" variant="outline" onClick={() => navigate(`/inventory/movements?stockItemId=${item.stockItemId}`)}>
              View Movements
            </Button>
          ) : undefined
        }
      />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="stock item">
        {item && (
          <SectionCard title="Item Details">
            <DetailPanel
              columns={2}
              fields={[
                { label: 'Item ID', value: item.stockItemId },
                { label: 'SKU', value: item.skuId },
                { label: 'Site', value: item.siteId },
                { label: 'Serial Number', value: item.serialNumber ?? '—' },
                { label: 'Batch Number', value: item.batchNumber ?? '—' },
                { label: 'Expiry Date', value: item.expiryDate ?? '—' },
                { label: 'Location', value: item.currentLocationId ?? '—' },
                { label: 'Warehouse', value: item.currentWarehouseId ?? '—' },
                { label: 'Stock Status', value: <AutoStatusBadge status={item.stockStatusCode} /> },
                { label: 'Lifecycle', value: <AutoStatusBadge status={item.lifecycleStatus} /> },
                { label: 'Created', value: new Date(item.createdAt).toLocaleString() },
                { label: 'Updated', value: new Date(item.updatedAt).toLocaleString() },
              ]}
            />
          </SectionCard>
        )}
      </QueryResult>
    </>
  );
}

