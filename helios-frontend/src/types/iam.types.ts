/** IAM/RBAC types */

// --- Users ---

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  status: string;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  displayName?: string;
  password: string;
  status?: 'pending' | 'active';
}

export interface UpdateUserRequest {
  displayName?: string;
  status?: 'active' | 'locked' | 'disabled';
  metadata?: Record<string, unknown>;
}

// --- Roles ---

export interface Role {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_system: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  displayName?: string;
  description?: string;
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
}

// --- Permissions ---

export interface PermissionRecord {
  id: string;
  key: string;
  display_name: string | null;
  description: string | null;
  default_required_aal: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreatePermissionRequest {
  key: string;
  displayName?: string;
  description?: string;
  defaultRequiredAal?: number;
}

// --- Role Assignments ---

export type ScopeType = 'GLOBAL' | 'SITE' | 'LOCATION' | 'OWN';

export interface AssignRoleRequest {
  roleId: string;
  scopeType?: ScopeType;
  scopeValue?: string;
  expiresAt?: string;
}

export interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  scope_type: string;
  scope_value: string | null;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
}

// --- Role-Permission Assignments ---

export interface AssignPermissionToRoleRequest {
  permissionId: string;
}

// --- Pagination ---

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { pagination: PaginationMeta };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
}

