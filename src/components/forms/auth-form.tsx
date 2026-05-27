import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters')
});

type AuthValues = z.infer<typeof authSchema>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  const defaultValues = useMemo<AuthValues>(() => ({ email: '', password: '' }), []);

  const {
    register: bind,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mode === 'login') {
        await login(values.email, values.password);
      } else {
        await register(values.email, values.password);
      }

      navigate('/dashboard');
    } catch {
      return;
    }
  });

  return (
    <Card className="bg-slate-950/75">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Sign in to SecureShip' : 'Create your SecureShip account'}</CardTitle>
        <CardDescription>Access dashboards, drafts, audits, and reports from one compliance workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="name@company.com" {...bind('email')} />
            {errors.email ? <p className="text-sm text-red-400">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" placeholder="Minimum 8 characters" {...bind('password')} />
            {errors.password ? <p className="text-sm text-red-400">{errors.password.message}</p> : null}
          </div>
          {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}
          <Button type="submit" className="w-full" loading={status === 'loading'}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}