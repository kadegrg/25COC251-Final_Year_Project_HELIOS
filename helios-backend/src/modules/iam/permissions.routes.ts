import { Router } from 'express';
import {
  listPermissionsHandler,
  createPermissionHandler,
  assignPermissionToRoleHandler,
  removePermissionFromRoleHandler,
} from './permissions.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../middleware/require-permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createPermissionSchema,
  assignPermissionToRoleSchema,
  rolePermissionParamSchema,
  roleIdParamSchema,
} from './iam.schemas.js';

const router = Router();

router.use(authenticate, requireActiveUser);

router.get('/', requirePermission('iam.permissions.read'), listPermissionsHandler);
router.post('/', validate({ body: createPermissionSchema }), requirePermission('iam.permissions.create'), createPermissionHandler);

// These are mounted at /roles/:roleId/permissions
export const rolePermissionsRouter = Router({ mergeParams: true });
rolePermissionsRouter.use(authenticate, requireActiveUser);
rolePermissionsRouter.post(
  '/',
  validate({ params: roleIdParamSchema, body: assignPermissionToRoleSchema }),
  requirePermission('iam.permissions.assign'),
  assignPermissionToRoleHandler,
);
rolePermissionsRouter.delete(
  '/:permissionId',
  validate({ params: rolePermissionParamSchema }),
  requirePermission('iam.permissions.assign'),
  removePermissionFromRoleHandler,
);

export { router as permissionsRoutes };

