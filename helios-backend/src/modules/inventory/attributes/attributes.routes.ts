import { Router } from 'express';
import { listAttributesHandler, createAttributeHandler, updateAttributeHandler } from './attributes.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createAttributeSchema, updateAttributeSchema, attributeIdParamSchema } from './attributes.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.METADATA_READ), listAttributesHandler);
router.post('/', validate({ body: createAttributeSchema }), requirePermission(InventoryPermissions.METADATA_MANAGE), createAttributeHandler);
router.patch('/:attributeId', validate({ params: attributeIdParamSchema, body: updateAttributeSchema }), requirePermission(InventoryPermissions.METADATA_MANAGE), updateAttributeHandler);

export { router as attributesRoutes };

