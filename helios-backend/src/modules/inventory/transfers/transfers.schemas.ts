import { z } from 'zod';

const transferLineSchema = z.object({
  skuId: z.string().uuid(),
  stockItemId: z.string().uuid().optional(),
  requestedQuantity: z.number().positive(),
  fromStatusCode: z.string().optional(),
  toStatusCode: z.string().optional(),
  notes: z.string().optional(),
});

export const createTransferSchema = z.object({
  fromSiteId: z.string().min(1),
  toSiteId: z.string().min(1),
  reasonCode: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(transferLineSchema).min(1),
});

export const transferIdParamSchema = z.object({ transferId: z.string().uuid() });

export const receiveTransferSchema = z.object({
  lines: z.array(z.object({
    transferLineId: z.string().uuid(),
    receivedQuantity: z.number().min(0),
    discrepancyReasonCode: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});

export const createDiscrepancySchema = z.object({
  transferLineId: z.string().uuid().optional(),
  discrepancyType: z.string().min(1),
  expectedQuantity: z.number().optional(),
  actualQuantity: z.number().optional(),
  stockItemId: z.string().uuid().optional(),
  reasonCode: z.string().min(1),
  notes: z.string().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type TransferLineInput = z.infer<typeof transferLineSchema>;
export type ReceiveTransferInput = z.infer<typeof receiveTransferSchema>;
export type CreateDiscrepancyInput = z.infer<typeof createDiscrepancySchema>;

