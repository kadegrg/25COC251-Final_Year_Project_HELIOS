import * as xferRepo from './transfers.repository.js';
import * as stockRepo from '../stock/stock.repository.js';
import { withTransaction } from '../../../db/transaction.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import { InvalidStatusTransitionError, InsufficientStockError } from '../inventory.errors.js';
import { TRANSFER_STATUS_TRANSITIONS } from '../inventory.constants.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import { runInterceptors, emitEvent } from '../../../core/plugins/hook-executor.js';
import { buildHookContext } from '../../../core/plugins/plugin-context.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateTransferInput, ReceiveTransferInput, CreateDiscrepancyInput } from './transfers.schemas.js';
import type { TransferRow, TransferLineRow } from '../inventory.types.js';

export async function createTransfer(input: CreateTransferInput, ctx: RequestContext) {
  return withTransaction(async (client) => {
    const transferNumber = await xferRepo.getNextTransferNumber();
    const transfer = await xferRepo.createTransfer({
      transferNumber,
      fromSiteId: input.fromSiteId,
      toSiteId: input.toSiteId,
      status: 'DRAFT',
      reasonCode: input.reasonCode,
      requestedByUserId: ctx.userId,
      notes: input.notes,
    }, client);

    for (const line of input.lines) {
      await xferRepo.createTransferLine({
        transferId: transfer.transfer_id,
        skuId: line.skuId,
        stockItemId: line.stockItemId,
        requestedQuantity: line.requestedQuantity,
        fromStatusCode: line.fromStatusCode,
        toStatusCode: line.toStatusCode,
        notes: line.notes,
      }, client);
    }

    await logInventoryAudit(ctx, 'inventory.transfer.created', 'SUCCESS', {
      transferId: transfer.transfer_id, siteId: input.fromSiteId,
      details: { transferNumber, toSiteId: input.toSiteId, lineCount: input.lines.length },
    }, client);

    logger.info({ transferId: transfer.transfer_id, transferNumber }, 'Transfer created');
    const lines = await xferRepo.getTransferLines(transfer.transfer_id, client);
    return formatTransfer(transfer, lines);
  });
}

export async function getTransfer(transferId: string) {
  const transfer = await xferRepo.findTransferById(transferId);
  if (!transfer) throw new NotFoundError('Transfer');
  const lines = await xferRepo.getTransferLines(transferId);
  return formatTransfer(transfer, lines);
}

