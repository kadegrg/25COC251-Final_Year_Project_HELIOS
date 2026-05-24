import { z } from 'zod';

export const createSiteSchema = z.object({
  siteId: z.string().min(1).max(50),
  siteName: z.string().min(1).max(200),
  siteType: z.enum(['SUPER', 'EDGE', 'VIRTUAL', 'OTHER']),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  timezone: z.string().max(100).optional(),
  addressJson: z.record(z.string(), z.unknown()).optional(),
  contactJson: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateSiteSchema = z.object({
  siteName: z.string().min(1).max(200).optional(),
  siteType: z.enum(['SUPER', 'EDGE', 'VIRTUAL', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  timezone: z.string().max(100).optional(),
  addressJson: z.record(z.string(), z.unknown()).optional(),
  contactJson: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const siteIdParamSchema = z.object({
  siteId: z.string().min(1),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

