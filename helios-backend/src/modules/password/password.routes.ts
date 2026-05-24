import { Router } from 'express';
import { changePasswordHandler, forgotPasswordHandler, resetPasswordHandler } from './password.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './password.schemas.js';

const router = Router();

router.post('/change', authenticate, requireActiveUser, validate({ body: changePasswordSchema }), changePasswordHandler);
router.post('/forgot', authRateLimiter, validate({ body: forgotPasswordSchema }), forgotPasswordHandler);
router.post('/reset', authRateLimiter, validate({ body: resetPasswordSchema }), resetPasswordHandler);

export { router as passwordRoutes };

