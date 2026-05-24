import { z } from 'zod';

// ── Users ──────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  displayName: z.string().max(100).optional(),
  password: z.string().min(10).max(128),
  status: z.enum(['pending', 'active']).optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  status: z.enum(['active', 'locked', 'disabled']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const assignRoleToUserSchema = z.object({
  roleId: z.string().uuid(),
  scopeType: z.enum(['GLOBAL', 'SITE', 'LOCATION', 'OWN']).default('GLOBAL'),
  scopeValue: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const removeRoleAssignmentParamSchema = z.object({
  userId: z.string().uuid(),
  assignmentId: z.string().uuid(),
});

// ── Roles ──────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  displayName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

export const updateRoleSchema = z.object({
  displayName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

export const roleIdParamSchema = z.object({
  roleId: z.string().uuid(),
});

// ── Permissions ────────────────────────────────────────

export const createPermissionSchema = z.object({
  key: z
    .string()
    .regex(
      /^[a-z]+\.[a-z_]+\.[a-z]+$/,
      'Permission key must follow service.resource.action format',
    ),
  displayName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  defaultRequiredAal: z.number().int().min(1).max(3).default(1),
});

export const assignPermissionToRoleSchema = z.object({
  permissionId: z.string().uuid(),
});

export const rolePermissionParamSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

// ── Pagination ─────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleToUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;


