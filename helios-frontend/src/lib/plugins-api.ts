import { api } from './api-client';
import type {
  PluginSummary, PluginDetail, PluginConfig, PluginJob,
  HookStatsResponse, UpdatePluginRequest, UpdatePluginConfigRequest,
} from '@/types/plugins.types';

const BASE = '/v1/system/plugins';

// --- Queries ---

export async function listPlugins() {
  const res = await api.get<{ success: boolean; data: PluginSummary[] }>(BASE);
  return res.data.data;
}

export async function getHookStats() {
  const res = await api.get<{ success: boolean; data: HookStatsResponse }>(`${BASE}/hooks`);
  return res.data.data;
}

export async function getPlugin(pluginId: string) {
  const res = await api.get<{ success: boolean; data: PluginDetail }>(`${BASE}/${pluginId}`);
  return res.data.data;
}

export async function getPluginConfig(pluginId: string) {
  const res = await api.get<{ success: boolean; data: PluginConfig }>(`${BASE}/${pluginId}/config`);
  return res.data.data;
}

export async function getPluginJobs(pluginId: string) {
  const res = await api.get<{ success: boolean; data: PluginJob[] }>(`${BASE}/${pluginId}/jobs`);
  return res.data.data;
}

// --- Mutations ---

export async function updatePlugin(pluginId: string, body: UpdatePluginRequest) {
  const res = await api.patch<{ success: boolean; data: PluginDetail }>(`${BASE}/${pluginId}`, body);
  return res.data.data;
}

export async function updatePluginConfig(pluginId: string, body: UpdatePluginConfigRequest) {
  const res = await api.put<{ success: boolean; data: { pluginId: string; config: Record<string, unknown> } }>(
    `${BASE}/${pluginId}/config`, body,
  );
  return res.data.data;
}

export async function startPlugin(pluginId: string) {
  const res = await api.post<{ success: boolean; data: PluginDetail }>(`${BASE}/${pluginId}/start`);
  return res.data.data;
}

export async function stopPlugin(pluginId: string) {
  const res = await api.post<{ success: boolean; data: PluginDetail }>(`${BASE}/${pluginId}/stop`);
  return res.data.data;
}

export async function reloadPlugin(pluginId: string) {
  const res = await api.post<{ success: boolean; data: PluginDetail }>(`${BASE}/${pluginId}/reload`);
  return res.data.data;
}

