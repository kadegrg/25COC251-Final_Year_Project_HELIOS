// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Event hook: after adjustment posted
// ═══════════════════════════════════════════════════════════════════════
//
// This is an EVENT hook (read-only observer).
// Logs the posted adjustment for the plugin's audit trail.
// Does NOT block the main action even if it fails.
// ═══════════════════════════════════════════════════════════════════════

import type { PluginHookContext } from '../../../core/plugins/plugin-context.js';
import { logger } from '../../../core/logging/logger.js';

/**
 * Event handler for inventory.adjustment.afterPosted.
 * Fires after an adjustment is successfully posted.
 */
export async function afterAdjustmentPostedHandler(
  payload: any,
  context: PluginHookContext,
): Promise<void> {
  logger.info({
    pluginId: 'high-value-adjustment-guard',
    adjustmentId: payload.adjustmentId,
    adjustmentType: payload.adjustmentType,
    lineCount: payload.lineCount ?? payload.lines?.length,
    actorId: context.actorId,
    siteId: payload.siteId ?? context.siteId,
  }, 'Plugin event: adjustment posted observed');

  // In a real system this could forward to an external alerting service,
  // push to a message queue, or update a dashboard metric.
}

