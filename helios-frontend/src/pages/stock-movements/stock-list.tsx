import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStockList } from '@/hooks/use-stock-movements';
import { useSites } from '@/hooks/use-inventory-structure';
import type { StockBalance, ListStockParams } from '@/types/stock-movements.types';
import { STOCK_STATUS_CODES } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, Toolbar, PaginationFooter, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { STOCK_PERMISSIONS } from '@/types/stock-movements.types';
import { ArrowDownToLine, ArrowRightLeft, Lock } from 'lucide-react';

export function StockListPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const sitesQ = useSites({ limit: 200 });
  const sites = sitesQ.data?.data ?? [];

  const [params, setParams] = useState<ListStockParams>({ page: 1, limit: 50 });
  const q = useStockList(params);

  const columns: Column<StockBalance>[] = [
    { id: 'site', header: 'Site', cell: (r) => r.siteId },
    { id: 'sku', header: 'SKU', cell: (r) => <code className="text-xs">{r.skuId.slice(0, 8)}…</code> },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.stockStatusCode} /> },
    { id: 'onHand', header: 'On Hand', cell: (r) => r.quantityOnHand, className: 'text-right' },
    { id: 'reserved', header: 'Reserved', cell: (r) => r.quantityReserved, className: 'text-right' },
    { id: 'available', header: 'Available', cell: (r) => r.quantityAvailable, className: 'text-right' },
    { id: 'updated', header: 'Updated', cell: (r) => new Date(r.updatedAt).toLocaleDateString() },
  ];

  const pagination = q.data?.pagination;

  const actionButtons = (
    <div className="flex flex-wrap gap-1">
      {hasPermission(STOCK_PERMISSIONS.STOCK_RECEIVE) && (
        <Button size="sm" variant="outline" onClick={() => navigate('/inventory/stock/receive')}><ArrowDownToLine className="mr-1 h-3.5 w-3.5" />Receive</Button>
      )}
      {hasPermission(STOCK_PERMISSIONS.STOCK_MOVE) && (
        <Button size="sm" variant="outline" onClick={() => navigate('/inventory/stock/move')}><ArrowRightLeft className="mr-1 h-3.5 w-3.5" />Move</Button>
      )}
      {hasPermission(STOCK_PERMISSIONS.STOCK_RESERVE) && (
        <Button size="sm" variant="outline" onClick={() => navigate('/inventory/stock/reserve')}><Lock className="mr-1 h-3.5 w-3.5" />Reserve</Button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Stock"
        description="Stock balances across the estate"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock' }]}
        actions={actionButtons}
      />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.siteId ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, siteId: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All sites</option>
          {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.stockStatusCode ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, stockStatusCode: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All statuses</option>
          {STOCK_STATUS_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data?.data ?? []}
            keyField="stockBalanceId"
            emptyTitle="No stock balances"
            emptyDescription="Receive stock or adjust filters."
          />
          {pagination && (
            <PaginationFooter
              page={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          )}
        </SectionCard>
      </QueryResult>
    </>
  );
}


