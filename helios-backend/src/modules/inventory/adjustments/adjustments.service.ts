import * as adjRepo from './adjustments.repository.js';
import * as stockRepo from '../stock/stock.repository.js';
import { withTransaction } from '../../../db/transaction.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import { InvalidStatusTransitionError } from '../inventory.errors.js';
import { ADJUSTMENT_STATUS_TRANSITIONS } from '../inventory.constants.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import { runInterceptors, emitEvent } from '../../../core/plugins/hook-executor.js';
import { buildHookContext } from '../../../core/plugins/plugin-context.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateAdjustmentInput } from './adjustments.schemas.js';
import type { AdjustmentRow, AdjustmentLineRow } from '../inventory.types.js';

export async function createAdjustment(input: CreateAdjustmentInput, ctx: RequestContext) {
  return withTransaction(async (client) => {
    const adj = await adjRepo.createAdjustment({
      siteId: input.siteId,
      warehouseId: input.warehouseId,
      locationId: input.locationId,
      adjustmentType: input.adjustmentType,
      reasonCode: input.reasonCode,
      status: 'DRAFT',
      requestedByUserId: ctx.userId,
      notes: input.notes,
    }, client);

    for (const line of input.lines) {
      await adjRepo.createAdjustmentLine({
        adjustmentId: adj.adjustment_id,
        ...line,
      }, client);
    }

    await logInventoryAudit(ctx, 'inventory.adjustment.created', 'SUCCESS', {
      adjustmentId: adj.adjustment_id, siteId: input.siteId,
      details: { adjustmentType: input.adjustmentType, lineCount: input.lines.length },
    }, client);

    logger.info({ adjustmentId: adj.adjustment_id }, 'Adjustment draft created');
    const lines = await adjRepo.getAdjustmentLines(adj.adjustment_id, client);
    return formatAdjustment(adj, lines);
  });
}

export async function getAdjustment(adjustmentId: string) {
  const adj = await adjRepo.findAdjustmentById(adjustmentId);
  if (!adj) throw new NotFoundError('Adjustment');
  const lines = await adjRepo.getAdjustmentLines(adjustmentId);
  return formatAdjustment(adj, lines);
}

