import { z } from 'zod';

// ── Stock query schemas ──────────────────────────────

export const stockQuerySchema = z.object({
  siteId: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  skuId: z.string().uuid().optional(),
  stockStatusCode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const stockItemIdParamSchema = z.object({ stockItemId: z.string().uuid() });
export const serialParamSchema = z.object({ serialNumber: z.string().min(1) });

// ── Stock operation schemas ──────────────────────────

export const receiveStockSchema = z.object({
  siteId: z.string().min(1),
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  stockStatusCode: z.string().default('AWAITING_PUTAWAY'),
  serialNumber: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const moveStockSchema = z.object({
  siteId: z.string().min(1),
  skuId: z.string().uuid(),
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  quantity: z.number().positive(),
  stockStatusCode: z.string().default('SELLABLE'),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const reserveStockSchema = z.object({
  siteId: z.string().min(1),
  locationId: z.string().uuid().optional(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const unreserveStockSchema = z.object({
  siteId: z.string().min(1),
  locationId: z.string().uuid().optional(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const quarantineStockSchema = z.object({
  siteId: z.string().min(1),
  locationId: z.string().uuid(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  fromStatusCode: z.string().default('SELLABLE'),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const releaseQuarantineSchema = z.object({
  siteId: z.string().min(1),
  locationId: z.string().uuid(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  toStatusCode: z.string().default('SELLABLE'),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const writeOffSchema = z.object({
  siteId: z.string().min(1),
  locationId: z.string().uuid(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  fromStatusCode: z.string().default('DAMAGED'),
  reasonCode: z.string().default('WRITE_OFF'),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const statusChangeSchema = z.object({
  siteId: z.string().min(1),
  locationId: z.string().uuid(),
  skuId: z.string().uuid(),
  quantity: z.number().positive(),
  fromStatusCode: z.string(),
  toStatusCode: z.string(),
  stockItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
export type MoveStockInput = z.infer<typeof moveStockSchema>;
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
export type UnreserveStockInput = z.infer<typeof unreserveStockSchema>;
export type QuarantineStockInput = z.infer<typeof quarantineStockSchema>;
export type ReleaseQuarantineInput = z.infer<typeof releaseQuarantineSchema>;
export type WriteOffInput = z.infer<typeof writeOffSchema>;
export type StatusChangeInput = z.infer<typeof statusChangeSchema>;

