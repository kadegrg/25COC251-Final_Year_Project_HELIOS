// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Manifest
// ═══════════════════════════════════════════════════════════════════════

import type { HeliosPluginManifest } from '../../core/plugins/plugin-types.js';
import { configSchema, defaultConfig } from './config.schema.js';

export const manifest: HeliosPluginManifest = {
  pluginId: 'high-value-adjustment-guard',
  displayName: 'High-Value Adjustment Guard',
  version: '1.0.0',
  description:
    'Intercepts inventory adjustment posts to enforce additional controls ' +
    'on high-value or restricted-reason adjustments. Requires elevated AAL ' +
    'and/or prior approval for write-offs, scrap, and large negative deltas.',
  author: 'Kade Gregory',
  enabledByDefault: true,
  configSchema,
  defaultConfig: defaultConfig as Record<string, unknown>,
};

