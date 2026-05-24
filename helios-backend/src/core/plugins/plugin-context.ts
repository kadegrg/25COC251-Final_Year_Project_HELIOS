// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin context passed to hooks
// ═══════════════════════════════════════════════════════════════════════

import type { RequestContext } from '../../types/request-context.js';
import type { PoolClient } from '../../db/index.js';

/**
 * Context passed to every hook handler.
 * Provides request metadata, actor info, and an optional DB transaction handle
 * for hooks that participate within the calling transaction boundary.
 */
export interface PluginHookContext {
  /** Original request context (requestId, userId, sessionId, etc.) */
  requestContext?: RequestContext;

  /** Actor/user ID (convenience alias from requestContext) */
  actorId?: string;

  /** Session ID if available */
  sessionId?: string;

  /** Current AAL level */
  aal?: number;

  /** Site context ID if resolved */
  siteId?: string;

  /** Correlation / request ID for tracing */
  correlationId?: string;

  /**
   * DB transaction client when the hook is invoked inside a transaction.
   * Interceptor hooks that write plugin data should use this client
   * to participate in the same unit of work.
   */
  txClient?: PoolClient;
}

/**
 * Factory to build a PluginHookContext from a RequestContext.
 */
export function buildHookContext(
  ctx?: RequestContext,
  txClient?: PoolClient,
): PluginHookContext {
  if (!ctx) return {};
  return {
    requestContext: ctx,
    actorId: ctx.userId,
    sessionId: ctx.sessionId,
    aal: ctx.aal,
    siteId: ctx.siteId,
    correlationId: ctx.requestId,
    txClient,
  };
}

