import { Router } from 'express';
import { listRolesHandler, createRoleHandler, updateRoleHandler } from './roles.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../middleware/require-permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createRoleSchema, updateRoleSchema, roleIdParamSchema } from './iam.schemas.js';

const router = Router();

router.use(authenticate, requireActiveUser);

router.get('/', requirePermission('iam.roles.read'), listRolesHandler);
router.post('/', validate({ body: createRoleSchema }), requirePermission('iam.roles.create'), createRoleHandler);
router.patch('/:roleId', validate({ params: roleIdParamSchema, body: updateRoleSchema }), requirePermission('iam.roles.update'), updateRoleHandler);

export { router as rolesRoutes };

