import { useAuthStore } from '@/stores/auth.store';

/**
 * Returns a boolean indicating whether the current user has the given permission.
 * Convenience wrapper around `useAuthStore` for use in components that need to
 * conditionally render actions based on permissions.
 *
 * @example
 * const canCreate = useHasPermission('inventory.sku.create');
 * {canCreate && <Button>Create SKU</Button>}
 */
export function useHasPermission(permissionKey: string): boolean {
  return useAuthStore((s) => s.permissions.some((p) => p.key === permissionKey));
}

/**
 * Returns an object whose values are booleans for each provided permission key.
 *
 * @example
 * const perms = useHasPermissions({
 *   canCreate: 'inventory.sku.create',
 *   canUpdate: 'inventory.sku.update',
 *   canArchive: 'inventory.sku.archive',
 * });
 * {perms.canCreate && <Button>Create</Button>}
 */
export function useHasPermissions<T extends Record<string, string>>(
  keys: T,
): Record<keyof T, boolean> {
  const permissions = useAuthStore((s) => s.permissions);
  const permSet = new Set(permissions.map((p) => p.key));
  const result = {} as Record<keyof T, boolean>;
  for (const k in keys) {
    result[k] = permSet.has(keys[k]);
  }
  return result;
}

