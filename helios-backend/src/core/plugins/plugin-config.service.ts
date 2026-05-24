// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin config persistence service
// ═══════════════════════════════════════════════════════════════════════

import { query, type PoolClient } from '../../db/index.js';
import { generateId } from '../../utils/ids.js';
import { logger } from '../logging/logger.js';
import { PluginConfigError } from './plugin-errors.js';
import type { HeliosPluginManifest } from './plugin-types.js';

// ── DB operations ────────────────────────────────────────────────────

export async function upsertPluginRecord(
  manifest: HeliosPluginManifest,
  status: string,
  client?: PoolClient,
): Promise<void> {
  const q = client ?? await import('../../db/index.js').then(m => m.pool);
  await (q as any).query(
    `INSERT INTO system_plugins (plugin_id, display_name, version, status, is_enabled, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now(), now())
     ON CONFLICT (plugin_id) DO UPDATE
       SET display_name = $2, version = $3, status = $4, updated_at = now()`,
    [manifest.pluginId, manifest.displayName, manifest.version, status, manifest.enabledByDefault, JSON.stringify({ author: manifest.author, description: manifest.description })],
  );
}

export async function updatePluginStatus(
  pluginId: string,
  status: string,
  extra: { lastError?: string; lastStartedAt?: boolean; lastStoppedAt?: boolean } = {},
): Promise<void> {
  const sets: string[] = ['status = $2', 'updated_at = now()'];
  const params: unknown[] = [pluginId, status];
  let idx = 3;

  if (extra.lastError !== undefined) {
    sets.push(`last_error = $${idx++}`);
    params.push(extra.lastError);
  }
  if (extra.lastStartedAt) {
    sets.push('last_started_at = now()');
  }
  if (extra.lastStoppedAt) {
    sets.push('last_stopped_at = now()');
  }

  await query(`UPDATE system_plugins SET ${sets.join(', ')} WHERE plugin_id = $1`, params);
}

export async function setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
  await query('UPDATE system_plugins SET is_enabled = $2, updated_at = now() WHERE plugin_id = $1', [pluginId, enabled]);
}

export async function getPluginRecord(pluginId: string): Promise<any | null> {
  const result = await query('SELECT * FROM system_plugins WHERE plugin_id = $1', [pluginId]);
  return result.rows[0] ?? null;
}

export async function listPluginRecords(): Promise<any[]> {
  const result = await query('SELECT * FROM system_plugins ORDER BY plugin_id');
  return result.rows;
}

// ── Config CRUD ──────────────────────────────────────────────────────

export async function getPluginConfig(pluginId: string): Promise<Record<string, unknown> | null> {
  const result = await query(
    'SELECT config_json FROM system_plugin_configs WHERE plugin_id = $1',
    [pluginId],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].config_json as Record<string, unknown>;
}

export async function upsertPluginConfig(
  pluginId: string,
  configJson: Record<string, unknown>,
  version: string,
  updatedByUserId?: string,
): Promise<void> {
  await query(
    `INSERT INTO system_plugin_configs (plugin_config_id, plugin_id, config_json, config_version, updated_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, now(), now())
     ON CONFLICT (plugin_id) DO UPDATE
       SET config_json = $3, config_version = $4, updated_by_user_id = $5, updated_at = now()`,
    [generateId(), pluginId, JSON.stringify(configJson), version, updatedByUserId ?? null],
  );
}

// ── Config resolution ────────────────────────────────────────────────

/**
 * Resolves effective config for a plugin:
 * 1. Start with manifest defaults
 * 2. Overlay DB-persisted config
 * 3. Validate against schema
 */
export async function resolvePluginConfig(manifest: HeliosPluginManifest): Promise<Record<string, unknown>> {
  const defaults = manifest.defaultConfig ?? {};
  const dbConfig = await getPluginConfig(manifest.pluginId);
  const merged = { ...defaults, ...dbConfig };

  if (manifest.configSchema) {
    const parsed = manifest.configSchema.safeParse(merged);
    if (!parsed.success) {
      logger.warn({ pluginId: manifest.pluginId, errors: parsed.error.format() }, 'Plugin config validation failed, using defaults');
      throw new PluginConfigError(manifest.pluginId, 'Config validation failed', parsed.error.format());
    }
    return parsed.data as Record<string, unknown>;
  }

  return merged;
}

/**
 * Validate config against manifest schema without persisting.
 */
export function validatePluginConfig(manifest: HeliosPluginManifest, config: Record<string, unknown>): { valid: boolean; errors?: unknown } {
  if (!manifest.configSchema) return { valid: true };
  const parsed = manifest.configSchema.safeParse(config);
  if (!parsed.success) return { valid: false, errors: parsed.error.format() };
  return { valid: true };
}

