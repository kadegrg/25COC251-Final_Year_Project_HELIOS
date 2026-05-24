// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Stock service (all stock operations)
// ═══════════════════════════════════════════════════════════════════════

import * as stockRepo from './stock.repository.js';
import * as skusRepo from '../skus/skus.repository.js';
import * as locationsRepo from '../locations/locations.repository.js';
import { withTransaction } from '../../../db/transaction.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import {
  InsufficientStockError,
  NegativeStockPreventedError,
  LocationNotOperableError,
  SerializedItemMismatchError,
  DuplicateSerialNumberError,
} from '../inventory.errors.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import { runInterceptors, emitEvent } from '../../../core/plugins/hook-executor.js';
import { buildHookContext } from '../../../core/plugins/plugin-context.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { PoolClient } from '../../../db/index.js';
import type {
  ReceiveStockInput, MoveStockInput, ReserveStockInput, UnreserveStockInput,
  QuarantineStockInput, ReleaseQuarantineInput, WriteOffInput, StatusChangeInput,
} from './stock.schemas.js';

// ── Receive stock ─────────────────────────────────────

export async function receiveStock(input: ReceiveStockInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny/modify before receipt
  const hookResult = await runInterceptors(BuiltInHooks.STOCK_BEFORE_RECEIVE, input, buildHookContext(ctx));
  const effectiveInput = hookResult.payload as ReceiveStockInput;

  const sku = await skusRepo.findSkuById(effectiveInput.skuId);
  if (!sku) throw new NotFoundError('SKU');

  const location = await locationsRepo.findLocationById(input.locationId);
  if (!location) throw new NotFoundError('Location');
  if (!location.is_receivable) throw new LocationNotOperableError(input.locationId, 'Not receivable');

  // For serialized SKUs, handle individual item creation
  if (sku.tracking_mode === 'SERIALIZED' && input.serialNumber) {
    const existingItem = await stockRepo.findStockItemBySerial(input.serialNumber);
    if (existingItem) throw new DuplicateSerialNumberError(input.serialNumber);
  }

  return withTransaction(async (client) => {
    let stockItemId: string | undefined;

    // Create individual stock item for SERIALIZED or BATCH tracking
    if (sku.tracking_mode === 'SERIALIZED' || sku.tracking_mode === 'BATCH') {
      const item = await stockRepo.createStockItem({
        skuId: input.skuId,
        serialNumber: input.serialNumber,
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        currentSiteId: input.siteId,
        currentLocationId: input.locationId,
        stockStatusCode: input.stockStatusCode,
        lifecycleStatus: 'ACTIVE',
      }, client);
      stockItemId = item.stock_item_id;
    }

    // Update balance: increase on_hand and available
    const balance = await stockRepo.getOrCreateBalance(
      input.siteId, input.warehouseId ?? location.warehouse_id, input.locationId,
      input.skuId, input.stockStatusCode, client,
    );
    await stockRepo.updateBalance(balance.stock_balance_id, {
      onHand: input.quantity,
      available: input.quantity,
    }, client);

    // Create immutable movement record
    const movement = await stockRepo.createMovement({
      movementType: 'RECEIPT',
      movementReasonCode: 'RECEIPT',
      siteId: input.siteId,
      warehouseId: input.warehouseId ?? location.warehouse_id,
      skuId: input.skuId,
      stockItemId,
      toLocationId: input.locationId,
      toStatusCode: input.stockStatusCode,
      quantity: input.quantity,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.received', 'SUCCESS', {
      siteId: input.siteId, locationId: input.locationId, skuId: input.skuId,
      stockItemId, details: { quantity: input.quantity, movementId: movement.movement_id },
    }, client);

    // Event hook: notify plugins that stock was received (non-blocking)
    emitEvent(BuiltInHooks.STOCK_AFTER_RECEIVED, {
      movementId: movement.movement_id, skuId: input.skuId, quantity: input.quantity, siteId: input.siteId,
    }, buildHookContext(ctx, client)).catch(() => {});
    logger.info({ movementId: movement.movement_id, skuId: input.skuId, quantity: input.quantity }, 'Stock received');

    return { movementId: movement.movement_id, stockItemId, quantity: input.quantity };
  });
}

// ── Move stock between locations ──────────────────────

