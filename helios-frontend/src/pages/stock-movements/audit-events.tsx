import { useState } from 'react';
import { useAuditEvents } from '@/hooks/use-stock-movements';
import type { AuditEvent, ListAuditEventsParams } from '@/types/stock-movements.types';
import { AUDIT_EVENT_TYPES } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, Toolbar, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';

export function AuditEventsPage() {
  const [params, setParams] = useState<ListAuditEventsParams>({ limit: 50, offset: 0 });
  const q = useAuditEvents(params);

  const columns: Column<AuditEvent>[] = [
    { id: 'type', header: 'Event Type', cell: (r) => r.eventType },
    { id: 'result', header: 'Result', cell: (r) => <AutoStatusBadge status={r.eventResult} /> },
    { id: 'site', header: 'Site', cell: (r) => r.siteId },
    { id: 'sku', header: 'SKU', cell: (r) => r.skuId ? r.skuId.slice(0, 8) + '…' : '—' },
    { id: 'user', header: 'User', cell: (r) => r.userId ?? '—' },
    { id: 'date', header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  const total = q.data?.total ?? 0;
  const offset = params.offset ?? 0;
  const limit = params.limit ?? 50;

  return (
    <>
      <PageHeader title="Audit Events" description="Inventory audit trail (AAL 2)" breadcrumbs={[{ label: 'Inventory' }, { label: 'Audit Events' }]} />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.eventType ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, eventType: e.target.value || undefined, offset: 0 }))}
        >
          <option value="">All event types</option>
          {AUDIT_EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={columns} data={q.data?.data ?? []} keyField="auditEventId" emptyTitle="No audit events" />
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${offset + 1}–${Math.min(offset + limit, total)} of ${total}` : 'No results'}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setParams((p) => ({ ...p, offset: Math.max(0, (p.offset ?? 0) - limit) }))}>Prev</Button>
              <Button variant="ghost" size="sm" disabled={offset + limit >= total} onClick={() => setParams((p) => ({ ...p, offset: (p.offset ?? 0) + limit }))}>Next</Button>
            </div>
          </div>
        </SectionCard>
      </QueryResult>
    </>
  );
}

