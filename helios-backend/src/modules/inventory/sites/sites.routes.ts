import { Router } from 'express';
import { listSitesHandler, getSiteHandler, createSiteHandler, updateSiteHandler, archiveSiteHandler } from './sites.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createSiteSchema, updateSiteSchema, siteIdParamSchema } from './sites.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.SITE_READ), listSitesHandler);
router.get('/:siteId', validate({ params: siteIdParamSchema }), requirePermission(InventoryPermissions.SITE_READ), getSiteHandler);
router.post('/', validate({ body: createSiteSchema }), requirePermission(InventoryPermissions.SITE_CREATE), createSiteHandler);
router.patch('/:siteId', validate({ params: siteIdParamSchema, body: updateSiteSchema }), requirePermission(InventoryPermissions.SITE_UPDATE), updateSiteHandler);
router.delete('/:siteId', validate({ params: siteIdParamSchema }), requirePermission(InventoryPermissions.SITE_ARCHIVE), archiveSiteHandler);

export { router as sitesRoutes };

