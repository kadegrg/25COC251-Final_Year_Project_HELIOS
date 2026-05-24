import { z } from 'zod';

export const createWarehouseSchema = z.object({
  siteId: z.string().min(1),
  warehouseCode: z.string().min(1).max(50),
  warehouseName: z.string().min(1).max(200),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateWarehouseSchema = z.object({
  warehouseName: z.string().min(1).max(200).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const warehouseIdParamSchema = z.object({ warehouseId: z.string().uuid() });

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

