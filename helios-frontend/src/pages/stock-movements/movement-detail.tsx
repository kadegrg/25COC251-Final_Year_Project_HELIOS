import { useParams } from 'react-router-dom';
import { useMovement } from '@/hooks/use-stock-movements';
import { PageHeader, SectionCard, DetailPanel, QueryResult, AutoStatusBadge } from '@/components/common';

export function MovementDetailPage() {
  const { movementId } = useParams<{ movementId: string }>();
  const q = useMovement(movementId!);
  const m = q.data;

  return (
    <>
      <PageHeader
        title="Movement Detail"
        breadcrumbs={[{ label: 'Movements', href: '/inventory/movements' }, { label: movementId?.slice(0, 8) ?? '' }]}
      />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="movement">
        {m && (
          <SectionCard title="Movement">
            <DetailPanel
              columns={2}
              fields={[
                { label: 'Movement ID', value: m.movementId },
                { label: 'Type', value: <AutoStatusBadge status={m.movementType} /> },
                { label: 'Reason', value: m.movementReasonCode ?? '—' },
                { label: 'Site', value: m.siteId },
                { label: 'SKU', value: m.skuId },
                { label: 'Quantity', value: m.quantity },
                { label: 'From Location', value: m.fromLocationId ?? '—' },
                { label: 'To Location', value: m.toLocationId ?? '—' },
                { label: 'From Status', value: m.fromStockStatusCode ?? '—' },
                { label: 'To Status', value: m.toStockStatusCode ?? '—' },
                { label: 'Stock Item', value: m.stockItemId ?? '—' },
                { label: 'Transfer', value: m.transferId ?? '—' },
                { label: 'Adjustment', value: m.adjustmentId ?? '—' },
                { label: 'Reference', value: m.referenceType ? `${m.referenceType}: ${m.referenceId}` : '—' },
                { label: 'Performed By', value: m.performedBy ?? '—' },
                { label: 'Notes', value: m.notes ?? '—' },
                { label: 'Created', value: new Date(m.createdAt).toLocaleString() },
              ]}
            />
          </SectionCard>
        )}
      </QueryResult>
    </>
  );
}

