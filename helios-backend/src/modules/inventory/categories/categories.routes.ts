import { Router } from 'express';
import { listCategoriesHandler, createCategoryHandler, updateCategoryHandler } from './categories.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createCategorySchema, updateCategorySchema, categoryIdParamSchema } from './categories.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.METADATA_READ), listCategoriesHandler);
router.post('/', validate({ body: createCategorySchema }), requirePermission(InventoryPermissions.METADATA_MANAGE), createCategoryHandler);
router.patch('/:categoryId', validate({ params: categoryIdParamSchema, body: updateCategorySchema }), requirePermission(InventoryPermissions.METADATA_MANAGE), updateCategoryHandler);

export { router as categoriesRoutes };

