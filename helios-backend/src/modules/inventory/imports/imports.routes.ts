import { Router } from 'express';
import { listImportsHandler, getImportHandler, validateImportHandler, processImportHandler } from './imports.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { requireAAL } from '../../../middleware/require-aal.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { validateImportSchema, processImportSchema, importJobIdParamSchema } from './imports.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.STOCK_IMPORT), listImportsHandler);
router.get('/:importJobId', validate({ params: importJobIdParamSchema }), requirePermission(InventoryPermissions.STOCK_IMPORT), getImportHandler);
router.post('/validate', validate({ body: validateImportSchema }), requireAAL(2), requirePermission(InventoryPermissions.STOCK_IMPORT), validateImportHandler);
router.post('/process', validate({ body: processImportSchema }), requireAAL(2), requirePermission(InventoryPermissions.STOCK_IMPORT), processImportHandler);

export { router as importsRoutes };

