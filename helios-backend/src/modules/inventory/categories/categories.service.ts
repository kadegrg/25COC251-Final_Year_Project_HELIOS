import * as categoriesRepo from './categories.repository.js';
import { ConflictError, NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schemas.js';
import type { CategoryRow } from '../inventory.types.js';

export async function createCategory(input: CreateCategoryInput, ctx: RequestContext) {
  try {
    const cat = await categoriesRepo.createCategory(input);
    await logInventoryAudit(ctx, 'inventory.category.created', 'SUCCESS', { details: { categoryKey: input.categoryKey } });
    return formatCategory(cat);
  } catch (err: any) {
    if (err.code === '23505') throw new ConflictError('Category key already exists');
    throw err;
  }
}

export async function listCategories() {
  const rows = await categoriesRepo.listCategories();
  return rows.map(formatCategory);
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput, ctx: RequestContext) {
  const cat = await categoriesRepo.updateCategory(categoryId, {
    ...input,
    parentCategoryId: input.parentCategoryId ?? undefined,
  });
  if (!cat) throw new NotFoundError('Category');
  await logInventoryAudit(ctx, 'inventory.category.updated', 'SUCCESS', { details: { categoryId } });
  return formatCategory(cat);
}

function formatCategory(row: CategoryRow) {
  return {
    categoryId: row.category_id,
    categoryKey: row.category_key,
    categoryName: row.category_name,
    description: row.description,
    parentCategoryId: row.parent_category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}




