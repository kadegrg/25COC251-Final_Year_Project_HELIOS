import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { DataTable, type Column } from '@/components/common/data-table';
import { QueryResult } from '@/components/common/query-result';
import { AutoStatusBadge } from '@/components/common/status-badge';
import { PermissionGate } from '@/components/auth/guards';
import { usePluginList } from '@/hooks/use-plugins';
import { PLUGIN_PERMISSIONS, type PluginSummary } from '@/types/plugins.types';

const columns: Column<PluginSummary>[] = [
  { id: 'displayName', header: 'Name', cell: (r) => r.displayName },
  { id: 'pluginId', header: 'Plugin ID', cell: (r) => <code className="text-xs">{r.pluginId}</code> },
  { id: 'version', header: 'Version', cell: (r) => r.version },
  { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
  {
    id: 'enabled',
    header: 'Enabled',
    cell: (r) => (
      <span className={r.isEnabled ? 'text-green-600' : 'text-muted-foreground'}>
        {r.isEnabled ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    id: 'lastStartedAt',
    header: 'Last Started',
    cell: (r) => r.lastStartedAt ? new Date(r.lastStartedAt).toLocaleString() : '—',
  },
];

export function PluginsListPage() {
  const navigate = useNavigate();
  const q = usePluginList();

  return (
    <PermissionGate permission={PLUGIN_PERMISSIONS.read}>
      <PageHeader title="Plugins" description="Manage system plugins" />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="plugins">
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data ?? []}
            keyField="pluginId"
            emptyTitle="No plugins registered"
            emptyDescription="No plugins have been discovered by the system."
            onRowClick={(row) => navigate(`/system/plugins/${row.pluginId}`)}
          />
        </SectionCard>
      </QueryResult>
    </PermissionGate>
  );
}

