import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { LocationRow } from '../inventory.types.js';

export async function createLocation(
  data: {
    siteId: string; warehouseId: string; parentLocationId?: string; locationCode: string;
    locationName: string; locationType: string; status: string;
    isPickable?: boolean; isReceivable?: boolean; isDispatchable?: boolean; isQuarantine?: boolean;
    capacityJson?: object; metadata?: object;
  },
  client?: PoolClient,
): Promise<LocationRow> {
  const sql = `
    INSERT INTO inventory_locations
      (site_id, warehouse_id, parent_location_id, location_code, location_name, location_type,
       status, is_pickable, is_receivable, is_dispatchable, is_quarantine, capacity_json, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
  `;
  const params = [
    data.siteId, data.warehouseId, data.parentLocationId ?? null,
    data.locationCode, data.locationName, data.locationType,
    data.status, data.isPickable ?? true, data.isReceivable ?? true,
    data.isDispatchable ?? true, data.isQuarantine ?? false,
    data.capacityJson ? JSON.stringify(data.capacityJson) : null,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ];
  const result = client ? await client.query<LocationRow>(sql, params) : await query<LocationRow>(sql, params);
  return result.rows[0];
}

export async function findLocationById(id: string, client?: PoolClient): Promise<LocationRow | null> {
  const sql = 'SELECT * FROM inventory_locations WHERE location_id = $1 AND deleted_at IS NULL';
  const result = client ? await client.query<LocationRow>(sql, [id]) : await query<LocationRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function listLocations(
  filters: { siteId?: string; warehouseId?: string; parentLocationId?: string; locationType?: string; status?: string; limit: number; offset: number },
): Promise<{ rows: LocationRow[]; total: number }> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.warehouseId) { conditions.push(`warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
  if (filters.parentLocationId) { conditions.push(`parent_location_id = $${idx++}`); params.push(filters.parentLocationId); }
  if (filters.locationType) { conditions.push(`location_type = $${idx++}`); params.push(filters.locationType); }
  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_locations ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<LocationRow>(
    `SELECT * FROM inventory_locations ${where} ORDER BY location_code ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

/** Fetch all locations for a site/warehouse for tree building */
export async function listLocationsByWarehouse(warehouseId: string): Promise<LocationRow[]> {
  const result = await query<LocationRow>(
    'SELECT * FROM inventory_locations WHERE warehouse_id = $1 AND deleted_at IS NULL ORDER BY location_code ASC',
    [warehouseId],
  );
  return result.rows;
}

export async function listLocationsBySite(siteId: string): Promise<LocationRow[]> {
  const result = await query<LocationRow>(
    'SELECT * FROM inventory_locations WHERE site_id = $1 AND deleted_at IS NULL ORDER BY location_code ASC',
    [siteId],
  );
  return result.rows;
}

export async function updateLocation(
  locationId: string,
  data: { locationName?: string; locationType?: string; status?: string; isPickable?: boolean; isReceivable?: boolean; isDispatchable?: boolean; isQuarantine?: boolean; capacityJson?: object; metadata?: object },
  client?: PoolClient,
): Promise<LocationRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (data.locationName !== undefined) { sets.push(`location_name = $${idx++}`); params.push(data.locationName); }
  if (data.locationType !== undefined) { sets.push(`location_type = $${idx++}`); params.push(data.locationType); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
  if (data.isPickable !== undefined) { sets.push(`is_pickable = $${idx++}`); params.push(data.isPickable); }
  if (data.isReceivable !== undefined) { sets.push(`is_receivable = $${idx++}`); params.push(data.isReceivable); }
  if (data.isDispatchable !== undefined) { sets.push(`is_dispatchable = $${idx++}`); params.push(data.isDispatchable); }
  if (data.isQuarantine !== undefined) { sets.push(`is_quarantine = $${idx++}`); params.push(data.isQuarantine); }
  if (data.capacityJson !== undefined) { sets.push(`capacity_json = $${idx++}`); params.push(JSON.stringify(data.capacityJson)); }
  if (data.metadata !== undefined) { sets.push(`metadata = $${idx++}`); params.push(JSON.stringify(data.metadata)); }
  if (sets.length === 0) return findLocationById(locationId, client);
  sets.push('updated_at = now()');
  params.push(locationId);
  const sql = `UPDATE inventory_locations SET ${sets.join(', ')} WHERE location_id = $${idx} AND deleted_at IS NULL RETURNING *`;
  const result = client ? await client.query<LocationRow>(sql, params) : await query<LocationRow>(sql, params);
  return result.rows[0] ?? null;
}

export async function archiveLocation(locationId: string, client?: PoolClient): Promise<LocationRow | null> {
  const sql = `UPDATE inventory_locations SET status = 'INACTIVE', deleted_at = now(), updated_at = now() WHERE location_id = $1 AND deleted_at IS NULL RETURNING *`;
  const result = client ? await client.query<LocationRow>(sql, [locationId]) : await query<LocationRow>(sql, [locationId]);
  return result.rows[0] ?? null;
}

