import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/layout/auth-shell';
import { AuthForm } from '@/components/forms/auth-form';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function LoginPage() {
  useDocumentTitle('SecureShip | Login');

  return (
    <AuthShell
      eyebrow="Secure access"
      title="Sign in to your compliance workspace"
      description="Resume legal drafting, compliance audits, and report generation in a privacy-first dashboard."
    >
      <div className="space-y-6">
        <AuthForm mode="login" />
        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}