import { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await passwordApi.forgot({ email });
      setSubmitted(true);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Forgot Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              If an account exists with that email, a reset link has been sent.
            </div>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
            <FormField label="Email" htmlFor="forgot-email" required>
              <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </FormField>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

