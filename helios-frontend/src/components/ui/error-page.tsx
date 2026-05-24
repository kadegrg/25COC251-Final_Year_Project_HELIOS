import { AlertTriangle, ShieldX, FileQuestion, ServerCrash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
}

const defaults: Record<number, { title: string; message: string; icon: typeof AlertTriangle }> = {
  401: { title: 'Unauthorised', message: 'Please log in to continue.', icon: ShieldX },
  403: { title: 'Forbidden', message: 'You do not have permission to access this page.', icon: ShieldX },
  404: { title: 'Not Found', message: 'The page you are looking for does not exist.', icon: FileQuestion },
  500: { title: 'Server Error', message: 'Something went wrong. Please try again later.', icon: ServerCrash },
};

export function ErrorPage({ status = 500, title, message }: ErrorPageProps) {
  const navigate = useNavigate();
  const d = defaults[status] ?? defaults[500];
  const Icon = d.icon;

  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <Icon className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">{title ?? d.title}</h1>
      <p className="mt-2 text-muted-foreground">{message ?? d.message}</p>
      <button
        onClick={() => navigate(-1)}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        Go Back
      </button>
    </div>
  );
}

