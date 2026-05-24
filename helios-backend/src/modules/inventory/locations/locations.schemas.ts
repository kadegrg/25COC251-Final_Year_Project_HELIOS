import { z } from 'zod';

export const createLocationSchema = z.object({
  siteId: z.string().min(1),
  warehouseId: z.string().uuid(),
  parentLocationId: z.string().uuid().optional(),
  locationCode: z.string().min(1).max(50),
  locationName: z.string().min(1).max(200),
  locationType: z.string().min(1).max(50),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).default('ACTIVE'),
  isPickable: z.boolean().default(true),
  isReceivable: z.boolean().default(true),
  isDispatchable: z.boolean().default(true),
  isQuarantine: z.boolean().default(false),
  capacityJson: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateLocationSchema = z.object({
  locationName: z.string().min(1).max(200).optional(),
  locationType: z.string().min(1).max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  isPickable: z.boolean().optional(),
  isReceivable: z.boolean().optional(),
  isDispatchable: z.boolean().optional(),
  isQuarantine: z.boolean().optional(),
  capacityJson: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const locationIdParamSchema = z.object({ locationId: z.string().uuid() });
export const locationTreeQuerySchema = z.object({
  siteId: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

