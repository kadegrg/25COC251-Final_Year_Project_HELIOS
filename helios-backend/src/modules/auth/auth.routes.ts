import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler, logoutAllHandler, getMeHandler, stepUpHandler } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { loginSchema, refreshSchema, stepUpSchema } from './auth.schemas.js';

const router = Router();

router.post('/login', authRateLimiter, validate({ body: loginSchema }), loginHandler);
router.post('/refresh', authRateLimiter, validate({ body: refreshSchema }), refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.post('/logout-all', authenticate, requireActiveUser, logoutAllHandler);
router.get('/me', authenticate, requireActiveUser, getMeHandler);
router.post('/step-up', authenticate, requireActiveUser, validate({ body: stepUpSchema }), stepUpHandler);

export { router as authRoutes };

