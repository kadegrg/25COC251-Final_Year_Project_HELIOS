import { Router } from 'express';
import { listSessionsHandler, revokeSessionHandler } from './sessions.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';

const router = Router();

router.get('/', authenticate, requireActiveUser, listSessionsHandler);
router.delete('/:sessionId', authenticate, requireActiveUser, revokeSessionHandler);

export { router as sessionsRoutes };

