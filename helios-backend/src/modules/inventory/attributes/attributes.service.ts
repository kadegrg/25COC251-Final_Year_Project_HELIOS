import * as attrsRepo from './attributes.repository.js';
import { ConflictError, NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateAttributeInput, UpdateAttributeInput } from './attributes.schemas.js';
import type { AttributeDefinitionRow } from '../inventory.types.js';

export async function createAttribute(input: CreateAttributeInput, ctx: RequestContext) {
  try {
    const attr = await attrsRepo.createAttributeDefinition(input);
    await logInventoryAudit(ctx, 'inventory.attribute.created', 'SUCCESS', { details: { attributeKey: input.attributeKey } });
    return formatAttribute(attr);
  } catch (err: any) {
    if (err.code === '23505') throw new ConflictError('Attribute key already exists');
    throw err;
  }
}

export async function listAttributes(categoryId?: string) {
  const rows = await attrsRepo.listAttributes(categoryId);
  return rows.map(formatAttribute);
}

export async function updateAttribute(attributeId: string, input: UpdateAttributeInput, ctx: RequestContext) {
  const attr = await attrsRepo.updateAttribute(attributeId, input);
  if (!attr) throw new NotFoundError('Attribute definition');
  await logInventoryAudit(ctx, 'inventory.attribute.updated', 'SUCCESS', { details: { attributeId } });
  return formatAttribute(attr);
}

function formatAttribute(row: AttributeDefinitionRow) {
  return {
    attributeId: row.attribute_id,
    attributeKey: row.attribute_key,
    attributeName: row.attribute_name,
    categoryId: row.category_id,
    dataType: row.data_type,
    isRequired: row.is_required,
    isFilterable: row.is_filterable,
    isSearchable: row.is_searchable,
    validationRules: row.validation_rules,
    enumValues: row.enum_values,
    unitLabel: row.unit_label,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}




