import { Router } from 'express';
import { listWarehousesHandler, getWarehouseHandler, createWarehouseHandler, updateWarehouseHandler, archiveWarehouseHandler } from './warehouses.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createWarehouseSchema, updateWarehouseSchema, warehouseIdParamSchema } from './warehouses.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.WAREHOUSE_READ), listWarehousesHandler);
router.get('/:warehouseId', validate({ params: warehouseIdParamSchema }), requirePermission(InventoryPermissions.WAREHOUSE_READ), getWarehouseHandler);
router.post('/', validate({ body: createWarehouseSchema }), requirePermission(InventoryPermissions.WAREHOUSE_CREATE), createWarehouseHandler);
router.patch('/:warehouseId', validate({ params: warehouseIdParamSchema, body: updateWarehouseSchema }), requirePermission(InventoryPermissions.WAREHOUSE_UPDATE), updateWarehouseHandler);
router.delete('/:warehouseId', validate({ params: warehouseIdParamSchema }), requirePermission(InventoryPermissions.WAREHOUSE_UPDATE), archiveWarehouseHandler);

export { router as warehousesRoutes };

