import { useState } from 'react';
import { useStockSummary } from '@/hooks/use-stock-movements';
import { useSites } from '@/hooks/use-inventory-structure';
import type { SummaryRow } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, Toolbar, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';

export function StockSummaryPage() {
  const sitesQ = useSites({ limit: 200 });
  const sites = sitesQ.data?.data ?? [];
  const [siteId, setSiteId] = useState<string | undefined>();

  const q = useStockSummary(siteId);

  const columns: Column<SummaryRow>[] = [
    ...(siteId
      ? [{ id: 'sku', header: 'SKU', cell: (r: SummaryRow) => r.skuId ? String(r.skuId).slice(0, 8) + '…' : '—' }]
      : [{ id: 'site', header: 'Site', cell: (r: SummaryRow) => r.siteId ?? '—' }]
    ),
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.stockStatusCode} /> },
    { id: 'onHand', header: 'On Hand', cell: (r) => r.totalOnHand, className: 'text-right' },
    { id: 'reserved', header: 'Reserved', cell: (r) => r.totalReserved, className: 'text-right' },
    { id: 'available', header: 'Available', cell: (r) => r.totalAvailable, className: 'text-right' },
  ];

  return (
    <>
      <PageHeader
        title="Stock Summary"
        description="Aggregated stock overview"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock', href: '/inventory/stock' }, { label: 'Summary' }]}
      />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={siteId ?? ''}
          onChange={(e) => setSiteId(e.target.value || undefined)}
        >
          <option value="">All sites (grouped by site)</option>
          {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data ?? []}
            keyField="stockStatusCode"
            emptyTitle="No stock data"
          />
        </SectionCard>
      </QueryResult>
    </>
  );
}

