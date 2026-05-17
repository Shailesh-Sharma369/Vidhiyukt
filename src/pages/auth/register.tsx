import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/layout/auth-shell';
import { AuthForm } from '@/components/forms/auth-form';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function RegisterPage() {
  useDocumentTitle('SecureShip | Register');

  return (
    <AuthShell
      eyebrow="Create workspace"
      title="Launch SecureShip for your team"
      description="Set up your secure compliance workspace and start generating legal documents and audit scorecards."
    >
      <div className="space-y-6">
        <AuthForm mode="register" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}