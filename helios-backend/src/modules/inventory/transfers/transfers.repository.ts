import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { TransferRow, TransferLineRow, TransferDiscrepancyRow } from '../inventory.types.js';

export async function createTransfer(
  data: {
    transferNumber: string; fromSiteId: string; toSiteId: string; status: string;
    reasonCode: string; requestedByUserId?: string; notes?: string; metadata?: object;
  },
  client?: PoolClient,
): Promise<TransferRow> {
  const sql = `
    INSERT INTO inventory_transfers (transfer_number, from_site_id, to_site_id, status, reason_code, requested_by_user_id, notes, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;
  const params = [data.transferNumber, data.fromSiteId, data.toSiteId, data.status, data.reasonCode, data.requestedByUserId ?? null, data.notes ?? null, data.metadata ? JSON.stringify(data.metadata) : null];
  const result = client ? await client.query<TransferRow>(sql, params) : await query<TransferRow>(sql, params);
  return result.rows[0];
}

export async function createTransferLine(
  data: {
    transferId: string; skuId: string; stockItemId?: string; requestedQuantity: number;
    fromStatusCode?: string; toStatusCode?: string; notes?: string;
  },
  client?: PoolClient,
): Promise<TransferLineRow> {
  const sql = `
    INSERT INTO inventory_transfer_lines (transfer_id, sku_id, stock_item_id, requested_quantity, from_status_code, to_status_code, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const params = [data.transferId, data.skuId, data.stockItemId ?? null, data.requestedQuantity, data.fromStatusCode ?? null, data.toStatusCode ?? null, data.notes ?? null];
  const result = client ? await client.query<TransferLineRow>(sql, params) : await query<TransferLineRow>(sql, params);
  return result.rows[0];
}

export async function findTransferById(id: string, client?: PoolClient): Promise<TransferRow | null> {
  const sql = 'SELECT * FROM inventory_transfers WHERE transfer_id = $1';
  const result = client ? await client.query<TransferRow>(sql, [id]) : await query<TransferRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function getTransferLines(transferId: string, client?: PoolClient): Promise<TransferLineRow[]> {
  const sql = 'SELECT * FROM inventory_transfer_lines WHERE transfer_id = $1 ORDER BY created_at ASC';
  const result = client ? await client.query<TransferLineRow>(sql, [transferId]) : await query<TransferLineRow>(sql, [transferId]);
  return result.rows;
}

export async function listTransfers(
  filters: { fromSiteId?: string; toSiteId?: string; status?: string; limit: number; offset: number },
): Promise<{ rows: TransferRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.fromSiteId) { conditions.push(`from_site_id = $${idx++}`); params.push(filters.fromSiteId); }
  if (filters.toSiteId) { conditions.push(`to_site_id = $${idx++}`); params.push(filters.toSiteId); }
  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_transfers ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<TransferRow>(
    `SELECT * FROM inventory_transfers ${where} ORDER BY requested_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function updateTransferStatus(
  transferId: string, status: string,
  extra: { approvedByUserId?: string; dispatchedByUserId?: string; receivedByUserId?: string },
  client?: PoolClient,
): Promise<TransferRow | null> {
  const sets = [`status = $1`, `updated_at = now()`];
  const params: unknown[] = [status];
  let idx = 2;
  if (status === 'APPROVED' && extra.approvedByUserId) { sets.push(`approved_at = now()`, `approved_by_user_id = $${idx++}`); params.push(extra.approvedByUserId); }
  if ((status === 'DISPATCHED' || status === 'IN_TRANSIT') && extra.dispatchedByUserId) { sets.push(`dispatched_at = now()`, `dispatched_by_user_id = $${idx++}`); params.push(extra.dispatchedByUserId); }
  if ((status === 'RECEIVED' || status === 'PART_RECEIVED') && extra.receivedByUserId) { sets.push(`received_at = now()`, `received_by_user_id = $${idx++}`); params.push(extra.receivedByUserId); }
  params.push(transferId);
  const sql = `UPDATE inventory_transfers SET ${sets.join(', ')} WHERE transfer_id = $${idx} RETURNING *`;
  const result = client ? await client.query<TransferRow>(sql, params) : await query<TransferRow>(sql, params);
  return result.rows[0] ?? null;
}

export async function updateTransferLineDispatched(lineId: string, quantity: number, client: PoolClient): Promise<void> {
  await client.query('UPDATE inventory_transfer_lines SET dispatched_quantity = $1 WHERE transfer_line_id = $2', [quantity, lineId]);
}

export async function updateTransferLineReceived(lineId: string, receivedQuantity: number, discrepancyQuantity: number, discrepancyReasonCode: string | null, client: PoolClient): Promise<void> {
  await client.query(
    'UPDATE inventory_transfer_lines SET received_quantity = $1, discrepancy_quantity = $2, discrepancy_reason_code = $3 WHERE transfer_line_id = $4',
    [receivedQuantity, discrepancyQuantity, discrepancyReasonCode, lineId],
  );
}

// ── Discrepancies ────────────────────────────────────

export async function createDiscrepancy(
  data: {
    transferId: string; transferLineId?: string; discrepancyType: string;
    expectedQuantity?: number; actualQuantity?: number; stockItemId?: string;
    reasonCode: string; notes?: string; reportedByUserId?: string; detailsJson?: object;
  },
  client?: PoolClient,
): Promise<TransferDiscrepancyRow> {
  const sql = `
    INSERT INTO inventory_transfer_discrepancies (transfer_id, transfer_line_id, discrepancy_type, expected_quantity, actual_quantity, stock_item_id, reason_code, notes, reported_by_user_id, details_json)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `;
  const params = [data.transferId, data.transferLineId ?? null, data.discrepancyType, data.expectedQuantity ?? null, data.actualQuantity ?? null, data.stockItemId ?? null, data.reasonCode, data.notes ?? null, data.reportedByUserId ?? null, data.detailsJson ? JSON.stringify(data.detailsJson) : null];
  const result = client ? await client.query<TransferDiscrepancyRow>(sql, params) : await query<TransferDiscrepancyRow>(sql, params);
  return result.rows[0];
}

export async function getDiscrepancies(transferId: string): Promise<TransferDiscrepancyRow[]> {
  const result = await query<TransferDiscrepancyRow>(
    'SELECT * FROM inventory_transfer_discrepancies WHERE transfer_id = $1 ORDER BY reported_at DESC',
    [transferId],
  );
  return result.rows;
}

// ── Transfer number generation ────────────────────────

export async function getNextTransferNumber(): Promise<string> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM inventory_transfers');
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `TRF-${String(seq).padStart(6, '0')}`;
}

