import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdjustmentList } from '@/hooks/use-adjustments';
import { useAuthStore } from '@/stores/auth.store';
import { ADJUSTMENT_STATUSES, ADJUSTMENT_TYPES, ADJUSTMENT_PERMISSION } from '@/types/adjustments.types';
import type { Adjustment, ListAdjustmentsParams } from '@/types/adjustments.types';
import { PageHeader, SectionCard, DataTable, Toolbar, PaginationFooter, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function AdjustmentsListPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission(ADJUSTMENT_PERMISSION));

  const [params, setParams] = useState<ListAdjustmentsParams>({ page: 1, limit: 20 });
  const q = useAdjustmentList(params);

  const columns: Column<Adjustment>[] = [
    { id: 'type', header: 'Type', cell: (r) => <AutoStatusBadge status={r.adjustmentType} /> },
    { id: 'site', header: 'Site', cell: (r) => <code className="text-xs">{r.siteId.slice(0, 12)}</code> },
    { id: 'reason', header: 'Reason', cell: (r) => r.reasonCode },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    { id: 'requestedBy', header: 'Requested By', cell: (r) => r.requestedByUserId ? <code className="text-xs">{r.requestedByUserId.slice(0, 8)}…</code> : '—' },
    { id: 'requestedAt', header: 'Requested At', cell: (r) => new Date(r.requestedAt).toLocaleDateString() },
  ];

  const pagination = q.data?.pagination;

  return (
    <>
      <PageHeader
        title="Adjustments"
        description="Inventory quantity and status adjustments"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Adjustments' }]}
        actions={hasPermission ? <Button size="sm" onClick={() => navigate('/inventory/adjustments/new')}><Plus className="mr-1 h-4 w-4" />New Adjustment</Button> : undefined}
      />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.status ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All statuses</option>
          {ADJUSTMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.adjustmentType ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, adjustmentType: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All types</option>
          {ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data?.data ?? []}
            keyField="adjustmentId"
            onRowClick={(r) => navigate(`/inventory/adjustments/${r.adjustmentId}`)}
            emptyTitle="No adjustments found"
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

