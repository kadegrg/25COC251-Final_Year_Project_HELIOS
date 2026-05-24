import * as skusRepo from './skus.repository.js';
import * as attrsRepo from '../attributes/attributes.repository.js';
import { validateAttributeValue, getValueColumn } from '../attributes/metadata-validation.service.js';
import { rebuildMetadataCache, formatMetadataForResponse } from '../attributes/metadata-cache.service.js';
import { withTransaction } from '../../../db/transaction.js';
import { ConflictError, NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import { runInterceptors, emitEvent } from '../../../core/plugins/hook-executor.js';
import { buildHookContext } from '../../../core/plugins/plugin-context.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateSkuInput, UpdateSkuInput } from './skus.schemas.js';
import type { SkuRow } from '../inventory.types.js';

export async function createSku(input: CreateSkuInput, ctx: RequestContext) {
  const existing = await skusRepo.findSkuByCode(input.skuCode);
  if (existing) throw new ConflictError(`SKU code '${input.skuCode}' already exists`);

  // Interceptor hook: plugins can validate/deny/modify before SKU creation
  const hookResult = await runInterceptors(BuiltInHooks.SKU_BEFORE_CREATE, input, buildHookContext(ctx));
  const effectiveInput = hookResult.payload as CreateSkuInput;

  const sku = await skusRepo.createSku(effectiveInput);

  logger.info({ skuId: sku.sku_id, skuCode: input.skuCode }, 'SKU created');
  await logInventoryAudit(ctx, 'inventory.sku.created', 'SUCCESS', { skuId: sku.sku_id });

  return formatSku(sku);
}

export async function getSku(skuId: string) {
  const sku = await skusRepo.findSkuById(skuId);
  if (!sku) throw new NotFoundError('SKU');
  return formatSku(sku);
}

export async function listSkus(
  page: number, limit: number,
  filters: { status?: string; categoryId?: string; trackingMode?: string; search?: string },
) {
  const offset = (page - 1) * limit;
  const { rows, total } = await skusRepo.listSkus({ ...filters, limit, offset });
  return {
    data: rows.map(formatSku),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateSku(skuId: string, input: UpdateSkuInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny/modify before SKU update
  await runInterceptors(BuiltInHooks.SKU_BEFORE_UPDATE, { skuId, ...input }, buildHookContext(ctx));

  const sku = await skusRepo.updateSku(skuId, {
    ...input,
    categoryId: input.categoryId ?? undefined,
    weight: input.weight ?? undefined,
  });
  if (!sku) throw new NotFoundError('SKU');

  logger.info({ skuId }, 'SKU updated');
  await logInventoryAudit(ctx, 'inventory.sku.updated', 'SUCCESS', { skuId, details: input as Record<string, unknown> });

  return formatSku(sku);
}

export async function archiveSku(skuId: string, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before SKU archive
  await runInterceptors(BuiltInHooks.SKU_BEFORE_ARCHIVE, { skuId }, buildHookContext(ctx));

  const sku = await skusRepo.archiveSku(skuId);
  if (!sku) throw new NotFoundError('SKU');

  logger.info({ skuId }, 'SKU archived');
  await logInventoryAudit(ctx, 'inventory.sku.archived', 'SUCCESS', { skuId });

  return formatSku(sku);
}

// ── Metadata (EAV) ────────────────────────────────────

export async function getSkuMetadata(skuId: string) {
  const sku = await skusRepo.findSkuById(skuId);
  if (!sku) throw new NotFoundError('SKU');

  const values = await attrsRepo.getSkuAttributeValues(skuId);
  const definitions = await attrsRepo.listAttributes(sku.category_id ?? undefined);

  return formatMetadataForResponse(values, definitions);
}

export async function setSkuMetadata(skuId: string, metadata: Record<string, unknown>, ctx: RequestContext) {
  const sku = await skusRepo.findSkuById(skuId);
  if (!sku) throw new NotFoundError('SKU');

  // Interceptor hook: plugins can validate/deny/modify before metadata save
  await runInterceptors(BuiltInHooks.SKU_METADATA_BEFORE_SAVE, { skuId, metadata }, buildHookContext(ctx));

  return withTransaction(async (client) => {
    for (const [key, value] of Object.entries(metadata)) {
      const def = await attrsRepo.findAttributeByKey(key);
      if (!def) {
        logger.warn({ key, skuId }, 'Unknown attribute key, skipping');
        continue;
      }

      if (value === null || value === undefined) {
        await attrsRepo.deleteSkuAttributeValue(skuId, def.attribute_id, client);
        continue;
      }

      // Validate value against definition
      const coerced = validateAttributeValue(def, value);
      const valueColumn = getValueColumn(def.data_type);
      const storedValue = def.data_type === 'JSON' ? JSON.stringify(coerced) : coerced;

      await attrsRepo.upsertSkuAttributeValue(skuId, def.attribute_id, valueColumn, storedValue, client);
    }

    // Rebuild the metadata cache on the SKU row
    await rebuildMetadataCache(skuId, client);

    await logInventoryAudit(ctx, 'inventory.sku.metadata_updated', 'SUCCESS', { skuId }, client);

    // Return updated metadata
    const values = await attrsRepo.getSkuAttributeValues(skuId);
    const definitions = await attrsRepo.listAttributes(sku.category_id ?? undefined);
    return formatMetadataForResponse(values, definitions);
  });
}

function formatSku(row: SkuRow) {
  return {
    skuId: row.sku_id,
    skuCode: row.sku_code,
    barcode: row.barcode,
    categoryId: row.category_id,
    skuName: row.sku_name,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    trackingMode: row.tracking_mode,
    status: row.status,
    defaultUom: row.default_uom,
    sellableByDefault: row.sellable_by_default,
    requiresExpiryTracking: row.requires_expiry_tracking,
    requiresBatchTracking: row.requires_batch_tracking,
    weight: row.weight,
    dimensionsJson: row.dimensions_json,
    metadataCache: row.metadata_cache,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