export async function listAdjustments(page: number, limit: number, filters: { siteId?: string; status?: string; adjustmentType?: string }) {
  const offset = (page - 1) * limit;
  const { rows, total } = await adjRepo.listAdjustments({ ...filters, limit, offset });
  return {
    data: rows.map(r => formatAdjustment(r)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function approveAdjustment(adjustmentId: string, ctx: RequestContext) {
  const adj = await adjRepo.findAdjustmentById(adjustmentId);
  if (!adj) throw new NotFoundError('Adjustment');
  // For this system, approval transitions draft -> still draft but marks approved
  // The actual posting step applies to balances
  // Interceptor hook: plugins can validate/deny before approval
  await runInterceptors(BuiltInHooks.ADJUSTMENT_BEFORE_APPROVE, {
    adjustmentId, adjustmentType: adj.adjustment_type, reasonCode: adj.reason_code, siteId: adj.site_id,
  }, buildHookContext(ctx));

  const updated = await adjRepo.updateAdjustmentStatus(adjustmentId, 'DRAFT', { approvedByUserId: ctx.userId });
  await logInventoryAudit(ctx, 'inventory.adjustment.approved', 'SUCCESS', { adjustmentId });
  return formatAdjustment(updated!);
}

export async function postAdjustment(adjustmentId: string, ctx: RequestContext) {
  return withTransaction(async (client) => {
    const adj = await adjRepo.findAdjustmentById(adjustmentId);
    if (!adj) throw new NotFoundError('Adjustment');
    validateTransition(adj.status, 'POSTED');

    const lines = await adjRepo.getAdjustmentLines(adjustmentId, client);

    // Interceptor hook: plugins can validate/deny/modify before posting
    // The example plugin (high-value-adjustment-guard) binds here.
    await runInterceptors(BuiltInHooks.ADJUSTMENT_BEFORE_POST, {
      adjustmentId,
      adjustmentType: adj.adjustment_type,
      reasonCode: adj.reason_code,
      siteId: adj.site_id,
      approvedByUserId: adj.approved_by_user_id,
      lines: lines.map(l => ({
        skuId: l.sku_id,
        quantityDelta: l.quantity_delta,
        reasonCode: l.reason_code,
        fromStatusCode: l.from_status_code,
        toStatusCode: l.to_status_code,
      })),
    }, buildHookContext(ctx, client));

    for (const line of lines) {
      const siteId = adj.site_id;
      const locationId = adj.location_id ?? null;

      if (adj.adjustment_type === 'INCREASE') {
        const statusCode = line.to_status_code || 'SELLABLE';
        const balance = await stockRepo.getOrCreateBalance(siteId, adj.warehouse_id, locationId, line.sku_id, statusCode, client);
        await stockRepo.updateBalance(balance.stock_balance_id, { onHand: line.quantity_delta, available: line.quantity_delta }, client);

        await stockRepo.createMovement({
          movementType: 'ADJUSTMENT_INCREASE', movementReasonCode: line.reason_code,
          siteId, skuId: line.sku_id, stockItemId: line.stock_item_id ?? undefined,
          toLocationId: locationId ?? undefined, toStatusCode: statusCode,
          quantity: line.quantity_delta, adjustmentId,
          performedByUserId: ctx.userId, requestId: ctx.requestId,
        }, client);
      } else if (adj.adjustment_type === 'DECREASE') {
        const statusCode = line.from_status_code || 'SELLABLE';
        const balance = await stockRepo.getOrCreateBalance(siteId, adj.warehouse_id, locationId, line.sku_id, statusCode, client);
        await stockRepo.updateBalance(balance.stock_balance_id, { onHand: line.quantity_delta, available: line.quantity_delta }, client);

        await stockRepo.createMovement({
          movementType: 'ADJUSTMENT_DECREASE', movementReasonCode: line.reason_code,
          siteId, skuId: line.sku_id, stockItemId: line.stock_item_id ?? undefined,
          fromLocationId: locationId ?? undefined, fromStatusCode: statusCode,
          quantity: Math.abs(line.quantity_delta), adjustmentId,
          performedByUserId: ctx.userId, requestId: ctx.requestId,
        }, client);
      } else if (adj.adjustment_type === 'STATUS_CHANGE') {
        const fromStatus = line.from_status_code || 'SELLABLE';
        const toStatus = line.to_status_code || 'SELLABLE';
        const qty = Math.abs(line.quantity_delta);

        const fromBalance = await stockRepo.getOrCreateBalance(siteId, adj.warehouse_id, locationId, line.sku_id, fromStatus, client);
        await stockRepo.updateBalance(fromBalance.stock_balance_id, { onHand: -qty, available: -qty }, client);

        const toBalance = await stockRepo.getOrCreateBalance(siteId, adj.warehouse_id, locationId, line.sku_id, toStatus, client);
        await stockRepo.updateBalance(toBalance.stock_balance_id, { onHand: qty, available: qty }, client);

        await stockRepo.createMovement({
          movementType: 'STATUS_CHANGE', movementReasonCode: line.reason_code,
          siteId, skuId: line.sku_id, fromStatusCode: fromStatus, toStatusCode: toStatus,
          quantity: qty, adjustmentId,
          performedByUserId: ctx.userId, requestId: ctx.requestId,
        }, client);
      } else if (adj.adjustment_type === 'RECOUNT_RECONCILIATION') {
        // Cycle count: compute delta = counted - expected
        const expected = line.expected_quantity ?? 0;
        const counted = line.counted_quantity ?? 0;
        const delta = counted - expected;
        const statusCode = line.from_status_code || 'SELLABLE';

        if (delta !== 0) {
          const balance = await stockRepo.getOrCreateBalance(siteId, adj.warehouse_id, locationId, line.sku_id, statusCode, client);
          await stockRepo.updateBalance(balance.stock_balance_id, { onHand: delta, available: delta }, client);

          await stockRepo.createMovement({
            movementType: 'CYCLE_COUNT', movementReasonCode: 'CYCLE_COUNT',
            siteId, skuId: line.sku_id, fromStatusCode: statusCode, toStatusCode: statusCode,
            quantity: Math.abs(delta), adjustmentId,
            performedByUserId: ctx.userId, requestId: ctx.requestId,
            notes: `Counted: ${counted}, Expected: ${expected}, Delta: ${delta}`,
          }, client);
        }
      }
    }

    const updated = await adjRepo.updateAdjustmentStatus(adjustmentId, 'POSTED', { postedByUserId: ctx.userId }, client);

    await logInventoryAudit(ctx, 'inventory.adjustment.posted', 'SUCCESS', {
      adjustmentId, siteId: adj.site_id, details: { lineCount: lines.length },
    }, client);

    // Event hook: notify plugins that adjustment was posted (non-blocking)
    emitEvent(BuiltInHooks.ADJUSTMENT_AFTER_POSTED, {
      adjustmentId, adjustmentType: adj.adjustment_type, reasonCode: adj.reason_code,
      siteId: adj.site_id, lineCount: lines.length,
    }, buildHookContext(ctx, client)).catch(() => {});
    logger.info({ adjustmentId }, 'Adjustment posted');
    return formatAdjustment(updated!, lines);
  });
}

export async function cancelAdjustment(adjustmentId: string, ctx: RequestContext) {
  const adj = await adjRepo.findAdjustmentById(adjustmentId);
  if (!adj) throw new NotFoundError('Adjustment');
  validateTransition(adj.status, 'CANCELLED');

  const updated = await adjRepo.updateAdjustmentStatus(adjustmentId, 'CANCELLED', {});
  await logInventoryAudit(ctx, 'inventory.adjustment.cancelled', 'SUCCESS', { adjustmentId });
  return formatAdjustment(updated!);
}

function validateTransition(from: string, to: string) {
  const allowed = ADJUSTMENT_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) throw new InvalidStatusTransitionError('adjustment', from, to);
}

function formatAdjustment(row: AdjustmentRow, lines?: AdjustmentLineRow[]) {
  return {
    adjustmentId: row.adjustment_id,
    siteId: row.site_id,
    warehouseId: row.warehouse_id,
    locationId: row.location_id,
    adjustmentType: row.adjustment_type,
    reasonCode: row.reason_code,
    status: row.status,
    requestedByUserId: row.requested_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    postedByUserId: row.posted_by_user_id,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    postedAt: row.posted_at,
    notes: row.notes,
    lines: lines?.map(l => ({
      adjustmentLineId: l.adjustment_line_id,
      skuId: l.sku_id,
      stockItemId: l.stock_item_id,
      fromStatusCode: l.from_status_code,
      toStatusCode: l.to_status_code,
      quantityDelta: l.quantity_delta,
      countedQuantity: l.counted_quantity,
      expectedQuantity: l.expected_quantity,
      reasonCode: l.reason_code,
      notes: l.notes,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}




