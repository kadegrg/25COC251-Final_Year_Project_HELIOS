import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransferList } from '@/hooks/use-transfers';
import { useAuthStore } from '@/stores/auth.store';
import { TRANSFER_STATUSES, TRANSFER_PERMISSIONS } from '@/types/transfers.types';
import type { Transfer, ListTransfersParams } from '@/types/transfers.types';
import { PageHeader, SectionCard, DataTable, Toolbar, PaginationFooter, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function TransfersListPage() {
  const navigate = useNavigate();
  const hasRequest = useAuthStore((s) => s.hasPermission(TRANSFER_PERMISSIONS.REQUEST));

  const [params, setParams] = useState<ListTransfersParams>({ page: 1, limit: 20 });
  const q = useTransferList(params);

  const columns: Column<Transfer>[] = [
    { id: 'number', header: 'Transfer #', cell: (r) => r.transferNumber },
    { id: 'from', header: 'From Site', cell: (r) => <code className="text-xs">{r.fromSiteId.slice(0, 8)}…</code> },
    { id: 'to', header: 'To Site', cell: (r) => <code className="text-xs">{r.toSiteId.slice(0, 8)}…</code> },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    { id: 'reason', header: 'Reason', cell: (r) => r.reasonCode },
    { id: 'requested', header: 'Requested', cell: (r) => new Date(r.requestedAt).toLocaleDateString() },
  ];

  const pagination = q.data?.pagination;

  return (
    <>
      <PageHeader
        title="Transfers"
        description="Inter-site inventory transfers"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Transfers' }]}
        actions={hasRequest ? <Button size="sm" onClick={() => navigate('/inventory/transfers/new')}><Plus className="mr-1 h-4 w-4" />New Transfer</Button> : undefined}
      />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.status ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All statuses</option>
          {TRANSFER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data?.data ?? []}
            keyField="transferId"
            onRowClick={(r) => navigate(`/inventory/transfers/${r.transferId}`)}
            emptyTitle="No transfers found"
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

