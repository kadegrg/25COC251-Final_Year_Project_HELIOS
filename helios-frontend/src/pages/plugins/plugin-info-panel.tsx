import { SectionCard } from '@/components/common/section-card';
import { DetailPanel } from '@/components/common/detail-panel';
import { AutoStatusBadge } from '@/components/common/status-badge';
import type { PluginDetail } from '@/types/plugins.types';

function formatTs(ts: string | null) {
  return ts ? new Date(ts).toLocaleString() : '—';
}

export function PluginInfoPanel({ plugin }: { plugin: PluginDetail }) {
  return (
    <SectionCard title="Plugin Details">
      <DetailPanel
        columns={2}
        fields={[
          { label: 'Plugin ID', value: <code className="text-xs">{plugin.pluginId}</code> },
          { label: 'Display Name', value: plugin.displayName },
          { label: 'Version', value: plugin.version },
          { label: 'Status', value: <AutoStatusBadge status={plugin.status} /> },
          { label: 'Enabled', value: plugin.isEnabled ? 'Yes' : 'No' },
          { label: 'Author', value: plugin.metadata?.author ?? '—' },
          { label: 'Description', value: plugin.metadata?.description ?? '—' },
          { label: 'Last Started', value: formatTs(plugin.lastStartedAt) },
          { label: 'Last Stopped', value: formatTs(plugin.lastStoppedAt) },
          { label: 'Last Error', value: plugin.lastError ?? '—' },
          { label: 'Created', value: formatTs(plugin.createdAt) },
          { label: 'Updated', value: formatTs(plugin.updatedAt) },
        ]}
      />
    </SectionCard>
  );
}

