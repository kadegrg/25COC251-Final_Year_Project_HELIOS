import { SectionCard } from '@/components/common/section-card';
import { DataTable, type Column } from '@/components/common/data-table';
import { QueryResult } from '@/components/common/query-result';
import { AutoStatusBadge } from '@/components/common/status-badge';
import { usePluginJobs } from '@/hooks/use-plugins';
import type { PluginJob } from '@/types/plugins.types';

function formatTs(ts: string | null) {
  return ts ? new Date(ts).toLocaleString() : '—';
}

const columns: Column<PluginJob>[] = [
  { id: 'jobKey', header: 'Job Key', cell: (r) => <code className="text-xs">{r.jobKey}</code> },
  { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
  { id: 'lastRunAt', header: 'Last Run', cell: (r) => formatTs(r.lastRunAt) },
  { id: 'nextRunAt', header: 'Next Run', cell: (r) => formatTs(r.nextRunAt) },
  { id: 'lastError', header: 'Last Error', cell: (r) => r.lastError ?? '—' },
];

export function PluginJobsSection({ pluginId }: { pluginId: string }) {
  const q = usePluginJobs(pluginId);

  return (
    <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="jobs">
      <SectionCard title="Scheduled Jobs" noPadding>
        <DataTable
          columns={columns}
          data={q.data ?? []}
          keyField="pluginJobId"
          emptyTitle="No jobs"
          emptyDescription="This plugin has no scheduled jobs."
        />
      </SectionCard>
    </QueryResult>
  );
}

