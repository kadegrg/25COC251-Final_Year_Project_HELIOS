// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin migration service
// ═══════════════════════════════════════════════════════════════════════
//
// Tracks and applies plugin-owned database migrations.
// Each migration is identified by (plugin_id, migration_key) and applied
// at most once. Migrations run inside a transaction for safety.
// ═══════════════════════════════════════════════════════════════════════

import { pool, query } from '../../db/index.js';
import { generateId } from '../../utils/ids.js';
import { logger } from '../logging/logger.js';
import { PluginMigrationError } from './plugin-errors.js';
import type { PluginMigration } from './plugin-types.js';

/**
 * Ensure the plugin migration tracking table exists.
 * Called once during plugin system bootstrap.
 */
export async function ensurePluginMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS system_plugin_migrations (
      plugin_migration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plugin_id           STRING NOT NULL,
      migration_key       STRING NOT NULL,
      applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (plugin_id, migration_key)
    )
  `);
}

/**
 * Get the set of already-applied migration keys for a plugin.
 */
async function getAppliedMigrations(pluginId: string): Promise<Set<string>> {
  const result = await query<{ migration_key: string }>(
    'SELECT migration_key FROM system_plugin_migrations WHERE plugin_id = $1',
    [pluginId],
  );
  return new Set(result.rows.map(r => r.migration_key));
}

/**
 * Apply pending migrations for a plugin.
 * Returns the number of newly applied migrations.
 */
export async function applyPluginMigrations(
  pluginId: string,
  migrations: PluginMigration[],
): Promise<number> {
  if (migrations.length === 0) return 0;

  const applied = await getAppliedMigrations(pluginId);
  let count = 0;

  for (const migration of migrations) {
    if (applied.has(migration.key)) {
      logger.debug({ pluginId, migrationKey: migration.key }, 'Plugin migration already applied, skipping');
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.up);
      await client.query(
        'INSERT INTO system_plugin_migrations (plugin_migration_id, plugin_id, migration_key) VALUES ($1, $2, $3)',
        [generateId(), pluginId, migration.key],
      );
      await client.query('COMMIT');
      count++;
      logger.info({ pluginId, migrationKey: migration.key }, 'Plugin migration applied');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err, pluginId, migrationKey: migration.key }, 'Plugin migration failed');
      throw new PluginMigrationError(pluginId, migration.key, (err as Error).message);
    } finally {
      client.release();
    }
  }

  return count;
}

