import { api } from './api-client';
import type {
  UserSummary,
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionRecord,
  CreatePermissionRequest,
  AssignRoleRequest,
  RoleAssignment,
  AssignPermissionToRoleRequest,
  PaginatedResponse,
  SingleResponse,
  ListResponse,
} from '@/types/iam.types';

const BASE = '/v1/iam';

// --- Users ---

export async function listUsers(page = 1, limit = 20) {
  const res = await api.get<PaginatedResponse<UserSummary>>(`${BASE}/users`, {
    params: { page, limit },
  });
  return res.data;
}

export async function getUser(userId: string) {
  const res = await api.get<SingleResponse<UserDetail>>(`${BASE}/users/${userId}`);
  return res.data.data;
}

export async function createUser(body: CreateUserRequest) {
  const res = await api.post<SingleResponse<UserSummary>>(`${BASE}/users`, body);
  return res.data.data;
}

export async function updateUser(userId: string, body: UpdateUserRequest) {
  const res = await api.patch<SingleResponse<UserDetail>>(`${BASE}/users/${userId}`, body);
  return res.data.data;
}

// --- User Role Assignments ---

export async function assignRoleToUser(userId: string, body: AssignRoleRequest) {
  const res = await api.post<SingleResponse<RoleAssignment>>(`${BASE}/users/${userId}/roles`, body);
  return res.data.data;
}

export async function removeRoleFromUser(userId: string, assignmentId: string) {
  await api.delete(`${BASE}/users/${userId}/roles/${assignmentId}`);
}

// --- Roles ---

export async function listRoles() {
  const res = await api.get<ListResponse<Role>>(`${BASE}/roles`);
  return res.data.data;
}

export async function createRole(body: CreateRoleRequest) {
  const res = await api.post<SingleResponse<Role>>(`${BASE}/roles`, body);
  return res.data.data;
}

export async function updateRole(roleId: string, body: UpdateRoleRequest) {
  const res = await api.patch<SingleResponse<Role>>(`${BASE}/roles/${roleId}`, body);
  return res.data.data;
}

// --- Permissions ---

export async function listPermissions() {
  const res = await api.get<ListResponse<PermissionRecord>>(`${BASE}/permissions`);
  return res.data.data;
}

export async function createPermission(body: CreatePermissionRequest) {
  const res = await api.post<SingleResponse<PermissionRecord>>(`${BASE}/permissions`, body);
  return res.data.data;
}

// --- Role-Permission Assignments ---

export async function assignPermissionToRole(roleId: string, body: AssignPermissionToRoleRequest) {
  const res = await api.post(`${BASE}/roles/${roleId}/permissions`, body);
  return res.data.data;
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  await api.delete(`${BASE}/roles/${roleId}/permissions/${permissionId}`);
}

