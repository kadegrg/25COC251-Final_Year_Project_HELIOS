import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { QueryResult } from '@/components/common/query-result';
import { TabbedDetailLayout } from '@/components/common/tabbed-detail-layout';
import { PermissionGate } from '@/components/auth/guards';
import { usePlugin } from '@/hooks/use-plugins';
import { PLUGIN_PERMISSIONS } from '@/types/plugins.types';
import { PluginInfoPanel } from './plugin-info-panel';
import { PluginActionsBar } from './plugin-actions-bar';
import { PluginConfigSection } from './plugin-config-section';
import { PluginJobsSection } from './plugin-jobs-section';

export function PluginDetailPage() {
  const { pluginId } = useParams<{ pluginId: string }>();
  const q = usePlugin(pluginId!);

  return (
    <PermissionGate permission={PLUGIN_PERMISSIONS.read}>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="plugin">
        {q.data && (
          <>
            <PageHeader
              title={q.data.displayName}
              description={`Plugin: ${q.data.pluginId}`}
              breadcrumbs={[
                { label: 'Plugins', href: '/system/plugins' },
                { label: q.data.displayName },
              ]}
              actions={<PluginActionsBar plugin={q.data} />}
            />
            <PluginInfoPanel plugin={q.data} />
            <TabbedDetailLayout
              tabs={[
                {
                  id: 'config',
                  label: 'Configuration',
                  content: (
                    <PermissionGate permission={PLUGIN_PERMISSIONS.configRead}>
                      <PluginConfigSection pluginId={pluginId!} />
                    </PermissionGate>
                  ),
                },
                {
                  id: 'jobs',
                  label: 'Jobs',
                  content: (
                    <PermissionGate permission={PLUGIN_PERMISSIONS.jobRead}>
                      <PluginJobsSection pluginId={pluginId!} />
                    </PermissionGate>
                  ),
                },
              ]}
            />
          </>
        )}
      </QueryResult>
    </PermissionGate>
  );
}

