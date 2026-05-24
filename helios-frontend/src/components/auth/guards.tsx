import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import type { ReactNode } from 'react';

/** Redirects to /login if not authenticated */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** Redirects to /step-up if current AAL < required */
export function RequireAAL({ level, children }: { level: number; children: ReactNode }) {
  const aal = useAuthStore((s) => s.aal);

  if (aal < level) {
    return <Navigate to={`/step-up?required=${level}`} replace />;
  }

  return <>{children}</>;
}

/** Renders children only if user has the specified permission (UI-side hint) */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
