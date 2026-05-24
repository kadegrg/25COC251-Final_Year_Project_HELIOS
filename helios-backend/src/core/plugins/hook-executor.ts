// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Hook executor
// ═══════════════════════════════════════════════════════════════════════
//
// Provides two execution modes:
//   emitEvent()       — fire-and-observe for EVENT hooks
//   runInterceptors() — sequential interceptor pipeline that can deny/modify
// ═══════════════════════════════════════════════════════════════════════

import { logger } from '../logging/logger.js';
import { getBindings } from './hook-registry.js';
import { PluginHookDeniedError } from './plugin-errors.js';
import type { PluginHookContext } from './plugin-context.js';
import type {
  HookName,
  EventHookHandler,
  InterceptorHookHandler,
  InterceptorResult,
} from './hook-types.js';

// ── Event emission (pub/sub, non-blocking) ───────────────────────────

/**
 * Fire all EVENT handlers bound to `hookName`.
 *
 * - Handlers run sequentially in priority order.
 * - A failing observer is logged but does NOT block the main action.
 * - Return value from handlers is ignored.
 */
export async function emitEvent<TPayload = unknown>(
  hookName: HookName,
  payload: TPayload,
  context: PluginHookContext = {},
): Promise<void> {
  const eventBindings = getBindings(hookName, 'EVENT');
  if (eventBindings.length === 0) return;

  for (const binding of eventBindings) {
    try {
      const handler = binding.handler as EventHookHandler<TPayload>;
      await handler(payload, context);
    } catch (err) {
      // Event hooks are non-critical — log and continue
      logger.warn({
        err,
        hookName,
        pluginId: binding.pluginId,
        priority: binding.priority,
      }, 'Event hook handler failed (non-blocking)');
    }
  }
}

// ── Interceptor pipeline ─────────────────────────────────────────────

export interface InterceptorPipelineResult<TPayload = unknown> {
  /** Whether all interceptors allowed the action */
  allowed: boolean;
  /** Final (possibly modified) payload */
  payload: TPayload;
  /** Aggregated warnings from all interceptors */
  warnings: string[];
  /** Aggregated metadata from all interceptors */
  metadata: Record<string, unknown>;
  /** If denied, the denial detail */
  denial?: {
    pluginId: string;
    reason: string;
  };
}

/**
 * Run all INTERCEPTOR handlers bound to `hookName` as a pipeline.
 *
 * - Handlers execute sequentially in priority order.
 * - If any required interceptor returns DENY, the pipeline stops and the
 *   action is blocked (throws PluginHookDeniedError or returns denial).
 * - If an interceptor returns MODIFY, the modified payload is passed to
 *   subsequent interceptors and returned as the final result.
 * - If a required interceptor throws unexpectedly, the action is blocked.
 * - If a non-required interceptor throws, we log and continue.
 */
export async function runInterceptors<TPayload = unknown>(
  hookName: HookName,
  payload: TPayload,
  context: PluginHookContext = {},
  options: { throwOnDeny?: boolean } = {},
): Promise<InterceptorPipelineResult<TPayload>> {
  const interceptorBindings = getBindings(hookName, 'INTERCEPTOR');

  const result: InterceptorPipelineResult<TPayload> = {
    allowed: true,
    payload,
    warnings: [],
    metadata: {},
  };

  if (interceptorBindings.length === 0) return result;

  let currentPayload = payload;

  for (const binding of interceptorBindings) {
    try {
      const handler = binding.handler as InterceptorHookHandler<TPayload>;
      const outcome: InterceptorResult<TPayload> = await handler(currentPayload, context);

      // Collect warnings and metadata regardless of action
      if (outcome.warnings) result.warnings.push(...outcome.warnings);
      if (outcome.metadata) Object.assign(result.metadata, outcome.metadata);

      if (outcome.action === 'DENY') {
        logger.info({
          hookName,
          pluginId: binding.pluginId,
          reason: outcome.reason,
        }, 'Interceptor hook denied action');

        result.allowed = false;
        result.denial = {
          pluginId: binding.pluginId,
          reason: outcome.reason ?? 'Denied by plugin',
        };

        if (options.throwOnDeny !== false) {
          throw new PluginHookDeniedError(
            binding.pluginId,
            hookName,
            outcome.reason ?? 'Denied by plugin',
          );
        }
        // If throwOnDeny is false, return immediately with the denial
        result.payload = currentPayload;
        return result;
      }

      if (outcome.action === 'MODIFY' && outcome.modifiedPayload !== undefined) {
        logger.debug({
          hookName,
          pluginId: binding.pluginId,
        }, 'Interceptor hook modified payload');
        currentPayload = outcome.modifiedPayload;
      }

      // ALLOW — continue pipeline
    } catch (err) {
      if (err instanceof PluginHookDeniedError) {
        throw err; // Re-throw intentional denial
      }

      if (binding.required) {
        // Required interceptor crashed — treat as blocking failure
        logger.error({
          err,
          hookName,
          pluginId: binding.pluginId,
        }, 'Required interceptor hook crashed — blocking action');
        throw new PluginHookDeniedError(
          binding.pluginId,
          hookName,
          'Interceptor plugin error (required handler failed)',
        );
      }

      // Non-required interceptor crashed — log and continue
      logger.warn({
        err,
        hookName,
        pluginId: binding.pluginId,
      }, 'Non-required interceptor hook failed — continuing');
    }
  }

  result.payload = currentPayload;
  return result;
}
