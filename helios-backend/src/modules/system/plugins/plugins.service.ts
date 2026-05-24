// ═══════════════════════════════════════════════════════════════════════
// HELIOS System — Plugin admin service
// ═══════════════════════════════════════════════════════════════════════

import * as repo from './plugins.repository.js';
import * as pluginManager from '../../../core/plugins/plugin-manager.js';
import { PluginNotFoundError } from '../../../core/plugins/plugin-errors.js';
import { getRegistryStats, getRegisteredHookNames } from '../../../core/plugins/hook-registry.js';
import { getJobRecords } from '../../../core/plugins/plugin-job-registry.js';
import { logger } from '../../../core/logging/logger.js';

export async function listPlugins() {
  const dbRecords = await repo.findAllPlugins();
  const runtimeStates = pluginManager.getAllPluginStates();

  return dbRecords.map((row: any) => {
    const runtime = runtimeStates.get(row.plugin_id);
    return {
      pluginId: row.plugin_id,
      displayName: row.display_name,
      version: row.version,
      status: runtime?.status ?? row.status,
      isEnabled: row.is_enabled,
      lastStartedAt: row.last_started_at,
      lastStoppedAt: row.last_stopped_at,
      lastError: runtime?.error ?? row.last_error,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function getPlugin(pluginId: string) {
  const row = await repo.findPluginById(pluginId);
  if (!row) throw new PluginNotFoundError(pluginId);

  const runtime = pluginManager.getPluginState(pluginId);
  return {
    pluginId: row.plugin_id,
    displayName: row.display_name,
    version: row.version,
    status: runtime?.status ?? row.status,
    isEnabled: row.is_enabled,
    lastStartedAt: row.last_started_at,
    lastStoppedAt: row.last_stopped_at,
    lastError: runtime?.error ?? row.last_error,
    config: runtime?.config ?? null,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updatePlugin(pluginId: string, input: { isEnabled?: boolean }) {
  const existing = await repo.findPluginById(pluginId);
  if (!existing) throw new PluginNotFoundError(pluginId);

  if (input.isEnabled === false) {
    await pluginManager.disablePlugin(pluginId);
  } else if (input.isEnabled === true) {
    await pluginManager.enablePlugin(pluginId);
  }

  return getPlugin(pluginId);
}

export async function getPluginConfig(pluginId: string) {
  const existing = await repo.findPluginById(pluginId);
  if (!existing) throw new PluginNotFoundError(pluginId);

  const runtime = pluginManager.getPluginRuntimeConfig(pluginId);
  const dbConfig = await repo.findPluginConfig(pluginId);

  return {
    pluginId,
    config: runtime ?? dbConfig?.config_json ?? {},
    configVersion: dbConfig?.config_version,
    updatedAt: dbConfig?.updated_at,
  };
}

export async function updatePluginConfigAdmin(
  pluginId: string,
  config: Record<string, unknown>,
  updatedByUserId?: string,
) {
  const updated = await pluginManager.updatePluginConfig(pluginId, config, updatedByUserId);
  logger.info({ pluginId, updatedByUserId }, 'Plugin config updated via admin');
  return {
    pluginId,
    config: updated,
  };
}

export async function startPluginAdmin(pluginId: string) {
  await pluginManager.startPlugin(pluginId);
  return getPlugin(pluginId);
}

export async function stopPluginAdmin(pluginId: string) {
  await pluginManager.stopPlugin(pluginId);
  return getPlugin(pluginId);
}

export async function reloadPluginAdmin(pluginId: string) {
  await pluginManager.reloadPlugin(pluginId);
  return getPlugin(pluginId);
}

export async function getPluginJobs(pluginId: string) {
  const existing = await repo.findPluginById(pluginId);
  if (!existing) throw new PluginNotFoundError(pluginId);

  const jobs = await getJobRecords(pluginId);
  return jobs.map((j: any) => ({
    pluginJobId: j.plugin_job_id,
    pluginId: j.plugin_id,
    jobKey: j.job_key,
    status: j.status,
    lastRunAt: j.last_run_at,
    nextRunAt: j.next_run_at,
    lastError: j.last_error,
    createdAt: j.created_at,
    updatedAt: j.updated_at,
  }));
}

export async function getHookStats() {
  return {
    registeredHooks: getRegisteredHookNames(),
    bindingStats: getRegistryStats(),
  };
}

