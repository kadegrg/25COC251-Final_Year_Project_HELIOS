// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin manager
// ═══════════════════════════════════════════════════════════════════════
//
// Orchestrates the full plugin lifecycle:
//   discover -> register -> migrate -> init -> start -> (runtime) -> stop
// ═══════════════════════════════════════════════════════════════════════

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../logging/logger.js';
import { registerBuiltInHooks } from './built-in-hooks.js';
import { registerHook, unregisterPlugin as unregisterPluginHooks } from './hook-registry.js';
import { loadAllPlugins } from './plugin-loader.js';
import {
  upsertPluginRecord,
  updatePluginStatus,
  resolvePluginConfig,
  getPluginRecord,
  setPluginEnabled,
  upsertPluginConfig,
  validatePluginConfig,
} from './plugin-config.service.js';
import { mountPluginRoutes } from './plugin-route-registry.js';
import { registerJob, unregisterPluginJobs, stopAllJobs } from './plugin-job-registry.js';
import { applyPluginMigrations, ensurePluginMigrationsTable } from './plugin-migration.service.js';
import { PluginLoadError, PluginNotFoundError } from './plugin-errors.js';
import type { HeliosPlugin, PluginRuntimeState, PluginStatus } from './plugin-types.js';

// ── Runtime state ────────────────────────────────────────────────────

const runtimePlugins = new Map<string, PluginRuntimeState>();

// ── Resolve plugins base directory ───────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PLUGINS_DIR = join(__dirname, '..', '..', 'plugins');

// ── Bootstrap ────────────────────────────────────────────────────────

/**
 * Full bootstrap sequence for the plugin system.
 * Called once during application startup.
 */
export async function bootstrapPlugins(pluginsDir?: string): Promise<void> {
  const dir = pluginsDir ?? DEFAULT_PLUGINS_DIR;
  logger.info({ pluginsDir: dir }, 'Bootstrapping plugin system');

  // 1. Register all built-in hook names
  registerBuiltInHooks();

  // 2. Ensure plugin system tables exist
  await ensurePluginSystemTables();

  // 3. Discover and load plugins from filesystem
  const plugins = await loadAllPlugins(dir);

  // 4. Register, migrate, init, and start each plugin
  for (const plugin of plugins) {
    try {
      await registerPlugin(plugin);
    } catch (err) {
      logger.error({ err, pluginId: plugin.manifest.pluginId }, 'Plugin registration failed');
    }
  }

  logger.info({ loadedCount: runtimePlugins.size }, 'Plugin bootstrap complete');
}

/**
 * Ensure all plugin system DB tables exist.
 * Uses CREATE TABLE IF NOT EXISTS for idempotency.
 */
async function ensurePluginSystemTables(): Promise<void> {
  const { query } = await import('../../db/index.js');

  await query(`
    CREATE TABLE IF NOT EXISTS system_plugins (
      plugin_id       STRING PRIMARY KEY,
      display_name    STRING NOT NULL,
      version         STRING NOT NULL,
      status          STRING NOT NULL CHECK (status IN ('REGISTERED','INITIALISED','STARTED','STOPPED','FAILED','DISABLED')),
      is_enabled      BOOL NOT NULL DEFAULT true,
      last_started_at TIMESTAMPTZ NULL,
      last_stopped_at TIMESTAMPTZ NULL,
      last_error      STRING NULL,
      metadata        JSONB NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS system_plugin_configs (
      plugin_config_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plugin_id         STRING NOT NULL,
      config_json       JSONB NOT NULL,
      config_version    STRING NULL,
      updated_by_user_id UUID NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (plugin_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS system_plugin_jobs (
      plugin_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plugin_id     STRING NOT NULL,
      job_key       STRING NOT NULL,
      status        STRING NOT NULL CHECK (status IN ('ACTIVE','PAUSED','FAILED')),
      last_run_at   TIMESTAMPTZ NULL,
      next_run_at   TIMESTAMPTZ NULL,
      last_error    STRING NULL,
      metadata      JSONB NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (plugin_id, job_key)
    )
  `);

  await ensurePluginMigrationsTable();

  logger.info('Plugin system tables ensured');
}

