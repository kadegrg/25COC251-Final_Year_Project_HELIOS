import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/guards';
import { useStartPlugin, useStopPlugin, useReloadPlugin, useUpdatePlugin } from '@/hooks/use-plugins';
import { PLUGIN_PERMISSIONS, type PluginDetail } from '@/types/plugins.types';
import { Play, Square, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

export function PluginActionsBar({ plugin }: { plugin: PluginDetail }) {
  const startMut = useStartPlugin();
  const stopMut = useStopPlugin();
  const reloadMut = useReloadPlugin();
  const updateMut = useUpdatePlugin();

  const isStarted = plugin.status === 'STARTED';
  const anyLoading = startMut.isPending || stopMut.isPending || reloadMut.isPending || updateMut.isPending;

  return (
    <PermissionGate permission={PLUGIN_PERMISSIONS.manage}>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isStarted || anyLoading}
          onClick={() => startMut.mutate(plugin.pluginId)}
        >
          <Play className="mr-1 h-3.5 w-3.5" />
          Start
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!isStarted || anyLoading}
          onClick={() => stopMut.mutate(plugin.pluginId)}
        >
          <Square className="mr-1 h-3.5 w-3.5" />
          Stop
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!isStarted || anyLoading}
          onClick={() => reloadMut.mutate(plugin.pluginId)}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Reload
        </Button>
        <Button
          size="sm"
          variant={plugin.isEnabled ? 'destructive' : 'default'}
          disabled={anyLoading}
          onClick={() =>
            updateMut.mutate({
              pluginId: plugin.pluginId,
              body: { isEnabled: !plugin.isEnabled },
            })
          }
        >
          {plugin.isEnabled ? (
            <>
              <ToggleRight className="mr-1 h-3.5 w-3.5" />
              Disable
            </>
          ) : (
            <>
              <ToggleLeft className="mr-1 h-3.5 w-3.5" />
              Enable
            </>
          )}
        </Button>
      </div>
    </PermissionGate>
  );
}


