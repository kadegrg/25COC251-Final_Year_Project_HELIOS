// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Hook type definitions
// ═══════════════════════════════════════════════════════════════════════
//
// Two hook categories:
//   1. EVENT hooks   — read-only pub/sub observers; cannot block or mutate
//   2. INTERCEPTOR hooks — middleware-style; can allow, deny, or mutate payload
// ═══════════════════════════════════════════════════════════════════════

import type { PluginHookContext } from './plugin-context.js';

// ── Hook names (central registry) ────────────────────────────────────

export const BuiltInHooks = {
  // ── Auth lifecycle ────────────────────────────
  AUTH_PRE_LOGIN:              'auth.login.before',
  AUTH_POST_LOGIN:             'auth.login.after',
  AUTH_LOGIN_FAILED:           'auth.login.failed',
  AUTH_PRE_LOGOUT:             'auth.logout.before',
  AUTH_POST_LOGOUT:            'auth.logout.after',
  AUTH_TOKEN_REFRESHED:        'auth.refresh.after',
  AUTH_TOKEN_REUSE_DETECTED:   'auth.token.reuseDetected',

  // ── MFA lifecycle ─────────────────────────────
  MFA_FACTOR_ENROLLED:         'mfa.factor.enrolled',
  MFA_FACTOR_REMOVED:          'mfa.factor.removed',
  MFA_CHALLENGE_STARTED:       'mfa.challenge.started',
  MFA_CHALLENGE_VERIFIED:      'mfa.challenge.verified',
  MFA_CHALLENGE_FAILED:        'mfa.challenge.failed',

  // ── Password lifecycle ────────────────────────
  PASSWORD_CHANGED:            'password.changed',
  PASSWORD_RESET_REQUESTED:    'password.resetRequested',
  PASSWORD_RESET_COMPLETED:    'password.resetCompleted',

  // ── Session lifecycle ─────────────────────────
  SESSION_CREATED:             'session.created',
  SESSION_REVOKED:             'session.revoked',
  SESSION_AAL_ESCALATED:       'session.aalEscalated',

  // ── IAM lifecycle ─────────────────────────────
  USER_CREATED:                'iam.user.created',
  USER_UPDATED:                'iam.user.updated',
  USER_DISABLED:               'iam.user.disabled',
  ROLE_ASSIGNED:               'iam.role.assigned',
  ROLE_REVOKED:                'iam.role.revoked',
  PERMISSION_CHANGED:          'iam.permission.changed',

  // ── Audit ─────────────────────────────────────
  AUDIT_EVENT_CREATED:         'audit.event.created',

  // ── Inventory — SKU ───────────────────────────
  SKU_BEFORE_CREATE:           'inventory.sku.beforeCreate',
  SKU_AFTER_CREATE:            'inventory.sku.afterCreated',
  SKU_BEFORE_UPDATE:           'inventory.sku.beforeUpdate',
  SKU_AFTER_UPDATE:            'inventory.sku.afterUpdated',
  SKU_BEFORE_ARCHIVE:          'inventory.sku.beforeArchive',
  SKU_AFTER_ARCHIVE:           'inventory.sku.afterArchived',
  SKU_METADATA_BEFORE_SAVE:    'inventory.sku.metadata.beforeSave',
  SKU_METADATA_AFTER_SAVE:     'inventory.sku.metadata.afterSaved',

  // ── Inventory — Stock ─────────────────────────
  STOCK_BEFORE_RECEIVE:        'inventory.stock.receive.beforeValidate',
  STOCK_AFTER_RECEIVED:        'inventory.stock.receive.afterPosted',
  STOCK_BEFORE_MOVE:           'inventory.stock.move.beforeCommit',
  STOCK_AFTER_MOVED:           'inventory.stock.move.afterCommitted',
  STOCK_BEFORE_RESERVE:        'inventory.stock.reserve.beforeCommit',
  STOCK_AFTER_RESERVED:        'inventory.stock.reserve.afterCommitted',
  STOCK_BEFORE_UNRESERVE:      'inventory.stock.unreserve.beforeCommit',
  STOCK_AFTER_UNRESERVED:      'inventory.stock.unreserve.afterCommitted',
  STOCK_BEFORE_QUARANTINE:     'inventory.stock.quarantine.beforeCommit',
  STOCK_AFTER_QUARANTINED:     'inventory.stock.quarantine.afterCommitted',
  STOCK_BEFORE_WRITE_OFF:      'inventory.stock.writeOff.beforeCommit',
  STOCK_AFTER_WRITTEN_OFF:     'inventory.stock.writeOff.afterCommitted',

  // ── Inventory — Adjustments ───────────────────
  ADJUSTMENT_BEFORE_APPROVE:   'inventory.adjustment.beforeApprove',
  ADJUSTMENT_AFTER_APPROVED:   'inventory.adjustment.afterApproved',
  ADJUSTMENT_BEFORE_POST:      'inventory.adjustment.beforePost',
  ADJUSTMENT_AFTER_POSTED:     'inventory.adjustment.afterPosted',

  // ── Inventory — Transfers ─────────────────────
  TRANSFER_BEFORE_DISPATCH:    'inventory.transfer.beforeDispatch',
  TRANSFER_AFTER_DISPATCHED:   'inventory.transfer.afterDispatched',
  TRANSFER_AFTER_RECEIVED:     'inventory.transfer.afterReceived',
  TRANSFER_DISCREPANCY:        'inventory.transfer.discrepancy.detected',

  // ── Inventory — Sites ─────────────────────────
  SITE_BEFORE_CREATE:          'inventory.site.beforeCreate',

  // ── Inventory — Imports ───────────────────────
  IMPORT_BEFORE_VALIDATE:      'inventory.import.beforeValidate',
  IMPORT_BEFORE_PROCESS:       'inventory.import.beforeProcess',
  IMPORT_AFTER_COMPLETED:      'inventory.import.afterCompleted',

  // ── Inventory — Reports / Anomaly ─────────────
  ANOMALY_REPORT_GENERATED:    'inventory.report.anomaly.generated',

  // ── Log forwarding ────────────────────────────
  LOG_FORWARD:                 'log.forward',
} as const;

