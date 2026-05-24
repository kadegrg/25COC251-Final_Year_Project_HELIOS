import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportList } from '@/hooks/use-stock-movements';
import type { ImportJob, ListImportsParams } from '@/types/stock-movements.types';
import { IMPORT_TYPES, IMPORT_STATUSES } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DataTable, Toolbar, PaginationFooter, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function ImportsListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useState<ListImportsParams>({ page: 1, limit: 20 });
  const q = useImportList(params);

  const columns: Column<ImportJob>[] = [
    { id: 'type', header: 'Type', cell: (r) => r.importType },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    { id: 'site', header: 'Site', cell: (r) => r.siteId },
    { id: 'file', header: 'Filename', cell: (r) => r.sourceFilename ?? '—' },
    { id: 'summary', header: 'Rows', cell: (r) => r.summaryJson ? `${r.summaryJson.validRows}/${r.summaryJson.totalRows}` : '—' },
    { id: 'date', header: 'Created', cell: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const pagination = q.data?.pagination;

  return (
    <>
      <PageHeader
        title="Imports"
        description="Bulk import jobs (AAL 2)"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Imports' }]}
        actions={<Button size="sm" onClick={() => navigate('/inventory/imports/new')}><Plus className="mr-1 h-3.5 w-3.5" />New Import</Button>}
      />
      <Toolbar>
        <select className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={params.importType ?? ''} onChange={(e) => setParams((p) => ({ ...p, importType: e.target.value || undefined, page: 1 }))}>
          <option value="">All types</option>
          {IMPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={params.status ?? ''} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}>
          <option value="">All statuses</option>
          {IMPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable columns={columns} data={q.data?.data ?? []} keyField="importJobId" onRowClick={(r) => navigate(`/inventory/imports/${r.importJobId}`)} emptyTitle="No import jobs" />
          {pagination && <PaginationFooter page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))} />}
        </SectionCard>
      </QueryResult>
    </>
  );
}

