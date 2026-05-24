import { withTransaction } from '../../db/transaction.js';
import { hashPassword } from '../../core/security/password.service.js';
import { ConflictError, NotFoundError } from '../../core/errors/app-error.js';
import * as usersRepo from './users.repository.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import type { RequestContext } from '../../types/request-context.js';
import type { CreateUserInput, UpdateUserInput } from './iam.schemas.js';

export async function createUser(input: CreateUserInput, ctx: RequestContext) {
  // Check for duplicates
  const existingEmail = await usersRepo.findUserByEmail(input.email);
  if (existingEmail) throw new ConflictError('Email already registered');

  const existingUsername = await usersRepo.findUserByUsername(input.username);
  if (existingUsername) throw new ConflictError('Username already taken');

  return withTransaction(async (client) => {
    const user = await usersRepo.createUser(
      {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        status: input.status || 'active',
      },
      client,
    );

    const hash = await hashPassword(input.password);
    await usersRepo.createPasswordCredential(user.id, hash, client);

    await emitEvent(BuiltInHooks.USER_CREATED, { userId: user.id });
    await logAuditEvent(ctx, 'iam.user.created', 'success', {
      targetType: 'user',
      targetId: user.id,
    }, client);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      status: user.status,
      createdAt: user.created_at,
    };
  });
}

export async function getUser(userId: string) {
  const user = await usersRepo.findUserById(userId);
  if (!user || user.status === 'deleted') throw new NotFoundError('User');
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    status: user.status,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function listUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const { users, total } = await usersRepo.listUsers({ limit, offset });
  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.display_name,
      status: u.status,
      createdAt: u.created_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateUser(userId: string, input: UpdateUserInput, ctx: RequestContext) {
  const user = await usersRepo.updateUser(userId, {
    displayName: input.displayName,
    status: input.status,
    metadata: input.metadata,
  });
  if (!user) throw new NotFoundError('User');

  await emitEvent(BuiltInHooks.USER_UPDATED, { userId });
  await logAuditEvent(ctx, 'iam.user.updated', 'success', {
    targetType: 'user', targetId: userId,
    metadata: input,
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    status: user.status,
    updatedAt: user.updated_at,
  };
}

