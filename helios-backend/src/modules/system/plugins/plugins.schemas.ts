// ═══════════════════════════════════════════════════════════════════════
// HELIOS System — Plugin admin schemas (Zod validation)
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';

export const updatePluginSchema = z.object({
  isEnabled: z.boolean().optional(),
});

export const updatePluginConfigSchema = z.object({
  config: z.record(z.string(), z.unknown()),
});

export type UpdatePluginInput = z.infer<typeof updatePluginSchema>;
export type UpdatePluginConfigInput = z.infer<typeof updatePluginConfigSchema>;