// ── Plugin lifecycle ─────────────────────────────────────────────────

/**
 * Register a single plugin: persist record, run migrations, resolve config,
 * register hooks, mount routes, register jobs, then init + start.
 */
async function registerPlugin(plugin: HeliosPlugin): Promise<void> {
  const { pluginId } = plugin.manifest;

  // Check if disabled in DB
  const existing = await getPluginRecord(pluginId);
  if (existing && !existing.is_enabled) {
    logger.info({ pluginId }, 'Plugin is disabled in DB, skipping');
    runtimePlugins.set(pluginId, {
      plugin, status: 'DISABLED', config: {},
    });
    await updatePluginStatus(pluginId, 'DISABLED');
    return;
  }

  // Persist / update plugin record
  await upsertPluginRecord(plugin.manifest, 'REGISTERED');

  const state: PluginRuntimeState = {
    plugin,
    status: 'REGISTERED',
    config: {},
  };
  runtimePlugins.set(pluginId, state);

  try {
    // Run plugin-owned migrations
    if (plugin.migrations && plugin.migrations.length > 0) {
      const applied = await applyPluginMigrations(pluginId, plugin.migrations);
      if (applied > 0) {
        logger.info({ pluginId, applied }, 'Plugin migrations applied');
      }
    }

    // Resolve config (merge defaults + DB)
    state.config = await resolvePluginConfig(plugin.manifest);

    // Persist default config if none exists in DB
    if (!existing || !(await import('./plugin-config.service.js').then(m => m.getPluginConfig(pluginId)))) {
      await upsertPluginConfig(pluginId, state.config, plugin.manifest.version);
    }

    // Register hooks
    if (plugin.hooks) {
      for (const hookReg of plugin.hooks) {
        registerHook(pluginId, hookReg);
      }
      logger.info({ pluginId, hookCount: plugin.hooks.length }, 'Plugin hooks registered');
    }

    // Mount routes
    if (plugin.routes) {
      mountPluginRoutes(plugin);
    }

    // Init
    if (plugin.init) {
      await plugin.init(state.config);
    }
    state.status = 'INITIALISED';
    await updatePluginStatus(pluginId, 'INITIALISED');

    // Register jobs
    if (plugin.jobs) {
      for (const job of plugin.jobs) {
        await registerJob(pluginId, job);
      }
    }

    // Start
    if (plugin.start) {
      await plugin.start();
    }
    state.status = 'STARTED';
    state.startedAt = new Date();
    await updatePluginStatus(pluginId, 'STARTED', { lastStartedAt: true });

    logger.info({ pluginId, version: plugin.manifest.version }, 'Plugin started successfully');
  } catch (err) {
    state.status = 'FAILED';
    state.error = (err as Error).message;
    await updatePluginStatus(pluginId, 'FAILED', { lastError: (err as Error).message });
    logger.error({ err, pluginId }, 'Plugin lifecycle failed');
    // Don't rethrow — allow other plugins to continue loading
  }
}

// ── Runtime operations (for admin endpoints) ─────────────────────────

export async function startPlugin(pluginId: string): Promise<void> {
  const state = runtimePlugins.get(pluginId);
  if (!state) throw new PluginNotFoundError(pluginId);

  if (state.status === 'STARTED') return;

  await setPluginEnabled(pluginId, true);

  try {
    // Re-resolve config
    state.config = await resolvePluginConfig(state.plugin.manifest);

    // Re-register hooks if they were cleared
    if (state.plugin.hooks) {
      unregisterPluginHooks(pluginId);
      for (const hookReg of state.plugin.hooks) {
        registerHook(pluginId, hookReg);
      }
    }

    // Re-register jobs
    if (state.plugin.jobs) {
      for (const job of state.plugin.jobs) {
        await registerJob(pluginId, job);
      }
    }

    if (state.plugin.init) {
      await state.plugin.init(state.config);
    }
    if (state.plugin.start) {
      await state.plugin.start();
    }

    state.status = 'STARTED';
    state.startedAt = new Date();
    state.error = undefined;
    await updatePluginStatus(pluginId, 'STARTED', { lastStartedAt: true });
    logger.info({ pluginId }, 'Plugin started');
  } catch (err) {
    state.status = 'FAILED';
    state.error = (err as Error).message;
    await updatePluginStatus(pluginId, 'FAILED', { lastError: (err as Error).message });
    throw err;
  }
}

