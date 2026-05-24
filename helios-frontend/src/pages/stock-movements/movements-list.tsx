import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMovementList } from '@/hooks/use-stock-movements';
import type { StockMovement, ListMovementsParams } from '@/types/stock-movements.types';
import { MOVEMENT_TYPES } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, Toolbar, PaginationFooter, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';

export function MovementsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [params, setParams] = useState<ListMovementsParams>({
    page: 1, limit: 50,
    stockItemId: searchParams.get('stockItemId') ?? undefined,
    skuId: searchParams.get('skuId') ?? undefined,
    siteId: searchParams.get('siteId') ?? undefined,
  });

  const q = useMovementList(params);

  const columns: Column<StockMovement>[] = [
    { id: 'type', header: 'Type', cell: (r) => <AutoStatusBadge status={r.movementType} /> },
    { id: 'reason', header: 'Reason', cell: (r) => r.movementReasonCode ?? '—' },
    { id: 'sku', header: 'SKU', cell: (r) => <code className="text-xs">{r.skuId.slice(0, 8)}…</code> },
    { id: 'qty', header: 'Qty', cell: (r) => r.quantity, className: 'text-right' },
    { id: 'fromStatus', header: 'From Status', cell: (r) => r.fromStockStatusCode ?? '—' },
    { id: 'toStatus', header: 'To Status', cell: (r) => r.toStockStatusCode ?? '—' },
    { id: 'date', header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  const pagination = q.data?.pagination;

  return (
    <>
      <PageHeader title="Movements" description="Immutable stock movement ledger" breadcrumbs={[{ label: 'Inventory' }, { label: 'Movements' }]} />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.movementType ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, movementType: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All types</option>
          {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data?.data ?? []}
            keyField="movementId"
            onRowClick={(r) => navigate(`/inventory/movements/${r.movementId}`)}
            emptyTitle="No movements found"
          />
          {pagination && (
            <PaginationFooter
              page={pagination.page} pageSize={pagination.limit} total={pagination.total}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          )}
        </SectionCard>
      </QueryResult>
    </>
  );
}

