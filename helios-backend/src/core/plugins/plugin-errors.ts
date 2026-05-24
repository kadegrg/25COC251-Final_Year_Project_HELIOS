// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Error classes
// ═══════════════════════════════════════════════════════════════════════

import { AppError } from '../errors/app-error.js';

export class PluginLoadError extends AppError {
  constructor(pluginId: string, reason: string) {
    super(`Failed to load plugin '${pluginId}': ${reason}`, 500, 'PLUGIN_LOAD_ERROR', false, { pluginId });
  }
}

export class PluginConfigError extends AppError {
  constructor(pluginId: string, reason: string, details?: unknown) {
    super(`Plugin config error '${pluginId}': ${reason}`, 422, 'PLUGIN_CONFIG_ERROR', true, { pluginId, ...((details as object) ?? {}) });
  }
}

export class PluginHookConflictError extends AppError {
  constructor(hookName: string, pluginId: string, reason: string) {
    super(`Hook conflict on '${hookName}' from plugin '${pluginId}': ${reason}`, 409, 'PLUGIN_HOOK_CONFLICT', true, { hookName, pluginId });
  }
}

/**
 * Thrown when an interceptor hook denies a business action.
 * This is an operational error — it means the plugin intentionally blocked the action.
 */
export class PluginHookDeniedError extends AppError {
  public readonly pluginId: string;
  public readonly hookName: string;
  public readonly pluginReason: string;

  constructor(pluginId: string, hookName: string, reason: string) {
    super(`Action denied by plugin '${pluginId}': ${reason}`, 403, 'PLUGIN_HOOK_DENIED', true, { pluginId, hookName, reason });
    this.pluginId = pluginId;
    this.hookName = hookName;
    this.pluginReason = reason;
  }
}

export class PluginJobError extends AppError {
  constructor(pluginId: string, jobKey: string, reason: string) {
    super(`Plugin job error '${pluginId}/${jobKey}': ${reason}`, 500, 'PLUGIN_JOB_ERROR', false, { pluginId, jobKey });
  }
}

export class PluginRouteRegistrationError extends AppError {
  constructor(pluginId: string, reason: string) {
    super(`Plugin route registration error '${pluginId}': ${reason}`, 500, 'PLUGIN_ROUTE_ERROR', false, { pluginId });
  }
}

export class PluginMigrationError extends AppError {
  constructor(pluginId: string, migrationKey: string, reason: string) {
    super(`Plugin migration error '${pluginId}/${migrationKey}': ${reason}`, 500, 'PLUGIN_MIGRATION_ERROR', false, { pluginId, migrationKey });
  }
}

export class PluginNotFoundError extends AppError {
  constructor(pluginId: string) {
    super(`Plugin '${pluginId}' not found`, 404, 'PLUGIN_NOT_FOUND', true, { pluginId });
  }
}

