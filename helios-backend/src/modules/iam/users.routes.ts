import { Router } from 'express';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  assignRoleToUserHandler,
  removeRoleFromUserHandler,
} from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../middleware/require-permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  assignRoleToUserSchema,
  removeRoleAssignmentParamSchema,
} from './iam.schemas.js';

const router = Router();

router.use(authenticate, requireActiveUser);

router.get('/', requirePermission('iam.users.read'), listUsersHandler);
router.get('/:userId', validate({ params: userIdParamSchema }), requirePermission('iam.users.read'), getUserHandler);
router.post('/', validate({ body: createUserSchema }), requirePermission('iam.users.create'), createUserHandler);
router.patch('/:userId', validate({ params: userIdParamSchema, body: updateUserSchema }), requirePermission('iam.users.update'), updateUserHandler);

router.post(
  '/:userId/roles',
  validate({ params: userIdParamSchema, body: assignRoleToUserSchema }),
  requirePermission('iam.roles.assign'),
  assignRoleToUserHandler,
);

router.delete(
  '/:userId/roles/:assignmentId',
  validate({ params: removeRoleAssignmentParamSchema }),
  requirePermission('iam.roles.assign'),
  removeRoleFromUserHandler,
);

export { router as usersRoutes };

