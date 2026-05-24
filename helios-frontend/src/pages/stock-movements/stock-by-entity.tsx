import { useParams } from 'react-router-dom';
import { useStockBySite, useStockByWarehouse, useStockByLocation, useStockBySku } from '@/hooks/use-stock-movements';
import type { StockBalance } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';

const balanceColumns: Column<StockBalance>[] = [
  { id: 'site', header: 'Site', cell: (r) => r.siteId },
  { id: 'sku', header: 'SKU', cell: (r) => <code className="text-xs">{r.skuId.slice(0, 8)}…</code> },
  { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.stockStatusCode} /> },
  { id: 'onHand', header: 'On Hand', cell: (r) => r.quantityOnHand, className: 'text-right' },
  { id: 'reserved', header: 'Reserved', cell: (r) => r.quantityReserved, className: 'text-right' },
  { id: 'available', header: 'Available', cell: (r) => r.quantityAvailable, className: 'text-right' },
];

export function StockBySitePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const q = useStockBySite(siteId!);
  return (
    <>
      <PageHeader title={`Stock — Site ${siteId}`} breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: `Site ${siteId}` }]} />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="site stock">
        <SectionCard noPadding>
          <DataTable columns={balanceColumns} data={q.data ?? []} keyField="stockBalanceId" emptyTitle="No stock at this site" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function StockByWarehousePage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const q = useStockByWarehouse(warehouseId!);
  return (
    <>
      <PageHeader title="Stock — Warehouse" breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: 'Warehouse' }]} />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="warehouse stock">
        <SectionCard noPadding>
          <DataTable columns={balanceColumns} data={q.data ?? []} keyField="stockBalanceId" emptyTitle="No stock at this warehouse" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function StockByLocationPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const q = useStockByLocation(locationId!);
  return (
    <>
      <PageHeader title="Stock — Location" breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: 'Location' }]} />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="location stock">
        <SectionCard noPadding>
          <DataTable columns={balanceColumns} data={q.data ?? []} keyField="stockBalanceId" emptyTitle="No stock at this location" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function StockBySkuPage() {
  const { skuId } = useParams<{ skuId: string }>();
  const q = useStockBySku(skuId!);
  return (
    <>
      <PageHeader title="Stock — SKU" breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: 'SKU' }]} />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="SKU stock">
        <SectionCard noPadding>
          <DataTable columns={balanceColumns} data={q.data ?? []} keyField="stockBalanceId" emptyTitle="No stock for this SKU" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

