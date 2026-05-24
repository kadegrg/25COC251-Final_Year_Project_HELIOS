import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTransfer, useDiscrepancies, useApproveTransfer, useDispatchTransfer, useReconcileTransfer, useCancelTransfer } from '@/hooks/use-transfers';
import { useAuthStore } from '@/stores/auth.store';
import { TRANSFER_ACTIONS, TRANSFER_PERMISSIONS } from '@/types/transfers.types';
import type { Transfer, TransferLine, TransferDiscrepancy, TransferStatus } from '@/types/transfers.types';
import { PageHeader, SectionCard, DetailPanel, DataTable, QueryResult, AutoStatusBadge, ConfirmDialog } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ReceiveDialog } from './receive-dialog';
import { DiscrepancyDialog } from './discrepancy-dialog';

function useActionAvailability(status: TransferStatus | undefined) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  if (!status) return { approve: false, dispatch: false, receive: false, reconcile: false, cancel: false };
  return {
    approve: TRANSFER_ACTIONS.approve.validFrom.includes(status) && hasPermission(TRANSFER_ACTIONS.approve.permission),
    dispatch: TRANSFER_ACTIONS.dispatch.validFrom.includes(status) && hasPermission(TRANSFER_ACTIONS.dispatch.permission),
    receive: TRANSFER_ACTIONS.receive.validFrom.includes(status) && hasPermission(TRANSFER_ACTIONS.receive.permission),
    reconcile: TRANSFER_ACTIONS.reconcile.validFrom.includes(status) && hasPermission(TRANSFER_ACTIONS.reconcile.permission),
    cancel: TRANSFER_ACTIONS.cancel.validFrom.includes(status) && hasPermission(TRANSFER_ACTIONS.cancel.permission),
  };
}

