import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary';

const variantClasses: Record<StatusVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  destructive: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  secondary: 'bg-secondary text-secondary-foreground border-secondary',
};

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', variantClasses[variant], className)}>
      {label}
    </Badge>
  );
}

/** Convenience: map common status strings to variants */
const statusMap: Record<string, StatusVariant> = {
  active: 'success',
  enabled: 'success',
  completed: 'success',
  approved: 'success',
  pending: 'warning',
  draft: 'secondary',
  inactive: 'secondary',
  disabled: 'secondary',
  cancelled: 'destructive',
  rejected: 'destructive',
  failed: 'destructive',
  deleted: 'destructive',
  suspended: 'destructive',
};

export function AutoStatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = statusMap[status.toLowerCase()] ?? 'default';
  return <StatusBadge label={status} variant={variant} className={className} />;
}