export async function moveStock(input: MoveStockInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny/modify before move
  const hookResult = await runInterceptors(BuiltInHooks.STOCK_BEFORE_MOVE, input, buildHookContext(ctx));
  const effectiveInput = hookResult.payload as MoveStockInput;

  const fromLocation = await locationsRepo.findLocationById(effectiveInput.fromLocationId);
  if (!fromLocation) throw new NotFoundError('From location');

  const toLocation = await locationsRepo.findLocationById(input.toLocationId);
  if (!toLocation) throw new NotFoundError('To location');
  if (!toLocation.is_receivable) throw new LocationNotOperableError(input.toLocationId, 'Not receivable');

  return withTransaction(async (client) => {
    // Decrease balance at source
    const fromBalance = await stockRepo.getOrCreateBalance(
      input.siteId, fromLocation.warehouse_id, input.fromLocationId,
      input.skuId, input.stockStatusCode, client,
    );
    if (fromBalance.quantity_available < input.quantity) {
      throw new InsufficientStockError(input.skuId, input.quantity, fromBalance.quantity_available);
    }
    await stockRepo.updateBalance(fromBalance.stock_balance_id, {
      onHand: -input.quantity, available: -input.quantity,
    }, client);

    // Increase balance at destination
    const toBalance = await stockRepo.getOrCreateBalance(
      input.siteId, toLocation.warehouse_id, input.toLocationId,
      input.skuId, input.stockStatusCode, client,
    );
    await stockRepo.updateBalance(toBalance.stock_balance_id, {
      onHand: input.quantity, available: input.quantity,
    }, client);

    // Update stock item location if serialized
    if (input.stockItemId) {
      await stockRepo.updateStockItem(input.stockItemId, {
        currentLocationId: input.toLocationId,
      }, client);
    }

    const movement = await stockRepo.createMovement({
      movementType: 'INTERNAL_MOVE',
      movementReasonCode: 'INTERNAL_MOVE',
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      fromStatusCode: input.stockStatusCode,
      toStatusCode: input.stockStatusCode,
      quantity: input.quantity,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.moved', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId,
      details: { movementId: movement.movement_id, from: input.fromLocationId, to: input.toLocationId, quantity: input.quantity },
    }, client);

    // Event hook: notify plugins that stock was moved (non-blocking)
    emitEvent(BuiltInHooks.STOCK_AFTER_MOVED, {
      movementId: movement.movement_id, skuId: input.skuId, from: input.fromLocationId, to: input.toLocationId, quantity: input.quantity,
    }, buildHookContext(ctx, client)).catch(() => {});
    return { movementId: movement.movement_id };
  });
}

// ── Reserve stock ─────────────────────────────────────

export async function reserveStock(input: ReserveStockInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before reservation
  await runInterceptors(BuiltInHooks.STOCK_BEFORE_RESERVE, input, buildHookContext(ctx));

  return withTransaction(async (client) => {
    const balance = await findSellableBalance(input.siteId, input.locationId ?? null, input.skuId, client);
    if (balance.quantity_available < input.quantity) {
      throw new InsufficientStockError(input.skuId, input.quantity, balance.quantity_available);
    }

    // Decrease available, increase reserved
    await stockRepo.updateBalance(balance.stock_balance_id, {
      reserved: input.quantity,
      available: -input.quantity,
    }, client);

    const movement = await stockRepo.createMovement({
      movementType: 'ALLOCATION',
      movementReasonCode: 'RESERVATION',
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromStatusCode: 'SELLABLE',
      toStatusCode: 'RESERVED',
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.reserved', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId,
      details: { quantity: input.quantity, movementId: movement.movement_id },
    }, client);

    return { movementId: movement.movement_id };
  });
}

// ── Unreserve stock ───────────────────────────────────

export async function unreserveStock(input: UnreserveStockInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before unreservation
  await runInterceptors(BuiltInHooks.STOCK_BEFORE_UNRESERVE, input, buildHookContext(ctx));

  return withTransaction(async (client) => {
    const balance = await findSellableBalance(input.siteId, input.locationId ?? null, input.skuId, client);

    // Decrease reserved, increase available
    await stockRepo.updateBalance(balance.stock_balance_id, {
      reserved: -input.quantity,
      available: input.quantity,
    }, client);

    const movement = await stockRepo.createMovement({
      movementType: 'DEALLOCATION',
      movementReasonCode: 'UNRESERVATION',
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromStatusCode: 'RESERVED',
      toStatusCode: 'SELLABLE',
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.unreserved', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId,
      details: { quantity: input.quantity, movementId: movement.movement_id },
    }, client);

    return { movementId: movement.movement_id };
  });
}

// ── Quarantine stock ──────────────────────────────────

