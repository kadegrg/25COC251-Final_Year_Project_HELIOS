// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin types & contract
// ═══════════════════════════════════════════════════════════════════════

import type { Router } from 'express';
import type { z } from 'zod';
import type { HookRegistration } from './hook-types.js';

// ── Plugin status lifecycle ──────────────────────────────────────────

export type PluginStatus =
  | 'REGISTERED'
  | 'INITIALISED'
  | 'STARTED'
  | 'STOPPED'
  | 'FAILED'
  | 'DISABLED';

// ── Plugin scheduled job descriptor ──────────────────────────────────

export interface PluginScheduledJob {
  /** Unique key within the plugin (e.g. 'stale-review') */
  jobKey: string;
  /** Human-readable name */
  displayName: string;
  /** Interval in milliseconds or cron expression (simple interval preferred) */
  intervalMs: number;
  /** The job function */
  handler: () => void | Promise<void>;
  /** Whether the job should start immediately on plugin start */
  runOnStart?: boolean;
}

// ── Plugin migration descriptor ──────────────────────────────────────

export interface PluginMigration {
  /** Unique migration key within the plugin (e.g. '001_create_reviews') */
  key: string;
  /** SQL to apply */
  up: string;
}

// ── Plugin route registration ────────────────────────────────────────

export interface PluginRouteRegistration {
  /** Express router — will be mounted at /api/v1/plugins/:pluginId/ */
  router: Router;
}

// ── Plugin manifest — the declarative contract every plugin exports ──

export interface HeliosPluginManifest {
  /** Unique plugin identifier (kebab-case, e.g. 'high-value-adjustment-guard') */
  pluginId: string;
  /** Human-readable name */
  displayName: string;
  /** Semver version string */
  version: string;
  /** Short description */
  description: string;
  /** Author / maintainer */
  author: string;
  /** Whether the plugin is enabled by default on first registration */
  enabledByDefault: boolean;

  /** Zod schema for plugin configuration. Used for validation & defaults. */
  configSchema?: z.ZodType<any>;
  /** Default config values (must satisfy configSchema) */
  defaultConfig?: Record<string, unknown>;
}

// ── Plugin module — the full implementation a plugin exports ─────────

export interface HeliosPlugin {
  /** The declarative manifest */
  manifest: HeliosPluginManifest;

  /** Hook registrations */
  hooks?: HookRegistration[];

  /** Express router for plugin-owned routes */
  routes?: PluginRouteRegistration;

  /** Scheduled jobs the plugin wants to register */
  jobs?: PluginScheduledJob[];

  /** Database migrations the plugin needs */
  migrations?: PluginMigration[];

  // ── Lifecycle methods ──────────────────────────────────

  /**
   * Called once during plugin initialisation.
   * Use for validating environment, resolving dependencies, etc.
   * Receives the resolved plugin config.
   */
  init?: (config: Record<string, unknown>) => void | Promise<void>;

  /**
   * Called when the plugin is started (after init, and after routes/jobs are wired).
   */
  start?: () => void | Promise<void>;

  /**
   * Called during graceful shutdown or when the plugin is stopped.
   * Clean up timers, connections, etc.
   */
  stop?: () => void | Promise<void>;
}

// ── Runtime state tracked by the plugin manager ──────────────────────

export interface PluginRuntimeState {
  plugin: HeliosPlugin;
  status: PluginStatus;
  config: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  stoppedAt?: Date;
}
