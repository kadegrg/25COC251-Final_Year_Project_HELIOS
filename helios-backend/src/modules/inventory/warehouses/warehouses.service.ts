import * as warehousesRepo from './warehouses.repository.js';
import { ConflictError, NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateWarehouseInput, UpdateWarehouseInput } from './warehouses.schemas.js';
import type { WarehouseRow } from '../inventory.types.js';

export async function createWarehouse(input: CreateWarehouseInput, ctx: RequestContext) {
  try {
    const warehouse = await warehousesRepo.createWarehouse(input);
    logger.info({ warehouseId: warehouse.warehouse_id, siteId: input.siteId }, 'Warehouse created');
    await logInventoryAudit(ctx, 'inventory.warehouse.created', 'SUCCESS', { siteId: input.siteId, warehouseId: warehouse.warehouse_id });
    return formatWarehouse(warehouse);
  } catch (err: any) {
    if (err.code === '23505') throw new ConflictError('Warehouse code already exists for this site');
    throw err;
  }
}

export async function getWarehouse(warehouseId: string) {
  const wh = await warehousesRepo.findWarehouseById(warehouseId);
  if (!wh) throw new NotFoundError('Warehouse');
  return formatWarehouse(wh);
}

export async function listWarehouses(page: number, limit: number, siteId?: string, status?: string) {
  const offset = (page - 1) * limit;
  const { rows, total } = await warehousesRepo.listWarehouses({ siteId, status, limit, offset });
  return {
    data: rows.map(formatWarehouse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateWarehouse(warehouseId: string, input: UpdateWarehouseInput, ctx: RequestContext) {
  const wh = await warehousesRepo.updateWarehouse(warehouseId, input);
  if (!wh) throw new NotFoundError('Warehouse');
  logger.info({ warehouseId }, 'Warehouse updated');
  await logInventoryAudit(ctx, 'inventory.warehouse.updated', 'SUCCESS', { warehouseId, details: input as Record<string, unknown> });
  return formatWarehouse(wh);
}

export async function archiveWarehouse(warehouseId: string, ctx: RequestContext) {
  const wh = await warehousesRepo.archiveWarehouse(warehouseId);
  if (!wh) throw new NotFoundError('Warehouse');
  logger.info({ warehouseId }, 'Warehouse archived');
  await logInventoryAudit(ctx, 'inventory.warehouse.archived', 'SUCCESS', { warehouseId });
  return formatWarehouse(wh);
}

function formatWarehouse(row: WarehouseRow) {
  return {
    warehouseId: row.warehouse_id,
    siteId: row.site_id,
    warehouseCode: row.warehouse_code,
    warehouseName: row.warehouse_name,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}