export async function quarantineStock(input: QuarantineStockInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before quarantine
  await runInterceptors(BuiltInHooks.STOCK_BEFORE_QUARANTINE, input, buildHookContext(ctx));

  return withTransaction(async (client) => {
    // Decrease from source status balance
    const fromBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, input.fromStatusCode, client,
    );
    if (fromBalance.quantity_available < input.quantity) {
      throw new InsufficientStockError(input.skuId, input.quantity, fromBalance.quantity_available);
    }
    await stockRepo.updateBalance(fromBalance.stock_balance_id, {
      onHand: -input.quantity, available: -input.quantity,
    }, client);

    // Increase quarantine balance
    const qBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, 'QUARANTINED', client,
    );
    await stockRepo.updateBalance(qBalance.stock_balance_id, {
      onHand: input.quantity, available: 0,
    }, client);

    // Update stock item if serialized
    if (input.stockItemId) {
      await stockRepo.updateStockItem(input.stockItemId, { stockStatusCode: 'QUARANTINED' }, client);
    }

    const movement = await stockRepo.createMovement({
      movementType: 'QUARANTINE',
      movementReasonCode: 'QUARANTINE',
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromStatusCode: input.fromStatusCode,
      toStatusCode: 'QUARANTINED',
      quantity: input.quantity,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.quarantined', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId, locationId: input.locationId,
      details: { quantity: input.quantity, movementId: movement.movement_id },
    }, client);

    // Event hook: notify plugins that stock was quarantined (non-blocking)
    emitEvent(BuiltInHooks.STOCK_AFTER_QUARANTINED, {
      movementId: movement.movement_id, skuId: input.skuId, quantity: input.quantity, siteId: input.siteId,
    }, buildHookContext(ctx, client)).catch(() => {});
    return { movementId: movement.movement_id };
  });
}

// ── Release quarantine ────────────────────────────────

export async function releaseQuarantine(input: ReleaseQuarantineInput, ctx: RequestContext) {
  return withTransaction(async (client) => {
    const qBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, 'QUARANTINED', client,
    );
    if (qBalance.quantity_on_hand < input.quantity) {
      throw new InsufficientStockError(input.skuId, input.quantity, qBalance.quantity_on_hand);
    }
    await stockRepo.updateBalance(qBalance.stock_balance_id, {
      onHand: -input.quantity,
    }, client);

    const toBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, input.toStatusCode, client,
    );
    await stockRepo.updateBalance(toBalance.stock_balance_id, {
      onHand: input.quantity, available: input.quantity,
    }, client);

    if (input.stockItemId) {
      await stockRepo.updateStockItem(input.stockItemId, { stockStatusCode: input.toStatusCode }, client);
    }

    const movement = await stockRepo.createMovement({
      movementType: 'RELEASE_QUARANTINE',
      movementReasonCode: 'RELEASE_QUARANTINE',
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromStatusCode: 'QUARANTINED',
      toStatusCode: input.toStatusCode,
      quantity: input.quantity,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.released_quarantine', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId,
      details: { quantity: input.quantity, movementId: movement.movement_id },
    }, client);

    return { movementId: movement.movement_id };
  });
}

// ── Write off ─────────────────────────────────────────

export async function writeOff(input: WriteOffInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before write-off
  await runInterceptors(BuiltInHooks.STOCK_BEFORE_WRITE_OFF, input, buildHookContext(ctx));

  return withTransaction(async (client) => {
    const balance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, input.fromStatusCode, client,
    );
    if (balance.quantity_on_hand < input.quantity) {
      throw new InsufficientStockError(input.skuId, input.quantity, balance.quantity_on_hand);
    }
    await stockRepo.updateBalance(balance.stock_balance_id, {
      onHand: -input.quantity, available: -Math.min(input.quantity, balance.quantity_available),
    }, client);

    // Move to SCRAP balance for tracking
    const scrapBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, 'SCRAP', client,
    );
    await stockRepo.updateBalance(scrapBalance.stock_balance_id, {
      onHand: input.quantity,
    }, client);

    if (input.stockItemId) {
      await stockRepo.updateStockItem(input.stockItemId, { stockStatusCode: 'SCRAP', lifecycleStatus: 'SCRAPPED' }, client);
    }

    const movement = await stockRepo.createMovement({
      movementType: 'WRITE_OFF',
      movementReasonCode: input.reasonCode,
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromLocationId: input.locationId,
      fromStatusCode: input.fromStatusCode,
      toStatusCode: 'SCRAP',
      quantity: input.quantity,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.written_off', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId, locationId: input.locationId,
      details: { quantity: input.quantity, movementId: movement.movement_id, reasonCode: input.reasonCode },
    }, client);

    // Event hook: notify plugins that stock was written off (non-blocking)
    emitEvent(BuiltInHooks.STOCK_AFTER_WRITTEN_OFF, {
      movementId: movement.movement_id, skuId: input.skuId, quantity: input.quantity, reasonCode: input.reasonCode, siteId: input.siteId,
    }, buildHookContext(ctx, client)).catch(() => {});
    return { movementId: movement.movement_id };
  });
}

