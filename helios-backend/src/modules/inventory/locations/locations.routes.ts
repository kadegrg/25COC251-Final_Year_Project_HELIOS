import { Router } from 'express';
import { listLocationsHandler, getLocationHandler, getLocationTreeHandler, createLocationHandler, updateLocationHandler, archiveLocationHandler } from './locations.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createLocationSchema, updateLocationSchema, locationIdParamSchema, locationTreeQuerySchema } from './locations.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/tree', validate({ query: locationTreeQuerySchema }), requirePermission(InventoryPermissions.LOCATION_READ), getLocationTreeHandler);
router.get('/', requirePermission(InventoryPermissions.LOCATION_READ), listLocationsHandler);
router.get('/:locationId', validate({ params: locationIdParamSchema }), requirePermission(InventoryPermissions.LOCATION_READ), getLocationHandler);
router.post('/', validate({ body: createLocationSchema }), requirePermission(InventoryPermissions.LOCATION_CREATE), createLocationHandler);
router.patch('/:locationId', validate({ params: locationIdParamSchema, body: updateLocationSchema }), requirePermission(InventoryPermissions.LOCATION_UPDATE), updateLocationHandler);
router.delete('/:locationId', validate({ params: locationIdParamSchema }), requirePermission(InventoryPermissions.LOCATION_ARCHIVE), archiveLocationHandler);

export { router as locationsRoutes };

