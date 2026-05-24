import { useParams } from 'react-router-dom';
import { useAdjustment, useApproveAdjustment, usePostAdjustment, useCancelAdjustment } from '@/hooks/use-adjustments';
import { useAuthStore } from '@/stores/auth.store';
import { ADJUSTMENT_ACTIONS, ADJUSTMENT_PERMISSION } from '@/types/adjustments.types';
import type { AdjustmentLine, AdjustmentStatus } from '@/types/adjustments.types';
import { PageHeader, SectionCard, DetailPanel, DataTable, QueryResult, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';

function useActionAvailability(status: AdjustmentStatus | undefined) {
  const hasPermission = useAuthStore((s) => s.hasPermission(ADJUSTMENT_PERMISSION));
  if (!status || !hasPermission) return { approve: false, post: false, cancel: false };
  return {
    approve: ADJUSTMENT_ACTIONS.approve.validFrom.includes(status),
    post: ADJUSTMENT_ACTIONS.post.validFrom.includes(status),
    cancel: ADJUSTMENT_ACTIONS.cancel.validFrom.includes(status),
  };
}

export function AdjustmentDetailPage() {
  const { adjustmentId } = useParams<{ adjustmentId: string }>();
  const q = useAdjustment(adjustmentId!);
  const a = q.data;

  const actions = useActionAvailability(a?.status);

  const approveMut = useApproveAdjustment();
  const postMut = usePostAdjustment();
  const cancelMut = useCancelAdjustment();

  const refetch = () => q.refetch();

  const lineColumns: Column<AdjustmentLine>[] = [
    { id: 'sku', header: 'SKU', cell: (r) => <code className="text-xs">{r.skuId.slice(0, 8)}…</code> },
    { id: 'stockItem', header: 'Stock Item', cell: (r) => r.stockItemId ? <code className="text-xs">{r.stockItemId.slice(0, 8)}…</code> : '—' },
    { id: 'fromStatus', header: 'From Status', cell: (r) => r.fromStatusCode ?? '—' },
    { id: 'toStatus', header: 'To Status', cell: (r) => r.toStatusCode ?? '—' },
    { id: 'qtyDelta', header: 'Qty Delta', cell: (r) => r.quantityDelta, className: 'text-right' },
    { id: 'counted', header: 'Counted', cell: (r) => r.countedQuantity ?? '—', className: 'text-right' },
    { id: 'expected', header: 'Expected', cell: (r) => r.expectedQuantity ?? '—', className: 'text-right' },
    { id: 'reason', header: 'Reason', cell: (r) => r.reasonCode },
    { id: 'notes', header: 'Notes', cell: (r) => r.notes ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title={a ? `${a.adjustmentType} Adjustment` : 'Adjustment'}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Adjustments', href: '/inventory/adjustments' }, { label: a?.adjustmentId?.slice(0, 8) ?? '' }]}
        actions={
          <div className="flex gap-2">
            {actions.approve && (
              <ConfirmDialog trigger={<Button size="sm">Approve</Button>} title="Approve Adjustment" description="This requires elevated authentication (AAL 2). This records your approval on the adjustment." confirmLabel="Approve" onConfirm={async () => { await approveMut.mutateAsync(adjustmentId!); await refetch(); }} />
            )}
            {actions.post && (
              <ConfirmDialog trigger={<Button size="sm">Post</Button>} title="Post Adjustment" description="This requires elevated authentication (AAL 2). Posting will apply balance changes and create stock movements. This cannot be undone." confirmLabel="Post" onConfirm={async () => { await postMut.mutateAsync(adjustmentId!); await refetch(); }} />
            )}
            {actions.cancel && (
              <ConfirmDialog trigger={<Button size="sm" variant="destructive">Cancel</Button>} title="Cancel Adjustment" description="This adjustment will be cancelled. No stock changes will be applied. This cannot be undone." variant="destructive" confirmLabel="Cancel Adjustment" onConfirm={async () => { await cancelMut.mutateAsync(adjustmentId!); await refetch(); }} />
            )}
          </div>
        }
      />

      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="adjustment">
        {a && (
          <>
            <SectionCard title="Details">
              <DetailPanel columns={2} fields={[
                { label: 'Adjustment ID', value: a.adjustmentId },
                { label: 'Status', value: <AutoStatusBadge status={a.status} /> },
                { label: 'Type', value: <AutoStatusBadge status={a.adjustmentType} /> },
                { label: 'Site', value: a.siteId },
                { label: 'Warehouse', value: a.warehouseId ?? '—' },
                { label: 'Location', value: a.locationId ?? '—' },
                { label: 'Reason Code', value: a.reasonCode },
                { label: 'Notes', value: a.notes ?? '—' },
                { label: 'Requested By', value: a.requestedByUserId ?? '—' },
                { label: 'Requested At', value: new Date(a.requestedAt).toLocaleString() },
                { label: 'Approved By', value: a.approvedByUserId ?? '—' },
                { label: 'Approved At', value: a.approvedAt ? new Date(a.approvedAt).toLocaleString() : '—' },
                { label: 'Posted By', value: a.postedByUserId ?? '—' },
                { label: 'Posted At', value: a.postedAt ? new Date(a.postedAt).toLocaleString() : '—' },
              ]} />
            </SectionCard>

            {a.lines && a.lines.length > 0 && (
              <SectionCard title="Lines" noPadding className="mt-4">
                <DataTable columns={lineColumns} data={a.lines} keyField="adjustmentLineId" emptyTitle="No lines" />
              </SectionCard>
            )}
          </>
        )}
      </QueryResult>
    </>
  );
}


