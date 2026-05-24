// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Main router (assembles all inventory sub-routes)
// ═══════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { sitesRoutes } from '../modules/inventory/sites/sites.routes.js';
import { warehousesRoutes } from '../modules/inventory/warehouses/warehouses.routes.js';
import { locationsRoutes } from '../modules/inventory/locations/locations.routes.js';
import { categoriesRoutes } from '../modules/inventory/categories/categories.routes.js';
import { attributesRoutes } from '../modules/inventory/attributes/attributes.routes.js';
import { skusRoutes } from '../modules/inventory/skus/skus.routes.js';
import { stockRoutes } from '../modules/inventory/stock/stock.routes.js';
import { adjustmentsRoutes } from '../modules/inventory/adjustments/adjustments.routes.js';
import { transfersRoutes } from '../modules/inventory/transfers/transfers.routes.js';
import { importsRoutes } from '../modules/inventory/imports/imports.routes.js';
import { reportsRoutes } from '../modules/inventory/reports/reports.routes.js';
import { movementsRoutes } from '../modules/inventory/movements/movements.routes.js';
import { listInventoryAuditEvents } from '../modules/inventory/audit/inventory-audit.repository.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../middleware/require-active-user.middleware.js';
import { requirePermission } from '../middleware/require-permission.middleware.js';
import { InventoryPermissions } from '../modules/inventory/inventory.permissions.js';
import { sendSuccess } from '../core/http/response.js';

const router = Router();

// ── Sub-domain routes ────────────────────────────────

router.use('/sites', sitesRoutes);
router.use('/warehouses', warehousesRoutes);
router.use('/locations', locationsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/attributes', attributesRoutes);
router.use('/skus', skusRoutes);
router.use('/stock', stockRoutes);
router.use('/adjustments', adjustmentsRoutes);
router.use('/transfers', transfersRoutes);
router.use('/imports', importsRoutes);
router.use('/reports', reportsRoutes);
router.use('/movements', movementsRoutes);

// ── Audit events endpoint ────────────────────────────

router.get(
  '/audit-events',
  authenticate,
  requireActiveUser,
  requirePermission(InventoryPermissions.AUDIT_READ),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const { rows, total } = await listInventoryAuditEvents({
        siteId: req.query.siteId as string,
        eventType: req.query.eventType as string,
        userId: req.query.userId as string,
        skuId: req.query.skuId as string,
        transferId: req.query.transferId as string,
        adjustmentId: req.query.adjustmentId as string,
        limit,
        offset,
      });
      sendSuccess(res, rows, 200, { total, limit, offset });
    } catch (err) {
      next(err);
    }
  },
);

export { router as inventoryRouter };

