import { Router } from 'express';
import { lowStockHandler, negativeStockHandler, discrepanciesReportHandler, reservedVsAvailableHandler, recentAdjustmentsHandler, cycleCountVarianceHandler } from './reports.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/low-stock', requirePermission(InventoryPermissions.REPORT_READ), lowStockHandler);
router.get('/negative-stock', requirePermission(InventoryPermissions.REPORT_READ), negativeStockHandler);
router.get('/discrepancies', requirePermission(InventoryPermissions.REPORT_READ), discrepanciesReportHandler);
router.get('/reserved-vs-available', requirePermission(InventoryPermissions.REPORT_READ), reservedVsAvailableHandler);
router.get('/recent-adjustments', requirePermission(InventoryPermissions.REPORT_READ), recentAdjustmentsHandler);
router.get('/cycle-count-variance', requirePermission(InventoryPermissions.REPORT_READ), cycleCountVarianceHandler);

export { router as reportsRoutes };

