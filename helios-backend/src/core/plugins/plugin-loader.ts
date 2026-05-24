// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin loader
// ═══════════════════════════════════════════════════════════════════════
//
// Discovers and loads plugin modules from the plugins directory.
// Each plugin must export a default HeliosPlugin object.
// ═══════════════════════════════════════════════════════════════════════

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '../logging/logger.js';
import { PluginLoadError } from './plugin-errors.js';
import type { HeliosPlugin } from './plugin-types.js';

/**
 * Discover plugin directories under the given base path.
 * Each subdirectory that contains an index.ts / index.js is treated as a plugin.
 */
export async function discoverPluginDirs(basePath: string): Promise<string[]> {
  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    const dirs: string[] = [];
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        dirs.push(join(basePath, entry.name));
      }
    }
    return dirs.sort();
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      logger.warn({ basePath }, 'Plugin directory does not exist');
      return [];
    }
    throw err;
  }
}

/**
 * Load a single plugin module from a directory.
 * Expects a default export conforming to HeliosPlugin.
 */
export async function loadPluginFromDir(dir: string): Promise<HeliosPlugin> {
  // Try both .ts (tsx runtime) and .js (compiled)
  const candidates = [
    join(dir, 'index.ts'),
    join(dir, 'index.js'),
  ];

  let modulePath: string | null = null;
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      modulePath = candidate;
      break;
    } catch {
      continue;
    }
  }

  if (!modulePath) {
    throw new PluginLoadError(dir, 'No index.ts or index.js found');
  }

  try {
    // Use dynamic import for ESM compatibility
    const mod = await import(modulePath);
    const plugin: HeliosPlugin = mod.default ?? mod.plugin;

    if (!plugin || !plugin.manifest || !plugin.manifest.pluginId) {
      throw new PluginLoadError(dir, 'Plugin must export a default HeliosPlugin with a valid manifest');
    }

    return plugin;
  } catch (err) {
    if (err instanceof PluginLoadError) throw err;
    throw new PluginLoadError(dir, `Import failed: ${(err as Error).message}`);
  }
}

/**
 * Discover and load all plugins from a base directory.
 */
export async function loadAllPlugins(basePath: string): Promise<HeliosPlugin[]> {
  const dirs = await discoverPluginDirs(basePath);
  const plugins: HeliosPlugin[] = [];

  logger.info({ basePath, count: dirs.length }, 'Discovered plugin directories');

  for (const dir of dirs) {
    try {
      const plugin = await loadPluginFromDir(dir);
      plugins.push(plugin);
      logger.info({ pluginId: plugin.manifest.pluginId, version: plugin.manifest.version }, 'Plugin loaded from filesystem');
    } catch (err) {
      logger.error({ err, dir }, 'Failed to load plugin from directory');
      // Continue loading other plugins — one bad plugin should not block all
    }
  }

  return plugins;
}