export async function stopPlugin(pluginId: string): Promise<void> {
  const state = runtimePlugins.get(pluginId);
  if (!state) throw new PluginNotFoundError(pluginId);

  if (state.status === 'STOPPED' || state.status === 'DISABLED') return;

  try {
    if (state.plugin.stop) {
      await state.plugin.stop();
    }
    unregisterPluginJobs(pluginId);
    unregisterPluginHooks(pluginId);

    state.status = 'STOPPED';
    state.stoppedAt = new Date();
    await updatePluginStatus(pluginId, 'STOPPED', { lastStoppedAt: true });
    logger.info({ pluginId }, 'Plugin stopped');
  } catch (err) {
    state.status = 'FAILED';
    state.error = (err as Error).message;
    await updatePluginStatus(pluginId, 'FAILED', { lastError: (err as Error).message });
    throw err;
  }
}

export async function reloadPlugin(pluginId: string): Promise<void> {
  await stopPlugin(pluginId);
  await startPlugin(pluginId);
  logger.info({ pluginId }, 'Plugin reloaded');
}

export async function disablePlugin(pluginId: string): Promise<void> {
  await stopPlugin(pluginId);
  await setPluginEnabled(pluginId, false);
  const state = runtimePlugins.get(pluginId);
  if (state) state.status = 'DISABLED';
  await updatePluginStatus(pluginId, 'DISABLED');
  logger.info({ pluginId }, 'Plugin disabled');
}

export async function enablePlugin(pluginId: string): Promise<void> {
  await setPluginEnabled(pluginId, true);
  await startPlugin(pluginId);
  logger.info({ pluginId }, 'Plugin enabled');
}

// ── Query ────────────────────────────────────────────────────────────

export function getPluginState(pluginId: string): PluginRuntimeState | undefined {
  return runtimePlugins.get(pluginId);
}

export function getAllPluginStates(): Map<string, PluginRuntimeState> {
  return runtimePlugins;
}

export function getLoadedPlugins(): string[] {
  return Array.from(runtimePlugins.keys());
}

/**
 * Get resolved config for a running plugin.
 */
export function getPluginRuntimeConfig(pluginId: string): Record<string, unknown> | undefined {
  return runtimePlugins.get(pluginId)?.config;
}

/**
 * Update a plugin's config at runtime. Validates, persists, then optionally reloads.
 */
export async function updatePluginConfig(
  pluginId: string,
  newConfig: Record<string, unknown>,
  updatedByUserId?: string,
): Promise<Record<string, unknown>> {
  const state = runtimePlugins.get(pluginId);
  if (!state) throw new PluginNotFoundError(pluginId);

  const validation = validatePluginConfig(state.plugin.manifest, newConfig);
  if (!validation.valid) {
    const { PluginConfigError } = await import('./plugin-errors.js');
    throw new PluginConfigError(pluginId, 'Validation failed', validation.errors);
  }

  await upsertPluginConfig(pluginId, newConfig, state.plugin.manifest.version, updatedByUserId);
  state.config = newConfig;

  logger.info({ pluginId, updatedByUserId }, 'Plugin config updated');
  return newConfig;
}

// ── Shutdown ─────────────────────────────────────────────────────────

/**
 * Gracefully stop all plugins and clean up.
 */
export async function shutdownPlugins(): Promise<void> {
  logger.info('Shutting down all plugins');
  for (const [pluginId, state] of runtimePlugins) {
    if (state.status === 'STARTED') {
      try {
        if (state.plugin.stop) {
          await state.plugin.stop();
        }
      } catch (err) {
        logger.error({ err, pluginId }, 'Error during plugin shutdown');
      }
    }
  }
  stopAllJobs();
  runtimePlugins.clear();
  logger.info('All plugins shut down');
}


