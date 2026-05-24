import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { WarehouseRow } from '../inventory.types.js';

export async function createWarehouse(
  data: { siteId: string; warehouseCode: string; warehouseName: string; status: string; metadata?: object },
  client?: PoolClient,
): Promise<WarehouseRow> {
  const sql = `INSERT INTO inventory_warehouses (site_id, warehouse_code, warehouse_name, status, metadata) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const params = [data.siteId, data.warehouseCode, data.warehouseName, data.status, data.metadata ? JSON.stringify(data.metadata) : null];
  const result = client ? await client.query<WarehouseRow>(sql, params) : await query<WarehouseRow>(sql, params);
  return result.rows[0];
}

export async function findWarehouseById(id: string, client?: PoolClient): Promise<WarehouseRow | null> {
  const sql = 'SELECT * FROM inventory_warehouses WHERE warehouse_id = $1 AND deleted_at IS NULL';
  const result = client ? await client.query<WarehouseRow>(sql, [id]) : await query<WarehouseRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function listWarehouses(
  filters: { siteId?: string; status?: string; limit: number; offset: number },
): Promise<{ rows: WarehouseRow[]; total: number }> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_warehouses ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<WarehouseRow>(
    `SELECT * FROM inventory_warehouses ${where} ORDER BY warehouse_name ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function updateWarehouse(
  warehouseId: string,
  data: { warehouseName?: string; status?: string; metadata?: object },
  client?: PoolClient,
): Promise<WarehouseRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (data.warehouseName !== undefined) { sets.push(`warehouse_name = $${idx++}`); params.push(data.warehouseName); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
  if (data.metadata !== undefined) { sets.push(`metadata = $${idx++}`); params.push(JSON.stringify(data.metadata)); }
  if (sets.length === 0) return findWarehouseById(warehouseId, client);
  sets.push('updated_at = now()');
  params.push(warehouseId);
  const sql = `UPDATE inventory_warehouses SET ${sets.join(', ')} WHERE warehouse_id = $${idx} AND deleted_at IS NULL RETURNING *`;
  const result = client ? await client.query<WarehouseRow>(sql, params) : await query<WarehouseRow>(sql, params);
  return result.rows[0] ?? null;
}

export async function archiveWarehouse(warehouseId: string, client?: PoolClient): Promise<WarehouseRow | null> {
  const sql = `UPDATE inventory_warehouses SET status = 'INACTIVE', deleted_at = now(), updated_at = now() WHERE warehouse_id = $1 AND deleted_at IS NULL RETURNING *`;
  const result = client ? await client.query<WarehouseRow>(sql, [warehouseId]) : await query<WarehouseRow>(sql, [warehouseId]);
  return result.rows[0] ?? null;
}

