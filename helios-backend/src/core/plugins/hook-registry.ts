// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Hook registry
// ═══════════════════════════════════════════════════════════════════════
//
// Central registry that tracks all hook bindings.
// Handlers are organised by hook name and sorted by priority.
// ═══════════════════════════════════════════════════════════════════════

import { logger } from '../logging/logger.js';
import type { HookName, HookCategory, HookHandler, HookRegistration } from './hook-types.js';

// ── Internal binding record ──────────────────────────────────────────

export interface HookBinding {
  pluginId: string;
  hookName: HookName;
  category: HookCategory;
  handler: HookHandler;
  priority: number;
  required: boolean;
  description?: string;
}

// ── Registry state ───────────────────────────────────────────────────

const bindings = new Map<HookName, HookBinding[]>();
const knownHookNames = new Set<HookName>();

// ── Hook name management ─────────────────────────────────────────────

/**
 * Register a hook name so it becomes discoverable.
 * Built-in hooks are registered at startup; plugins may register custom ones.
 */
export function registerHookName(hookName: HookName): void {
  knownHookNames.add(hookName);
}

export function getRegisteredHookNames(): HookName[] {
  return Array.from(knownHookNames);
}

export function isHookRegistered(hookName: HookName): boolean {
  return knownHookNames.has(hookName);
}

// ── Hook binding management ──────────────────────────────────────────

/**
 * Register a hook handler from a plugin.
 */
export function registerHook(pluginId: string, reg: HookRegistration): void {
  const priority = reg.priority ?? 100;
  const required = reg.required ?? (reg.category === 'INTERCEPTOR');

  const binding: HookBinding = {
    pluginId,
    hookName: reg.hookName,
    category: reg.category,
    handler: reg.handler,
    priority,
    required,
    description: reg.description,
  };

  const existing = bindings.get(reg.hookName) ?? [];
  existing.push(binding);
  // Sort by priority ascending (lower = runs first)
  existing.sort((a, b) => a.priority - b.priority);
  bindings.set(reg.hookName, existing);

  // Auto-register the hook name if not already known
  knownHookNames.add(reg.hookName);

  logger.debug({
    pluginId, hookName: reg.hookName, category: reg.category, priority,
  }, 'Hook handler registered');
}

/**
 * Get all bindings for a specific hook, optionally filtered by category.
 */
export function getBindings(hookName: HookName, category?: HookCategory): HookBinding[] {
  const all = bindings.get(hookName) ?? [];
  if (!category) return all;
  return all.filter(b => b.category === category);
}

/**
 * Remove all hooks registered by a specific plugin.
 */
export function unregisterPlugin(pluginId: string): void {
  for (const [hookName, hookBindings] of bindings) {
    const filtered = hookBindings.filter(b => b.pluginId !== pluginId);
    if (filtered.length === 0) {
      bindings.delete(hookName);
    } else {
      bindings.set(hookName, filtered);
    }
  }
  logger.debug({ pluginId }, 'All hook handlers for plugin removed');
}

/**
 * Remove all handlers for a specific hook (useful in tests).
 */
export function clearHook(hookName: HookName): void {
  bindings.delete(hookName);
}

/**
 * Remove all registered hooks (useful in tests).
 */
export function clearAllHooks(): void {
  bindings.clear();
}

/**
 * Diagnostic: return binding counts per hook.
 */
export function getRegistryStats(): Record<string, { events: number; interceptors: number }> {
  const stats: Record<string, { events: number; interceptors: number }> = {};
  for (const [hookName, hookBindings] of bindings) {
    stats[hookName] = {
      events: hookBindings.filter(b => b.category === 'EVENT').length,
      interceptors: hookBindings.filter(b => b.category === 'INTERCEPTOR').length,
    };
  }
  return stats;
}


