// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Permission keys & AAL expectations
// ═══════════════════════════════════════════════════════════════════════

export const InventoryPermissions = {
  // Sites
  SITE_READ: 'inventory.site.read',
  SITE_CREATE: 'inventory.site.create',
  SITE_UPDATE: 'inventory.site.update',
  SITE_ARCHIVE: 'inventory.site.archive',

  // Warehouses
  WAREHOUSE_READ: 'inventory.warehouse.read',
  WAREHOUSE_CREATE: 'inventory.warehouse.create',
  WAREHOUSE_UPDATE: 'inventory.warehouse.update',

  // Locations
  LOCATION_READ: 'inventory.location.read',
  LOCATION_CREATE: 'inventory.location.create',
  LOCATION_UPDATE: 'inventory.location.update',
  LOCATION_ARCHIVE: 'inventory.location.archive',

  // SKUs
  SKU_READ: 'inventory.sku.read',
  SKU_CREATE: 'inventory.sku.create',
  SKU_UPDATE: 'inventory.sku.update',
  SKU_ARCHIVE: 'inventory.sku.archive',

  // Metadata
  METADATA_READ: 'inventory.metadata.read',
  METADATA_MANAGE: 'inventory.metadata.manage',

  // Stock operations
  STOCK_READ: 'inventory.stock.read',
  STOCK_RECEIVE: 'inventory.stock.receive',
  STOCK_MOVE: 'inventory.stock.move',
  STOCK_RESERVE: 'inventory.stock.reserve',
  STOCK_UNRESERVE: 'inventory.stock.unreserve',
  STOCK_ADJUST: 'inventory.stock.adjust',

  // Transfers
  TRANSFER_REQUEST: 'inventory.stock.transfer.request',
  TRANSFER_APPROVE: 'inventory.stock.transfer.approve',
  TRANSFER_DISPATCH: 'inventory.stock.transfer.dispatch',
  TRANSFER_RECEIVE: 'inventory.stock.transfer.receive',
  TRANSFER_RECONCILE: 'inventory.stock.transfer.reconcile',

  // Imports
  STOCK_IMPORT: 'inventory.stock.import',

  // Reporting
  REPORT_READ: 'inventory.stock.report.read',

  // Audit
  AUDIT_READ: 'inventory.stock.audit.read',
} as const;

export type InventoryPermissionKey = (typeof InventoryPermissions)[keyof typeof InventoryPermissions];

/**
 * Permission definitions for seeding into the iam_permissions table.
 * Each entry specifies display name, description, and minimum AAL.
 */
export const INVENTORY_PERMISSION_SEEDS: Array<{
  key: string;
  displayName: string;
  description: string;
  aal: number;
}> = [
  // Sites
  { key: InventoryPermissions.SITE_READ, displayName: 'View inventory sites', description: 'Read inventory site data', aal: 1 },
  { key: InventoryPermissions.SITE_CREATE, displayName: 'Create inventory sites', description: 'Create new inventory sites', aal: 2 },
  { key: InventoryPermissions.SITE_UPDATE, displayName: 'Update inventory sites', description: 'Update inventory site details', aal: 2 },
  { key: InventoryPermissions.SITE_ARCHIVE, displayName: 'Archive inventory sites', description: 'Decommission/archive sites', aal: 2 },

  // Warehouses
  { key: InventoryPermissions.WAREHOUSE_READ, displayName: 'View warehouses', description: 'Read warehouse data', aal: 1 },
  { key: InventoryPermissions.WAREHOUSE_CREATE, displayName: 'Create warehouses', description: 'Create new warehouses', aal: 2 },
  { key: InventoryPermissions.WAREHOUSE_UPDATE, displayName: 'Update warehouses', description: 'Update warehouse details', aal: 2 },

  // Locations
  { key: InventoryPermissions.LOCATION_READ, displayName: 'View locations', description: 'Read location data', aal: 1 },
  { key: InventoryPermissions.LOCATION_CREATE, displayName: 'Create locations', description: 'Create new locations', aal: 1 },
  { key: InventoryPermissions.LOCATION_UPDATE, displayName: 'Update locations', description: 'Update location details', aal: 1 },
  { key: InventoryPermissions.LOCATION_ARCHIVE, displayName: 'Archive locations', description: 'Archive/deactivate locations', aal: 2 },

  // SKUs
  { key: InventoryPermissions.SKU_READ, displayName: 'View SKUs', description: 'Read SKU product data', aal: 1 },
  { key: InventoryPermissions.SKU_CREATE, displayName: 'Create SKUs', description: 'Create new SKU records', aal: 1 },
  { key: InventoryPermissions.SKU_UPDATE, displayName: 'Update SKUs', description: 'Update SKU details', aal: 1 },
  { key: InventoryPermissions.SKU_ARCHIVE, displayName: 'Archive SKUs', description: 'Discontinue/archive SKUs', aal: 2 },

  // Metadata
  { key: InventoryPermissions.METADATA_READ, displayName: 'View metadata', description: 'Read SKU metadata attributes', aal: 1 },
  { key: InventoryPermissions.METADATA_MANAGE, displayName: 'Manage metadata', description: 'Manage attribute definitions and values', aal: 2 },

  // Stock
  { key: InventoryPermissions.STOCK_READ, displayName: 'View stock', description: 'Read stock balances and items', aal: 1 },
  { key: InventoryPermissions.STOCK_RECEIVE, displayName: 'Receive stock', description: 'Receive goods into inventory', aal: 1 },
  { key: InventoryPermissions.STOCK_MOVE, displayName: 'Move stock', description: 'Internal stock movements', aal: 1 },
  { key: InventoryPermissions.STOCK_RESERVE, displayName: 'Reserve stock', description: 'Reserve stock for orders', aal: 1 },
  { key: InventoryPermissions.STOCK_UNRESERVE, displayName: 'Unreserve stock', description: 'Release stock reservations', aal: 1 },
  { key: InventoryPermissions.STOCK_ADJUST, displayName: 'Adjust stock', description: 'Create and post stock adjustments', aal: 2 },

  // Transfers
  { key: InventoryPermissions.TRANSFER_REQUEST, displayName: 'Request transfer', description: 'Create inter-site transfer requests', aal: 1 },
  { key: InventoryPermissions.TRANSFER_APPROVE, displayName: 'Approve transfer', description: 'Approve inter-site transfers', aal: 2 },
  { key: InventoryPermissions.TRANSFER_DISPATCH, displayName: 'Dispatch transfer', description: 'Dispatch inter-site transfers', aal: 1 },
  { key: InventoryPermissions.TRANSFER_RECEIVE, displayName: 'Receive transfer', description: 'Receive inter-site transfers', aal: 1 },
  { key: InventoryPermissions.TRANSFER_RECONCILE, displayName: 'Reconcile transfer', description: 'Reconcile transfer discrepancies', aal: 2 },

  // Imports
  { key: InventoryPermissions.STOCK_IMPORT, displayName: 'Import stock', description: 'Bulk import stock/SKU data', aal: 2 },

  // Reports
  { key: InventoryPermissions.REPORT_READ, displayName: 'View reports', description: 'Access inventory reports', aal: 1 },

  // Audit
  { key: InventoryPermissions.AUDIT_READ, displayName: 'View inventory audit', description: 'Read inventory audit events', aal: 2 },
];

