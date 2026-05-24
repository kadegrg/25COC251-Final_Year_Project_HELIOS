// Sessions repository functionality is implemented in auth.repository.ts
// This file re-exports for module consistency and future extension.

export {
  createSession,
  findSessionById,
  findSessionsByUserId,
  updateSessionAAL,
  revokeSession,
  revokeAllUserSessions,
} from '../auth/auth.repository.js';

