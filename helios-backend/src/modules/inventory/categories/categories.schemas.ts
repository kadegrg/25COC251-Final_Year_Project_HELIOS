import { z } from 'zod';

export const createCategorySchema = z.object({
  categoryKey: z.string().min(1).max(100),
  categoryName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  parentCategoryId: z.string().uuid().optional(),
});

export const updateCategorySchema = z.object({
  categoryName: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  parentCategoryId: z.string().uuid().nullable().optional(),
});

export const categoryIdParamSchema = z.object({ categoryId: z.string().uuid() });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

