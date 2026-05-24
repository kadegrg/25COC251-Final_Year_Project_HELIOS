import * as locationsRepo from './locations.repository.js';
import { buildLocationTree } from './locations.tree.js';
import { ConflictError, NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateLocationInput, UpdateLocationInput } from './locations.schemas.js';
import type { LocationRow } from '../inventory.types.js';

export async function createLocation(input: CreateLocationInput, ctx: RequestContext) {
  try {
    const loc = await locationsRepo.createLocation(input);
    logger.info({ locationId: loc.location_id, siteId: input.siteId }, 'Location created');
    await logInventoryAudit(ctx, 'inventory.location.created', 'SUCCESS', {
      siteId: input.siteId, locationId: loc.location_id, warehouseId: input.warehouseId,
    });
    return formatLocation(loc);
  } catch (err: any) {
    if (err.code === '23505') throw new ConflictError('Location code already exists for this site');
    throw err;
  }
}

export async function getLocation(locationId: string) {
  const loc = await locationsRepo.findLocationById(locationId);
  if (!loc) throw new NotFoundError('Location');
  return formatLocation(loc);
}

export async function listLocations(
  page: number, limit: number,
  filters: { siteId?: string; warehouseId?: string; parentLocationId?: string; locationType?: string; status?: string },
) {
  const offset = (page - 1) * limit;
  const { rows, total } = await locationsRepo.listLocations({ ...filters, limit, offset });
  return {
    data: rows.map(formatLocation),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getLocationTree(siteId?: string, warehouseId?: string) {
  let locations: LocationRow[];
  if (warehouseId) {
    locations = await locationsRepo.listLocationsByWarehouse(warehouseId);
  } else if (siteId) {
    locations = await locationsRepo.listLocationsBySite(siteId);
  } else {
    // Estate-wide: limited to 1000 to prevent overload
    const { rows } = await locationsRepo.listLocations({ limit: 1000, offset: 0 });
    locations = rows;
  }
  return buildLocationTree(locations);
}

export async function updateLocation(locationId: string, input: UpdateLocationInput, ctx: RequestContext) {
  const loc = await locationsRepo.updateLocation(locationId, input);
  if (!loc) throw new NotFoundError('Location');
  logger.info({ locationId }, 'Location updated');
  await logInventoryAudit(ctx, 'inventory.location.updated', 'SUCCESS', { locationId, details: input as Record<string, unknown> });
  return formatLocation(loc);
}

export async function archiveLocation(locationId: string, ctx: RequestContext) {
  const loc = await locationsRepo.archiveLocation(locationId);
  if (!loc) throw new NotFoundError('Location');
  logger.info({ locationId }, 'Location archived');
  await logInventoryAudit(ctx, 'inventory.location.archived', 'SUCCESS', { locationId });
  return formatLocation(loc);
}

function formatLocation(row: LocationRow) {
  return {
    locationId: row.location_id,
    siteId: row.site_id,
    warehouseId: row.warehouse_id,
    parentLocationId: row.parent_location_id,
    locationCode: row.location_code,
    locationName: row.location_name,
    locationType: row.location_type,
    status: row.status,
    isPickable: row.is_pickable,
    isReceivable: row.is_receivable,
    isDispatchable: row.is_dispatchable,
    isQuarantine: row.is_quarantine,
    capacityJson: row.capacity_json,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

