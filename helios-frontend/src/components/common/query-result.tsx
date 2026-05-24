import type { ReactNode } from 'react';
import { isNotFound, isForbidden, isInsufficientAAL, parseApiError } from '@/lib/api-errors';
import { NotFoundState, ForbiddenState, InsufficientAALState, ErrorState } from './state-pages';
import { PageLoading } from '@/components/ui/loading';

interface QueryResultProps {
  isLoading: boolean;
  error: unknown;
  data: unknown;
  children: ReactNode;
  notFoundNoun?: string;
  onRetry?: () => void;
}

/**
 * Wraps a react-query result and renders the correct state page.
 * Usage:
 *   <QueryResult isLoading={q.isLoading} error={q.error} data={q.data}>
 *     <MyContent data={q.data!} />
 *   </QueryResult>
 */
export function QueryResult({ isLoading, error, data, children, notFoundNoun, onRetry }: QueryResultProps) {
  if (isLoading) return <PageLoading />;

  if (error) {
    if (isNotFound(error)) return <NotFoundState noun={notFoundNoun} />;
    if (isInsufficientAAL(error)) {
      const parsed = parseApiError(error);
      return <InsufficientAALState requiredLevel={parsed.requiredAAL} />;
    }
    if (isForbidden(error)) return <ForbiddenState />;
    const parsed = parseApiError(error);
    return <ErrorState message={parsed.message} onRetry={onRetry} />;
  }

  if (!data) return <PageLoading />;

  return <>{children}</>;
}

