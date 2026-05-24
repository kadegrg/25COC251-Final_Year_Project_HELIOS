import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { AdjustmentRow, AdjustmentLineRow } from '../inventory.types.js';

export async function createAdjustment(
  data: {
    siteId: string; warehouseId?: string; locationId?: string; adjustmentType: string;
    reasonCode: string; status: string; requestedByUserId?: string; notes?: string; metadata?: object;
  },
  client?: PoolClient,
): Promise<AdjustmentRow> {
  const sql = `
    INSERT INTO inventory_adjustments (site_id, warehouse_id, location_id, adjustment_type, reason_code, status, requested_by_user_id, notes, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const params = [data.siteId, data.warehouseId ?? null, data.locationId ?? null, data.adjustmentType, data.reasonCode, data.status, data.requestedByUserId ?? null, data.notes ?? null, data.metadata ? JSON.stringify(data.metadata) : null];
  const result = client ? await client.query<AdjustmentRow>(sql, params) : await query<AdjustmentRow>(sql, params);
  return result.rows[0];
}

export async function createAdjustmentLine(
  data: {
    adjustmentId: string; skuId: string; stockItemId?: string; fromStatusCode?: string;
    toStatusCode?: string; quantityDelta: number; countedQuantity?: number; expectedQuantity?: number;
    reasonCode: string; notes?: string; detailsJson?: object;
  },
  client?: PoolClient,
): Promise<AdjustmentLineRow> {
  const sql = `
    INSERT INTO inventory_adjustment_lines (adjustment_id, sku_id, stock_item_id, from_status_code, to_status_code, quantity_delta, counted_quantity, expected_quantity, reason_code, notes, details_json)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
  `;
  const params = [data.adjustmentId, data.skuId, data.stockItemId ?? null, data.fromStatusCode ?? null, data.toStatusCode ?? null, data.quantityDelta, data.countedQuantity ?? null, data.expectedQuantity ?? null, data.reasonCode, data.notes ?? null, data.detailsJson ? JSON.stringify(data.detailsJson) : null];
  const result = client ? await client.query<AdjustmentLineRow>(sql, params) : await query<AdjustmentLineRow>(sql, params);
  return result.rows[0];
}

export async function findAdjustmentById(id: string, client?: PoolClient): Promise<AdjustmentRow | null> {
  const sql = 'SELECT * FROM inventory_adjustments WHERE adjustment_id = $1';
  const result = client ? await client.query<AdjustmentRow>(sql, [id]) : await query<AdjustmentRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function getAdjustmentLines(adjustmentId: string, client?: PoolClient): Promise<AdjustmentLineRow[]> {
  const sql = 'SELECT * FROM inventory_adjustment_lines WHERE adjustment_id = $1 ORDER BY created_at ASC';
  const result = client ? await client.query<AdjustmentLineRow>(sql, [adjustmentId]) : await query<AdjustmentLineRow>(sql, [adjustmentId]);
  return result.rows;
}

export async function listAdjustments(
  filters: { siteId?: string; status?: string; adjustmentType?: string; limit: number; offset: number },
): Promise<{ rows: AdjustmentRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  if (filters.adjustmentType) { conditions.push(`adjustment_type = $${idx++}`); params.push(filters.adjustmentType); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_adjustments ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<AdjustmentRow>(
    `SELECT * FROM inventory_adjustments ${where} ORDER BY requested_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function updateAdjustmentStatus(
  adjustmentId: string,
  status: string,
  extra: { approvedByUserId?: string; postedByUserId?: string },
  client?: PoolClient,
): Promise<AdjustmentRow | null> {
  const sets = [`status = $1`, `updated_at = now()`];
  const params: unknown[] = [status];
  let idx = 2;
  if (status === 'POSTED') { sets.push(`posted_at = now()`, `posted_by_user_id = $${idx++}`); params.push(extra.postedByUserId ?? null); }
  if (extra.approvedByUserId) { sets.push(`approved_at = now()`, `approved_by_user_id = $${idx++}`); params.push(extra.approvedByUserId); }
  params.push(adjustmentId);
  const sql = `UPDATE inventory_adjustments SET ${sets.join(', ')} WHERE adjustment_id = $${idx} RETURNING *`;
  const result = client ? await client.query<AdjustmentRow>(sql, params) : await query<AdjustmentRow>(sql, params);
  return result.rows[0] ?? null;
}

