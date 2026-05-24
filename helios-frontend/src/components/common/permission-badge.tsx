import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PermissionBadge({ permission, className }: { permission: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 text-xs font-mono', className)}>
      <Shield className="h-3 w-3" />
      {permission}
    </Badge>
  );
}