// ── Status change (generic) ──────────────────────────

export async function statusChange(input: StatusChangeInput, ctx: RequestContext) {
  return withTransaction(async (client) => {
    const fromBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, input.fromStatusCode, client,
    );
    if (fromBalance.quantity_on_hand < input.quantity) {
      throw new InsufficientStockError(input.skuId, input.quantity, fromBalance.quantity_on_hand);
    }
    await stockRepo.updateBalance(fromBalance.stock_balance_id, {
      onHand: -input.quantity, available: -Math.min(input.quantity, fromBalance.quantity_available),
    }, client);

    const toBalance = await stockRepo.getOrCreateBalance(
      input.siteId, null, input.locationId, input.skuId, input.toStatusCode, client,
    );

    // Check if destination status is sellable
    const statusDef = await stockRepo.getStockStatusCode(input.toStatusCode);
    const addAvailable = statusDef?.is_available_to_sell ? input.quantity : 0;

    await stockRepo.updateBalance(toBalance.stock_balance_id, {
      onHand: input.quantity, available: addAvailable,
    }, client);

    if (input.stockItemId) {
      await stockRepo.updateStockItem(input.stockItemId, { stockStatusCode: input.toStatusCode }, client);
    }

    const movement = await stockRepo.createMovement({
      movementType: 'STATUS_CHANGE',
      movementReasonCode: 'MANUAL_CORRECTION',
      siteId: input.siteId,
      skuId: input.skuId,
      stockItemId: input.stockItemId,
      fromLocationId: input.locationId,
      toLocationId: input.locationId,
      fromStatusCode: input.fromStatusCode,
      toStatusCode: input.toStatusCode,
      quantity: input.quantity,
      performedByUserId: ctx.userId,
      requestId: ctx.requestId,
      notes: input.notes,
    }, client);

    await logInventoryAudit(ctx, 'inventory.stock.status_changed', 'SUCCESS', {
      siteId: input.siteId, skuId: input.skuId,
      details: { from: input.fromStatusCode, to: input.toStatusCode, quantity: input.quantity },
    }, client);

    return { movementId: movement.movement_id };
  });
}

// ── Query services ────────────────────────────────────

export async function queryStock(
  filters: { siteId?: string; warehouseId?: string; locationId?: string; skuId?: string; stockStatusCode?: string; page: number; limit: number },
) {
  const offset = (filters.page - 1) * filters.limit;
  const { rows, total } = await stockRepo.queryStockBalances({ ...filters, offset });
  return {
    data: rows.map(formatBalance),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getStockSummary(siteId?: string) {
  if (siteId) return stockRepo.getStockSummaryBySite(siteId);
  return stockRepo.getEstateStockSummary();
}

export async function getStockItem(stockItemId: string) {
  const item = await stockRepo.findStockItemById(stockItemId);
  if (!item) throw new NotFoundError('Stock item');
  return item;
}

export async function getStockItemBySerial(serialNumber: string) {
  const item = await stockRepo.findStockItemBySerial(serialNumber);
  if (!item) throw new NotFoundError('Stock item');
  return item;
}

export async function queryMovements(
  filters: {
    siteId?: string; skuId?: string; stockItemId?: string; locationId?: string;
    movementType?: string; transferId?: string; adjustmentId?: string;
    fromDate?: string; toDate?: string; page: number; limit: number;
  },
) {
  const offset = (filters.page - 1) * filters.limit;
  const { rows, total } = await stockRepo.queryMovements({ ...filters, offset });
  return {
    data: rows,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getMovement(movementId: string) {
  const m = await stockRepo.findMovementById(movementId);
  if (!m) throw new NotFoundError('Movement');
  return m;
}

// ── Helpers ───────────────────────────────────────────

async function findSellableBalance(siteId: string, locationId: string | null, skuId: string, client: PoolClient) {
  const balance = await stockRepo.getOrCreateBalance(siteId, null, locationId, skuId, 'SELLABLE', client);
  return balance;
}

function formatBalance(row: StockBalanceRow) {
  return {
    stockBalanceId: row.stock_balance_id,
    siteId: row.site_id,
    warehouseId: row.warehouse_id,
    locationId: row.location_id,
    skuId: row.sku_id,
    stockStatusCode: row.stock_status_code,
    quantityOnHand: row.quantity_on_hand,
    quantityReserved: row.quantity_reserved,
    quantityAvailable: row.quantity_available,
    quantityInbound: row.quantity_inbound,
    quantityOutbound: row.quantity_outbound,
    lastMovementAt: row.last_movement_at,
    updatedAt: row.updated_at,
  };
}

// Re-export the StockBalanceRow type
import type { StockBalanceRow } from '../inventory.types.js';



