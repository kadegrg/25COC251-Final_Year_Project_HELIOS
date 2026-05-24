import { useState } from 'react';
import { useSites } from '@/hooks/use-inventory-structure';
import {
  useReportLowStock, useReportNegativeStock, useReportDiscrepancies,
  useReportReservedVsAvailable, useReportRecentAdjustments, useReportCycleCountVariance,
} from '@/hooks/use-stock-movements';
import type { StockBalance, ReportParams } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, Toolbar, QueryResult } from '@/components/common';
import type { Column } from '@/components/common';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';

// --- Shared site filter ---
function useSiteFilter() {
  const [siteId, setSiteId] = useState<string | undefined>();
  const sitesQ = useSites({ limit: 200 });
  const sites = sitesQ.data?.data ?? [];
  const SiteFilter = (
    <select className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={siteId ?? ''} onChange={(e) => setSiteId(e.target.value || undefined)}>
      <option value="">All sites</option>
      {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
    </select>
  );
  return { siteId, SiteFilter };
}

const balanceCols: Column<StockBalance>[] = [
  { id: 'site', header: 'Site', cell: (r) => r.siteId },
  { id: 'sku', header: 'SKU', cell: (r) => <code className="text-xs">{r.skuId.slice(0, 8)}…</code> },
  { id: 'status', header: 'Status', cell: (r) => r.stockStatusCode },
  { id: 'onHand', header: 'On Hand', cell: (r) => r.quantityOnHand, className: 'text-right' },
  { id: 'available', header: 'Available', cell: (r) => r.quantityAvailable, className: 'text-right' },
];

export function LowStockReportPage() {
  const { siteId, SiteFilter } = useSiteFilter();
  const [threshold, setThreshold] = useState(10);
  const q = useReportLowStock({ siteId, threshold });
  return (
    <>
      <PageHeader title="Low Stock Report" breadcrumbs={[{ label: 'Reports', href: '/inventory/reports' }, { label: 'Low Stock' }]} />
      <Toolbar>
        {SiteFilter}
        <Input type="number" className="w-28" placeholder="Threshold" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={balanceCols} data={(q.data ?? []) as StockBalance[]} keyField="stockBalanceId" emptyTitle="No low stock" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function NegativeStockReportPage() {
  const { siteId, SiteFilter } = useSiteFilter();
  const q = useReportNegativeStock({ siteId });
  return (
    <>
      <PageHeader title="Negative Stock Report" breadcrumbs={[{ label: 'Reports', href: '/inventory/reports' }, { label: 'Negative Stock' }]} />
      <Toolbar>{SiteFilter}</Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={balanceCols} data={(q.data ?? []) as StockBalance[]} keyField="stockBalanceId" emptyTitle="No negative stock" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function DiscrepanciesReportPage() {
  const { siteId, SiteFilter } = useSiteFilter();
  const q = useReportDiscrepancies({ siteId });
  const genCols: Column<Record<string, unknown>>[] = [
    { id: 'id', header: 'ID', cell: (r) => String(r.discrepancyId ?? r.id ?? '—').slice(0, 8) },
    { id: 'transfer', header: 'Transfer', cell: (r) => String(r.transferId ?? '—').slice(0, 8) },
    { id: 'site', header: 'Site', cell: (r) => String(r.fromSiteId ?? r.siteId ?? '—') },
    { id: 'details', header: 'Details', cell: (r) => JSON.stringify(r).slice(0, 80) },
  ];
  return (
    <>
      <PageHeader title="Discrepancies Report" breadcrumbs={[{ label: 'Reports', href: '/inventory/reports' }, { label: 'Discrepancies' }]} />
      <Toolbar>{SiteFilter}</Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={genCols} data={(q.data ?? []) as Record<string, unknown>[]} keyField="id" emptyTitle="No discrepancies" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function ReservedVsAvailableReportPage() {
  const { siteId, SiteFilter } = useSiteFilter();
  const q = useReportReservedVsAvailable({ siteId });
  const cols: Column<Record<string, unknown>>[] = [
    { id: 'sku', header: 'SKU', cell: (r) => String(r.skuId ?? r.sku_id ?? '—').slice(0, 8) + '…' },
    { id: 'site', header: 'Site', cell: (r) => String(r.siteId ?? r.site_id ?? '—') },
    { id: 'onHand', header: 'On Hand', cell: (r) => String(r.totalOnHand ?? r.total_on_hand ?? 0), className: 'text-right' },
    { id: 'reserved', header: 'Reserved', cell: (r) => String(r.totalReserved ?? r.total_reserved ?? 0), className: 'text-right' },
    { id: 'available', header: 'Available', cell: (r) => String(r.totalAvailable ?? r.total_available ?? 0), className: 'text-right' },
  ];
  return (
    <>
      <PageHeader title="Reserved vs Available" breadcrumbs={[{ label: 'Reports', href: '/inventory/reports' }, { label: 'Reserved vs Available' }]} />
      <Toolbar>{SiteFilter}</Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={cols} data={(q.data ?? []) as Record<string, unknown>[]} keyField="sku" emptyTitle="No data" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function RecentAdjustmentsReportPage() {
  const { siteId, SiteFilter } = useSiteFilter();
  const q = useReportRecentAdjustments({ siteId });
  const cols: Column<Record<string, unknown>>[] = [
    { id: 'id', header: 'Adjustment', cell: (r) => String(r.adjustmentId ?? r.adjustment_id ?? '—').slice(0, 8) },
    { id: 'site', header: 'Site', cell: (r) => String(r.siteId ?? r.site_id ?? '—') },
    { id: 'type', header: 'Type', cell: (r) => String(r.adjustmentType ?? r.adjustment_type ?? '—') },
    { id: 'posted', header: 'Posted At', cell: (r) => r.postedAt || r.posted_at ? new Date(String(r.postedAt ?? r.posted_at)).toLocaleString() : '—' },
  ];
  return (
    <>
      <PageHeader title="Recent Adjustments" breadcrumbs={[{ label: 'Reports', href: '/inventory/reports' }, { label: 'Recent Adjustments' }]} />
      <Toolbar>{SiteFilter}</Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={cols} data={(q.data ?? []) as Record<string, unknown>[]} keyField="id" emptyTitle="No recent adjustments" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

export function CycleCountVarianceReportPage() {
  const { siteId, SiteFilter } = useSiteFilter();
  const q = useReportCycleCountVariance({ siteId });
  const cols: Column<Record<string, unknown>>[] = [
    { id: 'adj', header: 'Adjustment', cell: (r) => String(r.adjustmentId ?? r.adjustment_id ?? '—').slice(0, 8) },
    { id: 'sku', header: 'SKU', cell: (r) => String(r.skuId ?? r.sku_id ?? '—').slice(0, 8) },
    { id: 'expected', header: 'Expected', cell: (r) => String(r.expectedQuantity ?? r.expected_quantity ?? '—'), className: 'text-right' },
    { id: 'counted', header: 'Counted', cell: (r) => String(r.countedQuantity ?? r.counted_quantity ?? '—'), className: 'text-right' },
    { id: 'variance', header: 'Variance', cell: (r) => String(r.variance ?? '—'), className: 'text-right' },
  ];
  return (
    <>
      <PageHeader title="Cycle Count Variance" breadcrumbs={[{ label: 'Reports', href: '/inventory/reports' }, { label: 'Cycle Count Variance' }]} />
      <Toolbar>{SiteFilter}</Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={cols} data={(q.data ?? []) as Record<string, unknown>[]} keyField="adj" emptyTitle="No cycle count variances" />
        </SectionCard>
      </QueryResult>
    </>
  );
}