/**
 * Default inventory role definitions for seeding.
 */
export const INVENTORY_ROLE_SEEDS = [
  {
    name: 'inventory_admin',
    displayName: 'Inventory Administrator',
    description: 'Full access to all inventory functions.',
    permissions: Object.values(InventoryPermissions),
  },
  {
    name: 'inventory_manager',
    displayName: 'Inventory Manager',
    description: 'Manages stock, transfers, adjustments, and imports.',
    permissions: [
      InventoryPermissions.SITE_READ,
      InventoryPermissions.WAREHOUSE_READ,
      InventoryPermissions.LOCATION_READ,
      InventoryPermissions.LOCATION_CREATE,
      InventoryPermissions.LOCATION_UPDATE,
      InventoryPermissions.SKU_READ,
      InventoryPermissions.SKU_CREATE,
      InventoryPermissions.SKU_UPDATE,
      InventoryPermissions.METADATA_READ,
      InventoryPermissions.METADATA_MANAGE,
      InventoryPermissions.STOCK_READ,
      InventoryPermissions.STOCK_RECEIVE,
      InventoryPermissions.STOCK_MOVE,
      InventoryPermissions.STOCK_RESERVE,
      InventoryPermissions.STOCK_UNRESERVE,
      InventoryPermissions.STOCK_ADJUST,
      InventoryPermissions.TRANSFER_REQUEST,
      InventoryPermissions.TRANSFER_APPROVE,
      InventoryPermissions.TRANSFER_DISPATCH,
      InventoryPermissions.TRANSFER_RECEIVE,
      InventoryPermissions.TRANSFER_RECONCILE,
      InventoryPermissions.STOCK_IMPORT,
      InventoryPermissions.REPORT_READ,
      InventoryPermissions.AUDIT_READ,
    ],
  },
  {
    name: 'inventory_operator',
    displayName: 'Inventory Operator',
    description: 'Day-to-day warehouse operations: receive, move, pick, pack.',
    permissions: [
      InventoryPermissions.SITE_READ,
      InventoryPermissions.WAREHOUSE_READ,
      InventoryPermissions.LOCATION_READ,
      InventoryPermissions.SKU_READ,
      InventoryPermissions.METADATA_READ,
      InventoryPermissions.STOCK_READ,
      InventoryPermissions.STOCK_RECEIVE,
      InventoryPermissions.STOCK_MOVE,
      InventoryPermissions.STOCK_RESERVE,
      InventoryPermissions.STOCK_UNRESERVE,
      InventoryPermissions.TRANSFER_DISPATCH,
      InventoryPermissions.TRANSFER_RECEIVE,
      InventoryPermissions.REPORT_READ,
    ],
  },
  {
    name: 'inventory_viewer',
    displayName: 'Inventory Viewer',
    description: 'Read-only access to inventory data and reports.',
    permissions: [
      InventoryPermissions.SITE_READ,
      InventoryPermissions.WAREHOUSE_READ,
      InventoryPermissions.LOCATION_READ,
      InventoryPermissions.SKU_READ,
      InventoryPermissions.METADATA_READ,
      InventoryPermissions.STOCK_READ,
      InventoryPermissions.REPORT_READ,
    ],
  },
];

