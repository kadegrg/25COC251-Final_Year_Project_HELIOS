import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as pluginsApi from '@/lib/plugins-api';
import type { UpdatePluginRequest, UpdatePluginConfigRequest } from '@/types/plugins.types';

export const pluginKeys = {
  all: ['system', 'plugins'] as const,
  list: () => ['system', 'plugins', 'list'] as const,
  hooks: () => ['system', 'plugins', 'hooks'] as const,
  detail: (id: string) => ['system', 'plugins', id] as const,
  config: (id: string) => ['system', 'plugins', id, 'config'] as const,
  jobs: (id: string) => ['system', 'plugins', id, 'jobs'] as const,
};

export function usePluginList() {
  return useQuery({ queryKey: pluginKeys.list(), queryFn: pluginsApi.listPlugins });
}

export function useHookStats() {
  return useQuery({ queryKey: pluginKeys.hooks(), queryFn: pluginsApi.getHookStats });
}

export function usePlugin(pluginId: string) {
  return useQuery({
    queryKey: pluginKeys.detail(pluginId),
    queryFn: () => pluginsApi.getPlugin(pluginId),
    enabled: !!pluginId,
  });
}

export function usePluginConfig(pluginId: string, enabled = true) {
  return useQuery({
    queryKey: pluginKeys.config(pluginId),
    queryFn: () => pluginsApi.getPluginConfig(pluginId),
    enabled: !!pluginId && enabled,
  });
}

export function usePluginJobs(pluginId: string, enabled = true) {
  return useQuery({
    queryKey: pluginKeys.jobs(pluginId),
    queryFn: () => pluginsApi.getPluginJobs(pluginId),
    enabled: !!pluginId && enabled,
  });
}

function usePluginAction<T>(mutationFn: (args: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pluginKeys.all });
    },
  });
}

export function useUpdatePlugin() {
  return usePluginAction<{ pluginId: string; body: UpdatePluginRequest }>(
    ({ pluginId, body }) => pluginsApi.updatePlugin(pluginId, body),
  );
}

export function useUpdatePluginConfig() {
  return usePluginAction<{ pluginId: string; body: UpdatePluginConfigRequest }>(
    ({ pluginId, body }) => pluginsApi.updatePluginConfig(pluginId, body),
  );
}

export function useStartPlugin() {
  return usePluginAction<string>(pluginsApi.startPlugin);
}

export function useStopPlugin() {
  return usePluginAction<string>(pluginsApi.stopPlugin);
}

export function useReloadPlugin() {
  return usePluginAction<string>(pluginsApi.reloadPlugin);
}

