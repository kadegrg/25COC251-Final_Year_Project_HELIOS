import { ShieldAlert, ShieldX, FileQuestion, ServerCrash, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface StatePageProps {
  title: string;
  message: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}

function StatePage({ title, message, icon, action }: StatePageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function NotFoundState({ noun = 'resource' }: { noun?: string }) {
  const navigate = useNavigate();
  return (
    <StatePage
      title="Not Found"
      message={`The ${noun} you are looking for does not exist or has been removed.`}
      icon={<FileQuestion className="h-16 w-16" />}
      action={<Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>}
    />
  );
}

export function ForbiddenState() {
  const navigate = useNavigate();
  return (
    <StatePage
      title="Forbidden"
      message="You do not have permission to access this resource."
      icon={<Ban className="h-16 w-16" />}
      action={<Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>}
    />
  );
}

export function InsufficientAALState({ requiredLevel }: { requiredLevel?: number }) {
  const navigate = useNavigate();
  return (
    <StatePage
      title="Additional Authentication Required"
      message={`This action requires a higher authentication assurance level${requiredLevel ? ` (AAL ${requiredLevel})` : ''}.`}
      icon={<ShieldAlert className="h-16 w-16" />}
      action={
        <Button onClick={() => navigate(`/step-up${requiredLevel ? `?required=${requiredLevel}` : ''}`)}>
          Authenticate
        </Button>
      }
    />
  );
}

export function ErrorState({ title, message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <StatePage
      title={title ?? 'Something went wrong'}
      message={message ?? 'An unexpected error occurred. Please try again.'}
      icon={<ServerCrash className="h-16 w-16" />}
      action={onRetry ? <Button variant="outline" onClick={onRetry}>Retry</Button> : undefined}
    />
  );
}

