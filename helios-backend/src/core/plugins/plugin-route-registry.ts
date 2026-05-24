// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin route registry
// ═══════════════════════════════════════════════════════════════════════

import { Router, type Express } from 'express';
import { logger } from '../logging/logger.js';
import { PluginRouteRegistrationError } from './plugin-errors.js';
import type { HeliosPlugin } from './plugin-types.js';

const pluginRouterBase = Router({ mergeParams: true });
const mountedPlugins = new Set<string>();

/**
 * Returns the base router that should be mounted at /api/v1/plugins
 * on the Express app. Individual plugin routers are nested under it.
 */
export function getPluginRouterBase(): Router {
  return pluginRouterBase;
}

/**
 * Mount a plugin's routes under /api/v1/plugins/:pluginId/
 */
export function mountPluginRoutes(plugin: HeliosPlugin): void {
  const pluginId = plugin.manifest.pluginId;

  if (!plugin.routes) return;

  if (mountedPlugins.has(pluginId)) {
    logger.warn({ pluginId }, 'Plugin routes already mounted, skipping');
    return;
  }

  try {
    pluginRouterBase.use(`/${pluginId}`, plugin.routes.router);
    mountedPlugins.add(pluginId);
    logger.info({ pluginId }, 'Plugin routes mounted');
  } catch (err) {
    throw new PluginRouteRegistrationError(pluginId, (err as Error).message);
  }
}

/**
 * Check if a plugin has routes mounted.
 */
export function hasPluginRoutes(pluginId: string): boolean {
  return mountedPlugins.has(pluginId);
}

/**
 * List all plugin IDs with mounted routes.
 */
export function getMountedPluginIds(): string[] {
  return Array.from(mountedPlugins);
}

