import { z } from 'zod';

export const createAttributeSchema = z.object({
  attributeKey: z.string().min(1).max(100),
  attributeName: z.string().min(1).max(200),
  categoryId: z.string().uuid().optional(),
  dataType: z.enum(['STRING','TEXT','INTEGER','DECIMAL','BOOLEAN','DATE','DATETIME','JSON','ENUM']),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(true),
  isSearchable: z.boolean().default(false),
  validationRules: z.record(z.string(), z.unknown()).optional(),
  enumValues: z.array(z.string()).optional(),
  unitLabel: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateAttributeSchema = z.object({
  attributeName: z.string().min(1).max(200).optional(),
  isRequired: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  validationRules: z.record(z.string(), z.unknown()).optional(),
  enumValues: z.array(z.string()).optional(),
  unitLabel: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
});

export const attributeIdParamSchema = z.object({ attributeId: z.string().uuid() });

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;