export function TransferDetailPage() {
  const { transferId } = useParams<{ transferId: string }>();
  const q = useTransfer(transferId!);
  const discQ = useDiscrepancies(transferId!);
  const t = q.data;

  const actions = useActionAvailability(t?.status);
  const canAddDiscrepancy = useAuthStore((s) => s.hasPermission(TRANSFER_PERMISSIONS.RECONCILE));

  const approveMut = useApproveTransfer();
  const dispatchMut = useDispatchTransfer();
  const reconcileMut = useReconcileTransfer();
  const cancelMut = useCancelTransfer();

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [discrepancyOpen, setDiscrepancyOpen] = useState(false);

  const refetchAll = () => { q.refetch(); discQ.refetch(); };

  const lineColumns: Column<TransferLine>[] = [
    { id: 'sku', header: 'SKU', cell: (r) => <code className="text-xs">{r.skuId.slice(0, 8)}…</code> },
    { id: 'stockItem', header: 'Stock Item', cell: (r) => r.stockItemId ? <code className="text-xs">{r.stockItemId.slice(0, 8)}…</code> : '—' },
    { id: 'requested', header: 'Requested', cell: (r) => r.requestedQuantity, className: 'text-right' },
    { id: 'dispatched', header: 'Dispatched', cell: (r) => r.dispatchedQuantity, className: 'text-right' },
    { id: 'received', header: 'Received', cell: (r) => r.receivedQuantity, className: 'text-right' },
    { id: 'discrepancy', header: 'Discrepancy', cell: (r) => r.discrepancyQuantity || '—', className: 'text-right' },
    { id: 'discReason', header: 'Disc. Reason', cell: (r) => r.discrepancyReasonCode ?? '—' },
  ];

  const discColumns: Column<TransferDiscrepancy>[] = [
    { id: 'type', header: 'Type', cell: (r) => <AutoStatusBadge status={r.discrepancy_type} /> },
    { id: 'expected', header: 'Expected', cell: (r) => r.expected_quantity ?? '—', className: 'text-right' },
    { id: 'actual', header: 'Actual', cell: (r) => r.actual_quantity ?? '—', className: 'text-right' },
    { id: 'reason', header: 'Reason', cell: (r) => r.reason_code },
    { id: 'notes', header: 'Notes', cell: (r) => r.notes ?? '—' },
    { id: 'reported', header: 'Reported', cell: (r) => new Date(r.reported_at).toLocaleString() },
  ];

  return (
    <>
      <PageHeader
        title={t?.transferNumber ?? 'Transfer'}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Transfers', href: '/inventory/transfers' }, { label: t?.transferNumber ?? '' }]}
        actions={
          <div className="flex gap-2">
            {actions.approve && (
              <ConfirmDialog trigger={<Button size="sm">Approve</Button>} title="Approve Transfer" description="This requires elevated authentication (AAL 2)." confirmLabel="Approve" onConfirm={() => approveMut.mutateAsync(transferId!).then(() => refetchAll())} />
            )}
            {actions.dispatch && (
              <ConfirmDialog trigger={<Button size="sm">Dispatch</Button>} title="Dispatch Transfer" description="Stock will be decremented at the source site." confirmLabel="Dispatch" onConfirm={() => dispatchMut.mutateAsync(transferId!).then(() => refetchAll())} />
            )}
            {actions.receive && (
              <Button size="sm" onClick={() => setReceiveOpen(true)}>Receive</Button>
            )}
            {actions.reconcile && (
              <ConfirmDialog trigger={<Button size="sm">Reconcile</Button>} title="Reconcile Transfer" description="This requires elevated authentication (AAL 2). Marks discrepancies as reviewed." confirmLabel="Reconcile" onConfirm={() => reconcileMut.mutateAsync(transferId!).then(() => refetchAll())} />
            )}
            {actions.cancel && (
              <ConfirmDialog trigger={<Button size="sm" variant="destructive">Cancel</Button>} title="Cancel Transfer" description="This transfer will be cancelled. This action cannot be undone." variant="destructive" confirmLabel="Cancel Transfer" onConfirm={() => cancelMut.mutateAsync(transferId!).then(() => refetchAll())} />
            )}
          </div>
        }
      />

      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="transfer">
        {t && (
          <>
            <SectionCard title="Details">
              <DetailPanel columns={2} fields={[
                { label: 'Transfer ID', value: t.transferId },
                { label: 'Status', value: <AutoStatusBadge status={t.status} /> },
                { label: 'From Site', value: t.fromSiteId },
                { label: 'To Site', value: t.toSiteId },
                { label: 'Reason', value: t.reasonCode },
                { label: 'Notes', value: t.notes ?? '—' },
                { label: 'Requested By', value: t.requestedByUserId ?? '—' },
                { label: 'Requested At', value: new Date(t.requestedAt).toLocaleString() },
                { label: 'Approved By', value: t.approvedByUserId ?? '—' },
                { label: 'Approved At', value: t.approvedAt ? new Date(t.approvedAt).toLocaleString() : '—' },
                { label: 'Dispatched By', value: t.dispatchedByUserId ?? '—' },
                { label: 'Dispatched At', value: t.dispatchedAt ? new Date(t.dispatchedAt).toLocaleString() : '—' },
                { label: 'Received By', value: t.receivedByUserId ?? '—' },
                { label: 'Received At', value: t.receivedAt ? new Date(t.receivedAt).toLocaleString() : '—' },
              ]} />
            </SectionCard>

            {t.lines && t.lines.length > 0 && (
              <SectionCard title="Lines" noPadding className="mt-4">
                <DataTable columns={lineColumns} data={t.lines} keyField="transferLineId" emptyTitle="No lines" />
              </SectionCard>
            )}

            <SectionCard
              title="Discrepancies"
              noPadding
              className="mt-4"
              actions={canAddDiscrepancy ? <Button size="sm" variant="outline" onClick={() => setDiscrepancyOpen(true)}>Add Discrepancy</Button> : undefined}
            >
              <DataTable columns={discColumns} data={discQ.data ?? []} keyField="transfer_discrepancy_id" emptyTitle="No discrepancies" />
            </SectionCard>

            {actions.receive && t.lines && (
              <ReceiveDialog transferId={transferId!} lines={t.lines} open={receiveOpen} onOpenChange={setReceiveOpen} onSuccess={refetchAll} />
            )}
            <DiscrepancyDialog transferId={transferId!} open={discrepancyOpen} onOpenChange={setDiscrepancyOpen} onSuccess={refetchAll} />
          </>
        )}
      </QueryResult>
    </>
  );
}

