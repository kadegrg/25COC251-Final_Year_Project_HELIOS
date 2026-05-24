// ═══════════════════════════════════════════════════════════════════════
// HELIOS System — Plugin admin repository
// ═══════════════════════════════════════════════════════════════════════

import { query } from '../../../db/index.js';

export async function findAllPlugins() {
  const result = await query('SELECT * FROM system_plugins ORDER BY plugin_id');
  return result.rows;
}

export async function findPluginById(pluginId: string) {
  const result = await query('SELECT * FROM system_plugins WHERE plugin_id = $1', [pluginId]);
  return result.rows[0] ?? null;
}

export async function findPluginConfig(pluginId: string) {
  const result = await query('SELECT * FROM system_plugin_configs WHERE plugin_id = $1', [pluginId]);
  return result.rows[0] ?? null;
}

export async function findPluginJobs(pluginId: string) {
  const result = await query('SELECT * FROM system_plugin_jobs WHERE plugin_id = $1 ORDER BY job_key', [pluginId]);
  return result.rows;
}

