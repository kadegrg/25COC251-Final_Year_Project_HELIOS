import { useParams } from 'react-router-dom';
import { useImportJob, useProcessImport } from '@/hooks/use-stock-movements';
import type { ImportRow } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, DetailPanel, DataTable, QueryResult, AutoStatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';

export function ImportDetailPage() {
  const { importJobId } = useParams<{ importJobId: string }>();
  const q = useImportJob(importJobId!);
  const processMutation = useProcessImport();
  const detail = q.data;
  const job = detail?.job;
  const rows = detail?.rows ?? [];

  const canProcess = job && (job.status === 'VALID' || job.status === 'PARTIALLY_VALID');

  const rowColumns: Column<ImportRow>[] = [
    { id: 'row', header: '#', cell: (r) => r.rowNumber },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.validationStatus} /> },
    { id: 'data', header: 'Data', cell: (r) => <code className="text-xs">{JSON.stringify(r.rowData).slice(0, 80)}</code> },
    { id: 'errors', header: 'Errors', cell: (r) => r.validationErrors ? JSON.stringify(r.validationErrors) : '—' },
    { id: 'ref', header: 'Result', cell: (r) => r.resultReferenceId ? `${r.resultReferenceType}: ${r.resultReferenceId.slice(0, 8)}…` : '—' },
  ];

  const handleProcess = () => {
    if (!job) return;
    processMutation.mutate({ importJobId: job.importJobId }, { onSuccess: () => q.refetch() });
  };

  return (
    <>
      <PageHeader
        title="Import Detail"
        breadcrumbs={[{ label: 'Imports', href: '/inventory/imports' }, { label: importJobId?.slice(0, 8) ?? '' }]}
        actions={canProcess ? (
          <Button size="sm" onClick={handleProcess} disabled={processMutation.isPending}>
            {processMutation.isPending ? 'Processing…' : 'Process Import'}
          </Button>
        ) : undefined}
      />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="import job">
        {job && (
          <>
            <SectionCard title="Job Summary" className="mb-4">
              <DetailPanel columns={2} fields={[
                { label: 'Import Job ID', value: job.importJobId },
                { label: 'Type', value: job.importType },
                { label: 'Status', value: <AutoStatusBadge status={job.status} /> },
                { label: 'Site', value: job.siteId },
                { label: 'Filename', value: job.sourceFilename ?? '—' },
                { label: 'Format', value: job.sourceFormat ?? '—' },
                { label: 'Total Rows', value: job.summaryJson?.totalRows ?? '—' },
                { label: 'Valid Rows', value: job.summaryJson?.validRows ?? '—' },
                { label: 'Invalid Rows', value: job.summaryJson?.invalidRows ?? '—' },
                { label: 'Created', value: new Date(job.createdAt).toLocaleString() },
                { label: 'Started', value: job.startedAt ? new Date(job.startedAt).toLocaleString() : '—' },
                { label: 'Completed', value: job.completedAt ? new Date(job.completedAt).toLocaleString() : '—' },
              ]} />
            </SectionCard>
            <SectionCard title="Rows" noPadding>
              <DataTable columns={rowColumns} data={rows} keyField="importRowId" emptyTitle="No rows" />
            </SectionCard>
          </>
        )}
      </QueryResult>
    </>
  );
}

