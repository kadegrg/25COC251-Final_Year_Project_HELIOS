import { z } from 'zod';

export const createSkuSchema = z.object({
  skuCode: z.string().min(1).max(100),
  barcode: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  skuName: z.string().min(1).max(300),
  shortDescription: z.string().max(500).optional(),
  longDescription: z.string().max(5000).optional(),
  trackingMode: z.enum(['QUANTITY', 'SERIALIZED', 'BATCH']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE'),
  defaultUom: z.string().min(1).max(20),
  sellableByDefault: z.boolean().default(true),
  requiresExpiryTracking: z.boolean().default(false),
  requiresBatchTracking: z.boolean().default(false),
  weight: z.number().positive().optional(),
  dimensionsJson: z.record(z.string(), z.unknown()).optional(),
});

export const updateSkuSchema = z.object({
  barcode: z.string().max(100).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  skuName: z.string().min(1).max(300).optional(),
  shortDescription: z.string().max(500).optional(),
  longDescription: z.string().max(5000).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  defaultUom: z.string().min(1).max(20).optional(),
  sellableByDefault: z.boolean().optional(),
  requiresExpiryTracking: z.boolean().optional(),
  requiresBatchTracking: z.boolean().optional(),
  weight: z.number().positive().nullable().optional(),
  dimensionsJson: z.record(z.string(), z.unknown()).optional(),
});

export const skuIdParamSchema = z.object({ skuId: z.string().uuid() });

export const skuMetadataSchema = z.record(z.string(), z.unknown());

export const skuListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  trackingMode: z.enum(['QUANTITY', 'SERIALIZED', 'BATCH']).optional(),
  search: z.string().optional(),
});

export type CreateSkuInput = z.infer<typeof createSkuSchema>;
export type UpdateSkuInput = z.infer<typeof updateSkuSchema>;

