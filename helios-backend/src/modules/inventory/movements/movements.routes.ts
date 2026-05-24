import { Router } from 'express';
import { listMovementsHandler, getMovementHandler } from './movements.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.STOCK_READ), listMovementsHandler);
router.get('/:movementId', requirePermission(InventoryPermissions.STOCK_READ), getMovementHandler);

export { router as movementsRoutes };