export async function listTransfers(page: number, limit: number, filters: { fromSiteId?: string; toSiteId?: string; status?: string }) {
  const offset = (page - 1) * limit;
  const { rows, total } = await xferRepo.listTransfers({ ...filters, limit, offset });
  return {
    data: rows.map(r => formatTransfer(r)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function approveTransfer(transferId: string, ctx: RequestContext) {
  return transitionTransfer(transferId, 'APPROVED', ctx, { approvedByUserId: ctx.userId });
}

export async function dispatchTransfer(transferId: string, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before dispatch
  await runInterceptors(BuiltInHooks.TRANSFER_BEFORE_DISPATCH, { transferId }, buildHookContext(ctx));

  return withTransaction(async (client) => {
    const transfer = await xferRepo.findTransferById(transferId);
    if (!transfer) throw new NotFoundError('Transfer');
    validateTransition(transfer.status, 'DISPATCHED');

    const lines = await xferRepo.getTransferLines(transferId, client);

    for (const line of lines) {
      const statusCode = line.from_status_code || 'SELLABLE';

      // Decrease stock at source site — mark as outbound/in-transit
      const balance = await stockRepo.getOrCreateBalance(transfer.from_site_id, null, null, line.sku_id, statusCode, client);
      if (balance.quantity_available < line.requested_quantity) {
        throw new InsufficientStockError(line.sku_id, line.requested_quantity, balance.quantity_available);
      }
      await stockRepo.updateBalance(balance.stock_balance_id, {
        onHand: -line.requested_quantity,
        available: -line.requested_quantity,
        outbound: line.requested_quantity,
      }, client);

      // Create outbound movement at source
      await stockRepo.createMovement({
        movementType: 'TRANSFER_OUT',
        movementReasonCode: transfer.reason_code,
        siteId: transfer.from_site_id,
        skuId: line.sku_id,
        stockItemId: line.stock_item_id ?? undefined,
        fromStatusCode: statusCode,
        toStatusCode: 'IN_TRANSIT',
        quantity: line.requested_quantity,
        transferId,
        performedByUserId: ctx.userId,
        requestId: ctx.requestId,
      }, client);

      await xferRepo.updateTransferLineDispatched(line.transfer_line_id, line.requested_quantity, client);

      // Update stock item to IN_TRANSIT if serialized
      if (line.stock_item_id) {
        await stockRepo.updateStockItem(line.stock_item_id, { lifecycleStatus: 'IN_TRANSIT', stockStatusCode: 'IN_TRANSIT' }, client);
      }
    }

    const updated = await xferRepo.updateTransferStatus(transferId, 'DISPATCHED', { dispatchedByUserId: ctx.userId }, client);

    await logInventoryAudit(ctx, 'inventory.transfer.dispatched', 'SUCCESS', {
      transferId, siteId: transfer.from_site_id,
    }, client);

    // Event hook: notify plugins that transfer was dispatched (non-blocking)
    emitEvent(BuiltInHooks.TRANSFER_AFTER_DISPATCHED, {
      transferId, fromSiteId: transfer.from_site_id, toSiteId: transfer.to_site_id,
    }, buildHookContext(ctx, client)).catch(() => {});
    logger.info({ transferId }, 'Transfer dispatched');
    return formatTransfer(updated!, lines);
  });
}

export async function receiveTransfer(transferId: string, input: ReceiveTransferInput, ctx: RequestContext) {
  return withTransaction(async (client) => {
    const transfer = await xferRepo.findTransferById(transferId);
    if (!transfer) throw new NotFoundError('Transfer');
    // Allow receive from DISPATCHED or IN_TRANSIT
    if (!['DISPATCHED', 'IN_TRANSIT', 'PART_RECEIVED'].includes(transfer.status)) {
      throw new InvalidStatusTransitionError('transfer', transfer.status, 'RECEIVED');
    }

    let hasDiscrepancy = false;

    for (const lineInput of input.lines) {
      const line = (await xferRepo.getTransferLines(transferId, client)).find(
        l => l.transfer_line_id === lineInput.transferLineId,
      );
      if (!line) throw new NotFoundError('Transfer line');

      const receivedQty = lineInput.receivedQuantity;
      const discrepancyQty = receivedQty - line.dispatched_quantity;
      const discrepancyCode = discrepancyQty !== 0 ? (lineInput.discrepancyReasonCode || 'COUNT_MISMATCH') : null;

      if (discrepancyQty !== 0) hasDiscrepancy = true;

      await xferRepo.updateTransferLineReceived(line.transfer_line_id, receivedQty, Math.abs(discrepancyQty), discrepancyCode, client);

      // Create inbound balance at destination site
      const toStatusCode = line.to_status_code || 'AWAITING_PUTAWAY';
      const toBalance = await stockRepo.getOrCreateBalance(transfer.to_site_id, null, null, line.sku_id, toStatusCode, client);
      await stockRepo.updateBalance(toBalance.stock_balance_id, {
        onHand: receivedQty, available: receivedQty,
      }, client);

      // Resolve outbound at source
      const srcBalance = await stockRepo.getOrCreateBalance(transfer.from_site_id, null, null, line.sku_id, line.from_status_code || 'SELLABLE', client);
      await stockRepo.updateBalance(srcBalance.stock_balance_id, {
        outbound: -line.dispatched_quantity,
      }, client);

      // Create inbound movement at destination
      await stockRepo.createMovement({
        movementType: 'TRANSFER_IN',
        movementReasonCode: transfer.reason_code,
        siteId: transfer.to_site_id,
        skuId: line.sku_id,
        stockItemId: line.stock_item_id ?? undefined,
        toStatusCode,
        quantity: receivedQty,
        transferId,
        performedByUserId: ctx.userId,
        requestId: ctx.requestId,
      }, client);

      // Create discrepancy records if any
      if (discrepancyQty !== 0) {
        await xferRepo.createDiscrepancy({
          transferId,
          transferLineId: line.transfer_line_id,
          discrepancyType: discrepancyQty < 0 ? 'SHORT_SHIPMENT' : 'OVER_SHIPMENT',
          expectedQuantity: line.dispatched_quantity,
          actualQuantity: receivedQty,
          stockItemId: line.stock_item_id ?? undefined,
          reasonCode: discrepancyCode!,
          reportedByUserId: ctx.userId,
        }, client);
        // Event hook: notify plugins of discrepancy (non-blocking)
        emitEvent(BuiltInHooks.TRANSFER_DISCREPANCY, {
          transferId, transferLineId: line.transfer_line_id,
          discrepancyType: discrepancyQty < 0 ? 'SHORT_SHIPMENT' : 'OVER_SHIPMENT',
          expectedQuantity: line.dispatched_quantity, actualQuantity: receivedQty,
        }, buildHookContext(ctx, client)).catch(() => {});
      }

      // Update stock item if serialized
      if (line.stock_item_id) {
        await stockRepo.updateStockItem(line.stock_item_id, {
          currentSiteId: transfer.to_site_id, lifecycleStatus: 'ACTIVE', stockStatusCode: toStatusCode,
        }, client);
      }
    }

    const newStatus = hasDiscrepancy ? 'PART_RECEIVED' : 'RECEIVED';
    const updated = await xferRepo.updateTransferStatus(transferId, newStatus, { receivedByUserId: ctx.userId }, client);

    await logInventoryAudit(ctx, 'inventory.transfer.received', 'SUCCESS', {
      transferId, siteId: transfer.to_site_id, details: { hasDiscrepancy },
    }, client);

    // Event hook: notify plugins that transfer was received (non-blocking)
    emitEvent(BuiltInHooks.TRANSFER_AFTER_RECEIVED, {
      transferId, toSiteId: transfer.to_site_id, hasDiscrepancy,
    }, buildHookContext(ctx, client)).catch(() => {});
    logger.info({ transferId, hasDiscrepancy }, 'Transfer received');
    return formatTransfer(updated!);
  });
}

export async function reconcileTransfer(transferId: string, ctx: RequestContext) {
  return transitionTransfer(transferId, 'RECONCILED', ctx);
}

export async function cancelTransfer(transferId: string, ctx: RequestContext) {
  return transitionTransfer(transferId, 'CANCELLED', ctx);
}

export async function getDiscrepancies(transferId: string) {
  const transfer = await xferRepo.findTransferById(transferId);
  if (!transfer) throw new NotFoundError('Transfer');
  return xferRepo.getDiscrepancies(transferId);
}

export async function addDiscrepancy(transferId: string, input: CreateDiscrepancyInput, ctx: RequestContext) {
  const transfer = await xferRepo.findTransferById(transferId);
  if (!transfer) throw new NotFoundError('Transfer');
  // Event hook: notify plugins of manually created discrepancy
  emitEvent(BuiltInHooks.TRANSFER_DISCREPANCY, {
    transferId, discrepancyType: input.discrepancyType,
    expectedQuantity: input.expectedQuantity, actualQuantity: input.actualQuantity,
  }, buildHookContext(ctx)).catch(() => {});

  const disc = await xferRepo.createDiscrepancy({
    transferId,
    transferLineId: input.transferLineId,
    discrepancyType: input.discrepancyType,
    expectedQuantity: input.expectedQuantity,
    actualQuantity: input.actualQuantity,
    stockItemId: input.stockItemId,
    reasonCode: input.reasonCode,
    notes: input.notes,
    reportedByUserId: ctx.userId,
  });
  await logInventoryAudit(ctx, 'inventory.transfer.discrepancy_created', 'SUCCESS', {
    transferId, details: { discrepancyType: input.discrepancyType },
  });
  return disc;
}

// ── Helpers ───────────────────────────────────────────

async function transitionTransfer(transferId: string, toStatus: string, ctx: RequestContext, extra: Record<string, any> = {}) {
  const transfer = await xferRepo.findTransferById(transferId);
  if (!transfer) throw new NotFoundError('Transfer');
  validateTransition(transfer.status, toStatus);
  const updated = await xferRepo.updateTransferStatus(transferId, toStatus, extra);
  await logInventoryAudit(ctx, `inventory.transfer.${toStatus.toLowerCase()}`, 'SUCCESS', { transferId });
  logger.info({ transferId, from: transfer.status, to: toStatus }, 'Transfer status changed');
  return formatTransfer(updated!);
}

function validateTransition(from: string, to: string) {
  const allowed = TRANSFER_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) throw new InvalidStatusTransitionError('transfer', from, to);
}

function formatTransfer(row: TransferRow, lines?: TransferLineRow[]) {
  return {
    transferId: row.transfer_id,
    transferNumber: row.transfer_number,
    fromSiteId: row.from_site_id,
    toSiteId: row.to_site_id,
    status: row.status,
    reasonCode: row.reason_code,
    requestedByUserId: row.requested_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    dispatchedByUserId: row.dispatched_by_user_id,
    receivedByUserId: row.received_by_user_id,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    dispatchedAt: row.dispatched_at,
    receivedAt: row.received_at,
    notes: row.notes,
    lines: lines?.map(l => ({
      transferLineId: l.transfer_line_id,
      skuId: l.sku_id,
      stockItemId: l.stock_item_id,
      requestedQuantity: l.requested_quantity,
      dispatchedQuantity: l.dispatched_quantity,
      receivedQuantity: l.received_quantity,
      discrepancyQuantity: l.discrepancy_quantity,
      discrepancyReasonCode: l.discrepancy_reason_code,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}




