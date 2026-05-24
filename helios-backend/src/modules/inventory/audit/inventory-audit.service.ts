// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Audit service
// ═══════════════════════════════════════════════════════════════════════

import { createInventoryAuditEvent, type InventoryAuditInput } from './inventory-audit.repository.js';
import { logger } from '../../../core/logging/logger.js';
import { emitEvent } from '../../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { PoolClient } from '../../../db/index.js';

export interface AuditContext {
  siteId?: string;
  warehouseId?: string;
  locationId?: string;
  skuId?: string;
  stockItemId?: string;
  transferId?: string;
  adjustmentId?: string;
  importJobId?: string;
  details?: Record<string, unknown>;
}

/**
 * Logs an inventory audit event both to structured logs and the database.
 */
export async function logInventoryAudit(
  ctx: RequestContext,
  eventType: string,
  eventResult: 'SUCCESS' | 'FAILURE' | 'DENIED',
  auditCtx?: AuditContext,
  client?: PoolClient,
): Promise<void> {
  const input: InventoryAuditInput = {
    eventType,
    eventResult,
    siteId: auditCtx?.siteId ?? ctx.siteId,
    warehouseId: auditCtx?.warehouseId,
    locationId: auditCtx?.locationId,
    skuId: auditCtx?.skuId,
    stockItemId: auditCtx?.stockItemId,
    transferId: auditCtx?.transferId,
    adjustmentId: auditCtx?.adjustmentId,
    importJobId: auditCtx?.importJobId,
    userId: ctx.userId,
    requestId: ctx.requestId,
    detailsJson: auditCtx?.details,
  };

  // Structured application log
  logger.info({
    inventoryAudit: true,
    eventType,
    eventResult,
    userId: ctx.userId,
    requestId: ctx.requestId,
    siteId: input.siteId,
    ...auditCtx,
  }, `inventory.audit: ${eventType} [${eventResult}]`);

  try {
    await createInventoryAuditEvent(input, client);
  } catch (err) {
    logger.error({ err, eventType }, 'Failed to write inventory audit event');
  }

  // Event hook: forward to external systems via plugins (non-blocking)
  emitEvent(BuiltInHooks.AUDIT_EVENT_CREATED, {
    eventType, eventResult, userId: ctx.userId, requestId: ctx.requestId, ...auditCtx,
  }).catch(() => {});
}

