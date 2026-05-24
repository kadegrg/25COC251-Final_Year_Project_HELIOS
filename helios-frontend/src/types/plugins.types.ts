/** Plugins types */

// --- Plugin Status ---

export const PLUGIN_STATUSES = [
  'REGISTERED', 'INITIALISED', 'STARTED', 'STOPPED', 'FAILED', 'DISABLED',
] as const;
export type PluginStatus = (typeof PLUGIN_STATUSES)[number];

// --- Job Status ---

export const JOB_STATUSES = ['ACTIVE', 'PAUSED', 'FAILED'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

// --- Hook Categories ---

export const HOOK_CATEGORIES = ['EVENT', 'INTERCEPTOR'] as const;
export type HookCategory = (typeof HOOK_CATEGORIES)[number];

// --- Permissions ---

export const PLUGIN_PERMISSIONS = {
  read: 'system.plugin.read',
  configRead: 'system.plugin.config.read',
  configUpdate: 'system.plugin.config.update',
  manage: 'system.plugin.manage',
  jobRead: 'system.plugin.job.read',
} as const;

// --- Data Shapes ---

export interface PluginMetadata {
  author?: string;
  description?: string;
  [key: string]: unknown;
}

export interface PluginSummary {
  pluginId: string;
  displayName: string;
  version: string;
  status: PluginStatus;
  isEnabled: boolean;
  lastStartedAt: string | null;
  lastStoppedAt: string | null;
  lastError: string | null;
  metadata: PluginMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PluginDetail extends PluginSummary {
  config: Record<string, unknown> | null;
}

export interface PluginConfig {
  pluginId: string;
  config: Record<string, unknown>;
  configVersion: string | null;
  updatedAt: string | null;
}

export interface PluginJob {
  pluginJobId: string;
  pluginId: string;
  jobKey: string;
  status: JobStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HookBindingStats {
  events: number;
  interceptors: number;
}

export interface HookStatsResponse {
  registeredHooks: string[];
  bindingStats: Record<string, HookBindingStats>;
}

// --- Request Bodies ---

export interface UpdatePluginRequest {
  isEnabled?: boolean;
}

export interface UpdatePluginConfigRequest {
  config: Record<string, unknown>;
}

