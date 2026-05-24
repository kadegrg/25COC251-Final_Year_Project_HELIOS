// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Audit event repository
// ═══════════════════════════════════════════════════════════════════════

import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { InventoryAuditEventRow } from '../inventory.types.js';

export interface InventoryAuditInput {
  eventType: string;
  eventResult: 'SUCCESS' | 'FAILURE' | 'DENIED';
  siteId?: string | null;
  warehouseId?: string | null;
  locationId?: string | null;
  skuId?: string | null;
  stockItemId?: string | null;
  transferId?: string | null;
  adjustmentId?: string | null;
  importJobId?: string | null;
  userId?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  detailsJson?: Record<string, unknown> | null;
}

const INSERT_SQL = `
  INSERT INTO inventory_audit_events
    (event_type, event_result, site_id, warehouse_id, location_id, sku_id,
     stock_item_id, transfer_id, adjustment_id, import_job_id, user_id,
     request_id, correlation_id, details_json)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
`;

function buildParams(input: InventoryAuditInput): unknown[] {
  return [
    input.eventType,
    input.eventResult,
    input.siteId ?? null,
    input.warehouseId ?? null,
    input.locationId ?? null,
    input.skuId ?? null,
    input.stockItemId ?? null,
    input.transferId ?? null,
    input.adjustmentId ?? null,
    input.importJobId ?? null,
    input.userId ?? null,
    input.requestId ?? null,
    input.correlationId ?? null,
    input.detailsJson ? JSON.stringify(input.detailsJson) : null,
  ];
}

export async function createInventoryAuditEvent(
  input: InventoryAuditInput,
  client?: PoolClient,
): Promise<void> {
  const params = buildParams(input);
  if (client) {
    await client.query(INSERT_SQL, params);
  } else {
    await query(INSERT_SQL, params);
  }
}

export async function listInventoryAuditEvents(
  filters: {
    siteId?: string;
    eventType?: string;
    userId?: string;
    skuId?: string;
    transferId?: string;
    adjustmentId?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ rows: InventoryAuditEventRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.eventType) { conditions.push(`event_type = $${idx++}`); params.push(filters.eventType); }
  if (filters.userId) { conditions.push(`user_id = $${idx++}`); params.push(filters.userId); }
  if (filters.skuId) { conditions.push(`sku_id = $${idx++}`); params.push(filters.skuId); }
  if (filters.transferId) { conditions.push(`transfer_id = $${idx++}`); params.push(filters.transferId); }
  if (filters.adjustmentId) { conditions.push(`adjustment_id = $${idx++}`); params.push(filters.adjustmentId); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM inventory_audit_events ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<InventoryAuditEventRow>(
    `SELECT * FROM inventory_audit_events ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );

  return { rows: result.rows, total };
}

