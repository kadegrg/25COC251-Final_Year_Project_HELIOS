// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Stock repository
// ═══════════════════════════════════════════════════════════════════════

import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { StockBalanceRow, StockMovementRow, StockItemRow, StockStatusCodeRow } from '../inventory.types.js';

// ── Stock status codes ────────────────────────────────

export async function getStockStatusCode(code: string): Promise<StockStatusCodeRow | null> {
  const result = await query<StockStatusCodeRow>('SELECT * FROM inventory_stock_status_codes WHERE stock_status_code = $1', [code]);
  return result.rows[0] ?? null;
}

export async function listStockStatusCodes(): Promise<StockStatusCodeRow[]> {
  const result = await query<StockStatusCodeRow>('SELECT * FROM inventory_stock_status_codes ORDER BY sort_order ASC');
  return result.rows;
}

// ── Stock items ───────────────────────────────────────

export async function createStockItem(
  data: {
    skuId: string; serialNumber?: string; batchNumber?: string; expiryDate?: string;
    currentSiteId?: string; currentLocationId?: string; stockStatusCode: string; lifecycleStatus: string;
    metadata?: object;
  },
  client?: PoolClient,
): Promise<StockItemRow> {
  const sql = `
    INSERT INTO inventory_stock_items
      (sku_id, serial_number, batch_number, expiry_date, current_site_id, current_location_id,
       stock_status_code, lifecycle_status, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const params = [
    data.skuId, data.serialNumber ?? null, data.batchNumber ?? null, data.expiryDate ?? null,
    data.currentSiteId ?? null, data.currentLocationId ?? null,
    data.stockStatusCode, data.lifecycleStatus, data.metadata ? JSON.stringify(data.metadata) : null,
  ];
  const result = client ? await client.query<StockItemRow>(sql, params) : await query<StockItemRow>(sql, params);
  return result.rows[0];
}

export async function findStockItemById(id: string, client?: PoolClient): Promise<StockItemRow | null> {
  const sql = 'SELECT * FROM inventory_stock_items WHERE stock_item_id = $1 AND deleted_at IS NULL';
  const result = client ? await client.query<StockItemRow>(sql, [id]) : await query<StockItemRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function findStockItemBySerial(serialNumber: string): Promise<StockItemRow | null> {
  const result = await query<StockItemRow>(
    'SELECT * FROM inventory_stock_items WHERE serial_number = $1 AND deleted_at IS NULL', [serialNumber],
  );
  return result.rows[0] ?? null;
}

export async function updateStockItem(
  stockItemId: string,
  data: { currentSiteId?: string; currentLocationId?: string; stockStatusCode?: string; lifecycleStatus?: string },
  client?: PoolClient,
): Promise<StockItemRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (data.currentSiteId !== undefined) { sets.push(`current_site_id = $${idx++}`); params.push(data.currentSiteId); }
  if (data.currentLocationId !== undefined) { sets.push(`current_location_id = $${idx++}`); params.push(data.currentLocationId); }
  if (data.stockStatusCode !== undefined) { sets.push(`stock_status_code = $${idx++}`); params.push(data.stockStatusCode); }
  if (data.lifecycleStatus !== undefined) { sets.push(`lifecycle_status = $${idx++}`); params.push(data.lifecycleStatus); }
  if (sets.length === 0) return findStockItemById(stockItemId, client);
  sets.push('updated_at = now()');
  params.push(stockItemId);
  const sql = `UPDATE inventory_stock_items SET ${sets.join(', ')} WHERE stock_item_id = $${idx} RETURNING *`;
  const result = client ? await client.query<StockItemRow>(sql, params) : await query<StockItemRow>(sql, params);
  return result.rows[0] ?? null;
}

// ── Stock balances ────────────────────────────────────

export async function getOrCreateBalance(
  siteId: string, warehouseId: string | null, locationId: string | null,
  skuId: string, stockStatusCode: string, client: PoolClient,
): Promise<StockBalanceRow> {
  // Attempt insert, on conflict return existing — atomic upsert
  const sql = `
    INSERT INTO inventory_stock_balances (site_id, warehouse_id, location_id, sku_id, stock_status_code)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (site_id, location_id, sku_id, stock_status_code) DO UPDATE SET updated_at = now()
    RETURNING *
  `;
  const result = await client.query<StockBalanceRow>(sql, [siteId, warehouseId, locationId, skuId, stockStatusCode]);
  return result.rows[0];
}

export async function updateBalance(
  balanceId: string,
  deltas: { onHand?: number; reserved?: number; available?: number; inbound?: number; outbound?: number },
  client: PoolClient,
): Promise<StockBalanceRow> {
  const sql = `
    UPDATE inventory_stock_balances SET
      quantity_on_hand = quantity_on_hand + $1,
      quantity_reserved = quantity_reserved + $2,
      quantity_available = quantity_available + $3,
      quantity_inbound = quantity_inbound + $4,
      quantity_outbound = quantity_outbound + $5,
      last_movement_at = now(),
      updated_at = now()
    WHERE stock_balance_id = $6
    RETURNING *
  `;
  const result = await client.query<StockBalanceRow>(sql, [
    deltas.onHand ?? 0, deltas.reserved ?? 0, deltas.available ?? 0,
    deltas.inbound ?? 0, deltas.outbound ?? 0, balanceId,
  ]);
  return result.rows[0];
}

export async function getBalance(
  siteId: string, locationId: string | null, skuId: string, stockStatusCode: string,
  client?: PoolClient,
): Promise<StockBalanceRow | null> {
  const sql = locationId
    ? 'SELECT * FROM inventory_stock_balances WHERE site_id = $1 AND location_id = $2 AND sku_id = $3 AND stock_status_code = $4'
    : 'SELECT * FROM inventory_stock_balances WHERE site_id = $1 AND location_id IS NULL AND sku_id = $2 AND stock_status_code = $3';
  const params = locationId ? [siteId, locationId, skuId, stockStatusCode] : [siteId, skuId, stockStatusCode];
  const result = client ? await client.query<StockBalanceRow>(sql, params) : await query<StockBalanceRow>(sql, params);
  return result.rows[0] ?? null;
}

// ── Stock movements (immutable ledger) ────────────────

export async function createMovement(
  data: {
    movementType: string; movementReasonCode: string; siteId: string; warehouseId?: string;
    skuId: string; stockItemId?: string; fromLocationId?: string; toLocationId?: string;
    fromStatusCode?: string; toStatusCode?: string; quantity: number;
    referenceType?: string; referenceId?: string; transferId?: string; adjustmentId?: string;
    performedByUserId?: string; requestId?: string; correlationId?: string;
    notes?: string; detailsJson?: object;
  },
  client: PoolClient,
): Promise<StockMovementRow> {
  const sql = `
    INSERT INTO inventory_stock_movements
      (movement_type, movement_reason_code, site_id, warehouse_id, sku_id, stock_item_id,
       from_location_id, to_location_id, from_status_code, to_status_code, quantity,
       reference_type, reference_id, transfer_id, adjustment_id, performed_by_user_id,
       request_id, correlation_id, notes, details_json)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    RETURNING *
  `;
  const params = [
    data.movementType, data.movementReasonCode, data.siteId, data.warehouseId ?? null,
    data.skuId, data.stockItemId ?? null, data.fromLocationId ?? null, data.toLocationId ?? null,
    data.fromStatusCode ?? null, data.toStatusCode ?? null, data.quantity,
    data.referenceType ?? null, data.referenceId ?? null, data.transferId ?? null,
    data.adjustmentId ?? null, data.performedByUserId ?? null,
    data.requestId ?? null, data.correlationId ?? null,
    data.notes ?? null, data.detailsJson ? JSON.stringify(data.detailsJson) : null,
  ];
  const result = await client.query<StockMovementRow>(sql, params);
  return result.rows[0];
}

// ── Stock query helpers ───────────────────────────────

export async function queryStockBalances(
  filters: {
    siteId?: string; warehouseId?: string; locationId?: string; skuId?: string;
    stockStatusCode?: string; limit: number; offset: number;
  },
): Promise<{ rows: StockBalanceRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.siteId) { conditions.push(`sb.site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.warehouseId) { conditions.push(`sb.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
  if (filters.locationId) { conditions.push(`sb.location_id = $${idx++}`); params.push(filters.locationId); }
  if (filters.skuId) { conditions.push(`sb.sku_id = $${idx++}`); params.push(filters.skuId); }
  if (filters.stockStatusCode) { conditions.push(`sb.stock_status_code = $${idx++}`); params.push(filters.stockStatusCode); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM inventory_stock_balances sb ${where}`, params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<StockBalanceRow>(
    `SELECT sb.* FROM inventory_stock_balances sb ${where} ORDER BY sb.updated_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function queryMovements(
  filters: {
    siteId?: string; skuId?: string; stockItemId?: string; locationId?: string;
    movementType?: string; transferId?: string; adjustmentId?: string;
    fromDate?: string; toDate?: string; limit: number; offset: number;
  },
): Promise<{ rows: StockMovementRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.skuId) { conditions.push(`sku_id = $${idx++}`); params.push(filters.skuId); }
  if (filters.stockItemId) { conditions.push(`stock_item_id = $${idx++}`); params.push(filters.stockItemId); }
  if (filters.locationId) { conditions.push(`(from_location_id = $${idx} OR to_location_id = $${idx})`); params.push(filters.locationId); idx++; }
  if (filters.movementType) { conditions.push(`movement_type = $${idx++}`); params.push(filters.movementType); }
  if (filters.transferId) { conditions.push(`transfer_id = $${idx++}`); params.push(filters.transferId); }
  if (filters.adjustmentId) { conditions.push(`adjustment_id = $${idx++}`); params.push(filters.adjustmentId); }
  if (filters.fromDate) { conditions.push(`performed_at >= $${idx++}`); params.push(filters.fromDate); }
  if (filters.toDate) { conditions.push(`performed_at <= $${idx++}`); params.push(filters.toDate); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_stock_movements ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<StockMovementRow>(
    `SELECT * FROM inventory_stock_movements ${where} ORDER BY performed_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function findMovementById(id: string): Promise<StockMovementRow | null> {
  const result = await query<StockMovementRow>('SELECT * FROM inventory_stock_movements WHERE movement_id = $1', [id]);
  return result.rows[0] ?? null;
}

// ── Aggregate queries for reporting ───────────────────

export async function getStockSummaryBySite(siteId: string): Promise<any[]> {
  const result = await query(
    `SELECT sku_id, stock_status_code,
            SUM(quantity_on_hand) as total_on_hand,
            SUM(quantity_reserved) as total_reserved,
            SUM(quantity_available) as total_available
     FROM inventory_stock_balances WHERE site_id = $1
     GROUP BY sku_id, stock_status_code ORDER BY sku_id`,
    [siteId],
  );
  return result.rows;
}

export async function getLowStockBalances(threshold: number, siteId?: string, limit = 50, offset = 0) {
  const conditions = [`quantity_available <= $1`, `quantity_on_hand > 0`];
  const params: unknown[] = [threshold];
  let idx = 2;
  if (siteId) { conditions.push(`site_id = $${idx++}`); params.push(siteId); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await query<StockBalanceRow>(
    `SELECT * FROM inventory_stock_balances ${where} ORDER BY quantity_available ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}

export async function getNegativeStockBalances(siteId?: string, limit = 50, offset = 0) {
  const conditions = [`(quantity_on_hand < 0 OR quantity_available < 0)`];
  const params: unknown[] = [];
  let idx = 1;
  if (siteId) { conditions.push(`site_id = $${idx++}`); params.push(siteId); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await query<StockBalanceRow>(
    `SELECT * FROM inventory_stock_balances ${where} ORDER BY quantity_available ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}

export async function getReservedVsAvailable(siteId?: string, limit = 50, offset = 0) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (siteId) { conditions.push(`site_id = $${idx++}`); params.push(siteId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT sku_id, site_id,
            SUM(quantity_on_hand) as total_on_hand,
            SUM(quantity_reserved) as total_reserved,
            SUM(quantity_available) as total_available
     FROM inventory_stock_balances ${where}
     GROUP BY sku_id, site_id ORDER BY total_reserved DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}

export async function getEstateStockSummary() {
  const result = await query(
    `SELECT site_id, stock_status_code,
            SUM(quantity_on_hand) as total_on_hand,
            SUM(quantity_reserved) as total_reserved,
            SUM(quantity_available) as total_available,
            COUNT(DISTINCT sku_id) as sku_count
     FROM inventory_stock_balances
     GROUP BY site_id, stock_status_code ORDER BY site_id`,
  );
  return result.rows;
}

