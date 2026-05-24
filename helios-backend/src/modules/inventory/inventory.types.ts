// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Shared TypeScript types
// ═══════════════════════════════════════════════════════════════════════

// ── Site types ─────────────────────────────────────────

export interface InventorySiteRow {
  inventory_site_id: string;
  site_id: string;
  site_name: string;
  site_type: SiteType;
  status: SiteStatus;
  timezone: string | null;
  address_json: Record<string, unknown> | null;
  contact_json: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type SiteType = 'SUPER' | 'EDGE' | 'VIRTUAL' | 'OTHER';
export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

// ── Warehouse types ───────────────────────────────────

export interface WarehouseRow {
  warehouse_id: string;
  site_id: string;
  warehouse_code: string;
  warehouse_name: string;
  status: WarehouseStatus;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

// ── Location types ────────────────────────────────────

export interface LocationRow {
  location_id: string;
  site_id: string;
  warehouse_id: string;
  parent_location_id: string | null;
  location_code: string;
  location_name: string;
  location_type: string;
  status: LocationStatus;
  is_pickable: boolean;
  is_receivable: boolean;
  is_dispatchable: boolean;
  is_quarantine: boolean;
  capacity_json: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type LocationStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

// ── Category types ────────────────────────────────────

export interface CategoryRow {
  category_id: string;
  category_key: string;
  category_name: string;
  description: string | null;
  parent_category_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── Attribute definition types ────────────────────────

export interface AttributeDefinitionRow {
  attribute_id: string;
  attribute_key: string;
  attribute_name: string;
  category_id: string | null;
  data_type: AttributeDataType;
  is_required: boolean;
  is_filterable: boolean;
  is_searchable: boolean;
  validation_rules: Record<string, unknown> | null;
  enum_values: string[] | null;
  unit_label: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export type AttributeDataType =
  | 'STRING' | 'TEXT' | 'INTEGER' | 'DECIMAL'
  | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'JSON' | 'ENUM';

// ── SKU types ─────────────────────────────────────────

export interface SkuRow {
  sku_id: string;
  sku_code: string;
  barcode: string | null;
  category_id: string | null;
  sku_name: string;
  short_description: string | null;
  long_description: string | null;
  tracking_mode: TrackingMode;
  status: SkuStatus;
  default_uom: string;
  sellable_by_default: boolean;
  requires_expiry_tracking: boolean;
  requires_batch_tracking: boolean;
  weight: number | null;
  dimensions_json: Record<string, unknown> | null;
  metadata_cache: Record<string, unknown>;
  search_text: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TrackingMode = 'QUANTITY' | 'SERIALIZED' | 'BATCH';
export type SkuStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

// ── SKU attribute value types ─────────────────────────

export interface SkuAttributeValueRow {
  sku_attribute_value_id: string;
  sku_id: string;
  attribute_id: string;
  value_string: string | null;
  value_text: string | null;
  value_integer: number | null;
  value_decimal: number | null;
  value_boolean: boolean | null;
  value_date: string | null;
  value_datetime: Date | null;
  value_json: unknown | null;
  value_enum: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── Stock status code types ───────────────────────────

export interface StockStatusCodeRow {
  stock_status_code: string;
  status_name: string;
  description: string | null;
  is_available_to_sell: boolean;
  is_available_to_reserve: boolean;
  is_physical_on_hand: boolean;
  sort_order: number;
  is_system: boolean;
  created_at: Date;
}

// ── Stock item types ──────────────────────────────────

export interface StockItemRow {
  stock_item_id: string;
  sku_id: string;
  serial_number: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  current_site_id: string | null;
  current_location_id: string | null;
  stock_status_code: string;
  lifecycle_status: LifecycleStatus;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type LifecycleStatus = 'ACTIVE' | 'IN_TRANSIT' | 'CONSUMED' | 'SCRAPPED' | 'LOST' | 'ARCHIVED';

// ── Stock balance types ───────────────────────────────

export interface StockBalanceRow {
  stock_balance_id: string;
  site_id: string;
  warehouse_id: string | null;
  location_id: string | null;
  sku_id: string;
  stock_status_code: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_inbound: number;
  quantity_outbound: number;
  last_movement_at: Date | null;
  updated_at: Date;
}

// ── Stock movement types ──────────────────────────────

export interface StockMovementRow {
  movement_id: string;
  movement_type: string;
  movement_reason_code: string;
  site_id: string;
  warehouse_id: string | null;
  sku_id: string;
  stock_item_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  from_status_code: string | null;
  to_status_code: string | null;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  transfer_id: string | null;
  adjustment_id: string | null;
  performed_by_user_id: string | null;
  performed_at: Date;
  request_id: string | null;
  correlation_id: string | null;
  notes: string | null;
  details_json: Record<string, unknown> | null;
  created_at: Date;
}

// ── Adjustment types ──────────────────────────────────

export interface AdjustmentRow {
  adjustment_id: string;
  site_id: string;
  warehouse_id: string | null;
  location_id: string | null;
  adjustment_type: AdjustmentType;
  reason_code: string;
  status: AdjustmentStatus;
  requested_by_user_id: string | null;
  approved_by_user_id: string | null;
  posted_by_user_id: string | null;
  requested_at: Date;
  approved_at: Date | null;
  posted_at: Date | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export type AdjustmentType = 'INCREASE' | 'DECREASE' | 'STATUS_CHANGE' | 'RECOUNT_RECONCILIATION';
export type AdjustmentStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface AdjustmentLineRow {
  adjustment_line_id: string;
  adjustment_id: string;
  sku_id: string;
  stock_item_id: string | null;
  from_status_code: string | null;
  to_status_code: string | null;
  quantity_delta: number;
  counted_quantity: number | null;
  expected_quantity: number | null;
  reason_code: string;
  notes: string | null;
  details_json: Record<string, unknown> | null;
  created_at: Date;
}

// ── Transfer types ────────────────────────────────────

export interface TransferRow {
  transfer_id: string;
  transfer_number: string;
  from_site_id: string;
  to_site_id: string;
  status: TransferStatus;
  reason_code: string;
  requested_by_user_id: string | null;
  approved_by_user_id: string | null;
  dispatched_by_user_id: string | null;
  received_by_user_id: string | null;
  requested_at: Date;
  approved_at: Date | null;
  dispatched_at: Date | null;
  received_at: Date | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export type TransferStatus =
  | 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'PICKED'
  | 'DISPATCHED' | 'IN_TRANSIT' | 'PART_RECEIVED'
  | 'RECEIVED' | 'RECONCILED' | 'CANCELLED';

export interface TransferLineRow {
  transfer_line_id: string;
  transfer_id: string;
  sku_id: string;
  stock_item_id: string | null;
  requested_quantity: number;
  dispatched_quantity: number;
  received_quantity: number;
  from_status_code: string | null;
  to_status_code: string | null;
  discrepancy_quantity: number;
  discrepancy_reason_code: string | null;
  notes: string | null;
  details_json: Record<string, unknown> | null;
  created_at: Date;
}

export interface TransferDiscrepancyRow {
  transfer_discrepancy_id: string;
  transfer_id: string;
  transfer_line_id: string | null;
  discrepancy_type: string;
  expected_quantity: number | null;
  actual_quantity: number | null;
  stock_item_id: string | null;
  reason_code: string;
  notes: string | null;
  reported_by_user_id: string | null;
  reported_at: Date;
  details_json: Record<string, unknown> | null;
}

// ── Import types ──────────────────────────────────────

export interface ImportJobRow {
  import_job_id: string;
  site_id: string;
  import_type: ImportType;
  status: ImportStatus;
  source_filename: string | null;
  source_format: string | null;
  requested_by_user_id: string | null;
  processed_by_user_id: string | null;
  summary_json: Record<string, unknown> | null;
  error_json: Record<string, unknown> | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type ImportType =
  | 'GOODS_RECEIPT' | 'SKU_IMPORT' | 'STOCK_BALANCE_IMPORT'
  | 'TRANSFER_RECEIPT' | 'ADJUSTMENT_IMPORT';
export type ImportStatus =
  | 'PENDING' | 'VALIDATING' | 'PARTIALLY_VALID' | 'VALID'
  | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ImportRowRow {
  import_row_id: string;
  import_job_id: string;
  row_number: number;
  row_data: Record<string, unknown>;
  validation_status: 'PENDING' | 'VALID' | 'INVALID' | 'PROCESSED';
  validation_errors: Record<string, unknown> | null;
  result_reference_type: string | null;
  result_reference_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── Reason code types ─────────────────────────────────

export interface ReasonCodeRow {
  reason_code: string;
  reason_type: ReasonType;
  reason_name: string;
  description: string | null;
  is_system: boolean;
  requires_note: boolean;
  requires_approval: boolean;
  created_at: Date;
}

export type ReasonType = 'MOVEMENT' | 'ADJUSTMENT' | 'TRANSFER' | 'DISCREPANCY' | 'IMPORT';

// ── Audit event types ─────────────────────────────────

export interface InventoryAuditEventRow {
  event_id: string;
  event_type: string;
  event_result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  site_id: string | null;
  warehouse_id: string | null;
  location_id: string | null;
  sku_id: string | null;
  stock_item_id: string | null;
  transfer_id: string | null;
  adjustment_id: string | null;
  import_job_id: string | null;
  user_id: string | null;
  request_id: string | null;
  correlation_id: string | null;
  details_json: Record<string, unknown> | null;
  created_at: Date;
}

// ── Pagination helper ─────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

