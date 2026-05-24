import { Router } from 'express';
import { listSkusHandler, getSkuHandler, createSkuHandler, updateSkuHandler, archiveSkuHandler, getSkuMetadataHandler, setSkuMetadataHandler } from './skus.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createSkuSchema, updateSkuSchema, skuIdParamSchema, skuMetadataSchema } from './skus.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.SKU_READ), listSkusHandler);
router.get('/:skuId', validate({ params: skuIdParamSchema }), requirePermission(InventoryPermissions.SKU_READ), getSkuHandler);
router.post('/', validate({ body: createSkuSchema }), requirePermission(InventoryPermissions.SKU_CREATE), createSkuHandler);
router.patch('/:skuId', validate({ params: skuIdParamSchema, body: updateSkuSchema }), requirePermission(InventoryPermissions.SKU_UPDATE), updateSkuHandler);
router.delete('/:skuId', validate({ params: skuIdParamSchema }), requirePermission(InventoryPermissions.SKU_ARCHIVE), archiveSkuHandler);

// Metadata
router.get('/:skuId/metadata', validate({ params: skuIdParamSchema }), requirePermission(InventoryPermissions.METADATA_READ), getSkuMetadataHandler);
router.put('/:skuId/metadata', validate({ params: skuIdParamSchema, body: skuMetadataSchema }), requirePermission(InventoryPermissions.METADATA_MANAGE), setSkuMetadataHandler);

export { router as skusRoutes };

