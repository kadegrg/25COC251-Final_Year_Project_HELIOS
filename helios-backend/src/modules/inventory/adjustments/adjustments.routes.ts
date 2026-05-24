import { Router } from 'express';
import { listAdjustmentsHandler, getAdjustmentHandler, createAdjustmentHandler, approveAdjustmentHandler, postAdjustmentHandler, cancelAdjustmentHandler } from './adjustments.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { requireAAL } from '../../../middleware/require-aal.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createAdjustmentSchema, adjustmentIdParamSchema } from './adjustments.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.STOCK_ADJUST), listAdjustmentsHandler);
router.get('/:adjustmentId', validate({ params: adjustmentIdParamSchema }), requirePermission(InventoryPermissions.STOCK_ADJUST), getAdjustmentHandler);
router.post('/', validate({ body: createAdjustmentSchema }), requirePermission(InventoryPermissions.STOCK_ADJUST), createAdjustmentHandler);
router.post('/:adjustmentId/approve', validate({ params: adjustmentIdParamSchema }), requireAAL(2), requirePermission(InventoryPermissions.STOCK_ADJUST), approveAdjustmentHandler);
router.post('/:adjustmentId/post', validate({ params: adjustmentIdParamSchema }), requireAAL(2), requirePermission(InventoryPermissions.STOCK_ADJUST), postAdjustmentHandler);
router.post('/:adjustmentId/cancel', validate({ params: adjustmentIdParamSchema }), requirePermission(InventoryPermissions.STOCK_ADJUST), cancelAdjustmentHandler);

export { router as adjustmentsRoutes };

