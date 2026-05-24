// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Interceptor hook: before adjustment post
// ═══════════════════════════════════════════════════════════════════════
//
// This is an INTERCEPTOR hook. It can DENY the adjustment post if:
//   1. The adjustment involves a restricted reason code without prior approval
//   2. The adjustment is high-value and the actor's AAL is too low
//
// It participates in the caller's transaction via context.txClient
// so that review log writes are atomically consistent.
// ═══════════════════════════════════════════════════════════════════════

import type { InterceptorResult } from '../../../core/plugins/hook-types.js';
import type { PluginHookContext } from '../../../core/plugins/plugin-context.js';
import { logReview } from '../services/review-log.service.js';
import { logger } from '../../../core/logging/logger.js';

// This import will be resolved at hook execution time from the plugin's config
// via closure over the resolved config passed through the plugin module.
let resolvedConfig: Record<string, unknown> = {};

export function setConfig(config: Record<string, unknown>): void {
  resolvedConfig = config;
}

/**
 * Interceptor handler for inventory.adjustment.beforePost.
 *
 * Payload shape expected:
 *   { adjustmentId, adjustmentType, reasonCode, lines, approvedByUserId, siteId }
 */
export async function beforeAdjustmentPostHandler(
  payload: any,
  context: PluginHookContext,
): Promise<InterceptorResult> {
  const config = resolvedConfig;

  if (!config.enabled) {
    return { action: 'ALLOW', reason: 'Plugin guard disabled' };
  }

  const reasonCode: string = payload.reasonCode ?? '';
  const adjustmentType: string = payload.adjustmentType ?? '';
  const lines: any[] = payload.lines ?? [];
  const approvedByUserId: string | null = payload.approvedByUserId ?? null;
  const threshold = (config.highValueThreshold as number) ?? 10_000;
  const minAal = (config.minimumAalForHighValue as number) ?? 2;
  const restrictedCodes = (config.restrictedReasonCodes as string[]) ?? [];
  const requireApproval = (config.requireApprovalForRestrictedReasons as boolean) ?? true;

  const warnings: string[] = [];

  // Calculate total absolute value of the adjustment
  const totalAbsValue = lines.reduce((sum: number, line: any) => {
    return sum + Math.abs(line.quantityDelta ?? line.quantity_delta ?? 0);
  }, 0);

  const isHighValue = totalAbsValue >= threshold;
  const isRestrictedReason = restrictedCodes.includes(reasonCode.toUpperCase());
  const isDecrease = adjustmentType === 'DECREASE' || adjustmentType === 'RECOUNT_RECONCILIATION';

  // If not a high-risk adjustment, allow immediately
  if (!isHighValue && !isRestrictedReason) {
    return { action: 'ALLOW' };
  }

  // Check AAL for high-value adjustments
  if (isHighValue && (context.aal ?? 0) < minAal) {
    const reason = `High-value adjustment (total abs delta: ${totalAbsValue}) requires AAL${minAal}, current AAL is ${context.aal ?? 0}`;
    logger.info({
      pluginId: 'high-value-adjustment-guard',
      adjustmentId: payload.adjustmentId,
      totalAbsValue,
      requiredAal: minAal,
      currentAal: context.aal,
    }, 'Adjustment denied: insufficient AAL for high-value');

    await logReview(payload.adjustmentId, 'DENIED', {
      siteId: payload.siteId ?? context.siteId,
      reason,
      userId: context.actorId,
      requestId: context.correlationId,
      details: { totalAbsValue, requiredAal: minAal, currentAal: context.aal },
      txClient: context.txClient,
    });

    return { action: 'DENY', reason, warnings };
  }

  // Check approval for restricted reason codes
  if (isRestrictedReason && requireApproval && !approvedByUserId) {
    const reason = `Reason code '${reasonCode}' requires prior approval for adjustment ${payload.adjustmentId}`;
    logger.info({
      pluginId: 'high-value-adjustment-guard',
      adjustmentId: payload.adjustmentId,
      reasonCode,
    }, 'Adjustment denied: restricted reason without approval');

    await logReview(payload.adjustmentId, 'DENIED', {
      siteId: payload.siteId ?? context.siteId,
      reason,
      userId: context.actorId,
      requestId: context.correlationId,
      details: { reasonCode, requiresApproval: true },
      txClient: context.txClient,
    });

    return { action: 'DENY', reason, warnings };
  }

  // High-value or restricted but passes checks — allow with warning
  if (isHighValue) {
    warnings.push(`High-value adjustment (${totalAbsValue} units) — flagged for review`);
  }
  if (isRestrictedReason) {
    warnings.push(`Restricted reason code '${reasonCode}' — approved by ${approvedByUserId}`);
  }

  await logReview(payload.adjustmentId, isHighValue ? 'FLAGGED' : 'ALLOWED', {
    siteId: payload.siteId ?? context.siteId,
    reason: 'Passed guard checks',
    userId: context.actorId,
    requestId: context.correlationId,
    details: { totalAbsValue, isHighValue, isRestrictedReason, isDecrease },
    txClient: context.txClient,
  });

  return {
    action: 'ALLOW',
    warnings,
    metadata: { highValueGuard: { flagged: isHighValue, restrictedReason: isRestrictedReason } },
  };
}

