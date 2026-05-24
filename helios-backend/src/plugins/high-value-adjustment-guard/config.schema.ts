// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Config schema
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';

export const configSchema = z.object({
  /** Whether the guard logic is active */
  enabled: z.boolean().default(true),
  /** Minimum AAL required for high-value adjustments */
  minimumAalForHighValue: z.number().int().min(1).max(3).default(2),
  /** Absolute value threshold above which an adjustment is considered high-value */
  highValueThreshold: z.number().positive().default(10_000),
  /** Reason codes that always require approval regardless of value */
  restrictedReasonCodes: z.array(z.string()).default(['WRITE_OFF', 'SCRAP', 'DAMAGED', 'THEFT']),
  /** Whether restricted reason codes require prior approval */
  requireApprovalForRestrictedReasons: z.boolean().default(true),
});

export type HighValueGuardConfig = z.infer<typeof configSchema>;

export const defaultConfig: HighValueGuardConfig = configSchema.parse({});

