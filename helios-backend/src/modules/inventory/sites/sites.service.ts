// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Sites service
// ═══════════════════════════════════════════════════════════════════════

import * as sitesRepo from './sites.repository.js';
import { ConflictError, NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import { runInterceptors } from '../../../core/plugins/hook-executor.js';
import { buildHookContext } from '../../../core/plugins/plugin-context.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateSiteInput, UpdateSiteInput } from './sites.schemas.js';
import type { InventorySiteRow } from '../inventory.types.js';

export async function createSite(input: CreateSiteInput, ctx: RequestContext) {
  const existing = await sitesRepo.findSiteBySiteId(input.siteId);
  if (existing) throw new ConflictError(`Site '${input.siteId}' already exists`);

  // Interceptor hook: plugins can validate/deny before site creation
  await runInterceptors(BuiltInHooks.SITE_BEFORE_CREATE, input, buildHookContext(ctx));

  const site = await sitesRepo.createSite(input);

  logger.info({ siteId: input.siteId }, 'Inventory site created');
  await logInventoryAudit(ctx, 'inventory.site.created', 'SUCCESS', {
    siteId: input.siteId,
    details: { siteName: input.siteName, siteType: input.siteType },
  });

  return formatSite(site);
}

export async function getSite(siteId: string) {
  const site = await sitesRepo.findSiteBySiteId(siteId);
  if (!site) throw new NotFoundError('Inventory site');
  return formatSite(site);
}

export async function listSites(page: number, limit: number, status?: string) {
  const offset = (page - 1) * limit;
  const { rows, total } = await sitesRepo.listSites({ status, limit, offset });
  return {
    data: rows.map(formatSite),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateSite(siteId: string, input: UpdateSiteInput, ctx: RequestContext) {
  const site = await sitesRepo.updateSite(siteId, input);
  if (!site) throw new NotFoundError('Inventory site');

  logger.info({ siteId }, 'Inventory site updated');
  await logInventoryAudit(ctx, 'inventory.site.updated', 'SUCCESS', {
    siteId,
    details: input as Record<string, unknown>,
  });

  return formatSite(site);
}

export async function archiveSite(siteId: string, ctx: RequestContext) {
  const site = await sitesRepo.archiveSite(siteId);
  if (!site) throw new NotFoundError('Inventory site');

  logger.info({ siteId }, 'Inventory site archived');
  await logInventoryAudit(ctx, 'inventory.site.archived', 'SUCCESS', { siteId });

  return formatSite(site);
}

function formatSite(row: InventorySiteRow) {
  return {
    inventorySiteId: row.inventory_site_id,
    siteId: row.site_id,
    siteName: row.site_name,
    siteType: row.site_type,
    status: row.status,
    timezone: row.timezone,
    addressJson: row.address_json,
    contactJson: row.contact_json,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}



