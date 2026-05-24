import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as iamApi from '@/lib/iam-api';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  AssignRoleRequest,
  AssignPermissionToRoleRequest,
} from '@/types/iam.types';

// --- Keys ---

export const iamKeys = {
  users: ['iam', 'users'] as const,
  userList: (page: number, limit: number) => ['iam', 'users', 'list', { page, limit }] as const,
  userDetail: (id: string) => ['iam', 'users', id] as const,
  roles: ['iam', 'roles'] as const,
  permissions: ['iam', 'permissions'] as const,
};

// --- Users ---

export function useUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: iamKeys.userList(page, limit),
    queryFn: () => iamApi.listUsers(page, limit),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: iamKeys.userDetail(userId),
    queryFn: () => iamApi.getUser(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserRequest) => iamApi.createUser(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.users }),
  });
}

export function useUpdateUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateUserRequest) => iamApi.updateUser(userId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: iamKeys.userDetail(userId) });
      qc.invalidateQueries({ queryKey: iamKeys.users });
    },
  });
}

// --- User Role Assignments ---

export function useAssignRoleToUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignRoleRequest) => iamApi.assignRoleToUser(userId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.userDetail(userId) }),
  });
}

export function useRemoveRoleFromUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => iamApi.removeRoleFromUser(userId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.userDetail(userId) }),
  });
}

// --- Roles ---

export function useRoles() {
  return useQuery({
    queryKey: iamKeys.roles,
    queryFn: iamApi.listRoles,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRoleRequest) => iamApi.createRole(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.roles }),
  });
}

export function useUpdateRole(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateRoleRequest) => iamApi.updateRole(roleId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.roles }),
  });
}

// --- Permissions ---

export function usePermissions() {
  return useQuery({
    queryKey: iamKeys.permissions,
    queryFn: iamApi.listPermissions,
  });
}

export function useCreatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePermissionRequest) => iamApi.createPermission(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.permissions }),
  });
}

// --- Role-Permission Assignments ---

export function useAssignPermissionToRole(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignPermissionToRoleRequest) => iamApi.assignPermissionToRole(roleId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.roles }),
  });
}

export function useRemovePermissionFromRole(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissionId: string) => iamApi.removePermissionFromRole(roleId, permissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: iamKeys.roles }),
  });
}

