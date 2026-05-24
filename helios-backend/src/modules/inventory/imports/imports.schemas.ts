import { z } from 'zod';

export const validateImportSchema = z.object({
  siteId: z.string().min(1),
  importType: z.enum(['GOODS_RECEIPT', 'SKU_IMPORT', 'STOCK_BALANCE_IMPORT', 'TRANSFER_RECEIPT', 'ADJUSTMENT_IMPORT']),
  sourceFilename: z.string().optional(),
  sourceFormat: z.string().optional(),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
});

export const processImportSchema = z.object({
  importJobId: z.string().uuid(),
});

export const importJobIdParamSchema = z.object({ importJobId: z.string().uuid() });

export type ValidateImportInput = z.infer<typeof validateImportSchema>;
export type ProcessImportInput = z.infer<typeof processImportSchema>;