export type BuiltInHookName = (typeof BuiltInHooks)[keyof typeof BuiltInHooks];

/**
 * A hook name is either a built-in name or a custom plugin-registered string.
 */
export type HookName = BuiltInHookName | (string & {});

// ── Hook categories ──────────────────────────────────────────────────

export type HookCategory = 'EVENT' | 'INTERCEPTOR';

// ── Event hook handler ───────────────────────────────────────────────
// Read-only observer; receives payload + context; return value is ignored.
// Failures are logged but do NOT block the main action.

export type EventHookHandler<TPayload = unknown> = (
  payload: TPayload,
  context: PluginHookContext,
) => void | Promise<void>;

// ── Interceptor hook handler ─────────────────────────────────────────
// Can inspect/modify payload and return an InterceptorResult.

export interface InterceptorResult<TPayload = unknown> {
  /** Whether the action should proceed */
  action: 'ALLOW' | 'DENY' | 'MODIFY';
  /** Reason for denial or modification (logged + audited) */
  reason?: string;
  /** Modified payload — only used when action === 'MODIFY' */
  modifiedPayload?: TPayload;
  /** Non-blocking warnings to attach to the response */
  warnings?: string[];
  /** Arbitrary metadata the plugin wants to attach */
  metadata?: Record<string, unknown>;
}

export type InterceptorHookHandler<TPayload = unknown> = (
  payload: TPayload,
  context: PluginHookContext,
) => InterceptorResult<TPayload> | Promise<InterceptorResult<TPayload>>;

// ── Unified hook handler (discriminated by category) ─────────────────

export type HookHandler<TPayload = unknown> =
  | EventHookHandler<TPayload>
  | InterceptorHookHandler<TPayload>;

// ── Hook registration descriptor ─────────────────────────────────────

export interface HookRegistration<TPayload = unknown> {
  /** The hook point to bind to */
  hookName: HookName;
  /** EVENT = read-only observer, INTERCEPTOR = can modify/deny */
  category: HookCategory;
  /** The handler function */
  handler: HookHandler<TPayload>;
  /** Execution priority — lower numbers run first (default 100) */
  priority?: number;
  /**
   * For interceptors: if true, a failure in this handler will block
   * the parent action. If false, errors are logged but the action continues.
   * Default: true for interceptors.
   */
  required?: boolean;
  /** Optional human-readable description */
  description?: string;
}

