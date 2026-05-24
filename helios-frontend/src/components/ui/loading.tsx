import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-6 w-6 animate-spin text-muted-foreground ${className}`} />;
}

export function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}

