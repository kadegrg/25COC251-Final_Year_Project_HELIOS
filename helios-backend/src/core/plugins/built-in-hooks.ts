// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Register all built-in hook names
// ═══════════════════════════════════════════════════════════════════════

import { BuiltInHooks } from './hook-types.js';
import { registerHookName } from './hook-registry.js';
import { logger } from '../logging/logger.js';

/**
 * Registers every value in BuiltInHooks so plugins can discover them.
 * Called once at application startup before plugins are loaded.
 */
export function registerBuiltInHooks(): void {
  const names = Object.values(BuiltInHooks);
  for (const name of names) {
    registerHookName(name);
  }
  logger.info({ count: names.length }, 'Built-in hook names registered');
}

