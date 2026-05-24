import { type ReactNode, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SectionCard, FormField, ForbiddenState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { parseApiError } from '@/lib/api-errors';
import { useHasPermission } from '@/hooks/use-has-permission';

interface StockActionLayoutProps {
  title: string;
  description: string;
  breadcrumbLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: () => void;
  children: ReactNode;
  successMovementId?: string;
  /** Permission key required to access this action. If set and user lacks it, shows forbidden state. */
  requiredPermission?: string;
}

export function StockActionLayout({
  title, description, breadcrumbLabel, isPending, error, onSubmit, children, successMovementId, requiredPermission,
}: StockActionLayoutProps) {
  const navigate = useNavigate();
  const permitted = useHasPermission(requiredPermission ?? '');
  const hasPermission = !requiredPermission || permitted;
  const apiErr = error ? parseApiError(error) : null;

  if (!hasPermission) {
    return <ForbiddenState />;
  }

  if (successMovementId) {
    return (
      <>
        <PageHeader title={title} breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: breadcrumbLabel }]} />
        <SectionCard title="Success">
          <p className="mb-4 text-sm">Operation completed. Movement ID: <code className="text-xs">{successMovementId}</code></p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate(`/inventory/movements/${successMovementId}`)}>View Movement</Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/inventory/stock')}>Back to Stock</Button>
          </div>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} description={description} breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: breadcrumbLabel }]} />
      <SectionCard>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }} className="space-y-4 max-w-lg">
          {children}
          {apiErr && <p className="text-sm text-destructive-foreground">{apiErr.message}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>{isPending ? 'Processing…' : 'Submit'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/stock')}>Cancel</Button>
          </div>
        </form>
      </SectionCard>
    </>
  );
}

