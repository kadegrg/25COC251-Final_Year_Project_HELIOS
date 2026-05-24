import { z } from 'zod';

const adjustmentLineSchema = z.object({
  skuId: z.string().uuid(),
  stockItemId: z.string().uuid().optional(),
  fromStatusCode: z.string().optional(),
  toStatusCode: z.string().optional(),
  quantityDelta: z.number(),
  countedQuantity: z.number().optional(),
  expectedQuantity: z.number().optional(),
  reasonCode: z.string().min(1),
  notes: z.string().optional(),
});

export const createAdjustmentSchema = z.object({
  siteId: z.string().min(1),
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  adjustmentType: z.enum(['INCREASE', 'DECREASE', 'STATUS_CHANGE', 'RECOUNT_RECONCILIATION']),
  reasonCode: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(adjustmentLineSchema).min(1),
});

export const adjustmentIdParamSchema = z.object({ adjustmentId: z.string().uuid() });

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type AdjustmentLineInput = z.infer<typeof adjustmentLineSchema>;

