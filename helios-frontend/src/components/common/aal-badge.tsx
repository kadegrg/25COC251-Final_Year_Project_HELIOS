import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const aalColors: Record<number, string> = {
  1: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400',
  2: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400',
  3: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400',
};

export function AALBadge({ level, className }: { level: number; className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 text-xs font-medium', aalColors[level] ?? '', className)}>
      <ShieldCheck className="h-3 w-3" />
      AAL {level}
    </Badge>
  );
}

