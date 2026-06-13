import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PublicShell } from '@/components/layout/public-shell';
import { LandingPage } from '@/pages/landing';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { DashboardPage } from '@/pages/dashboard';
import { GeneratorPage } from '@/pages/generator';
import { AuditPage } from '@/pages/audit';
import { ReportsPage } from '@/pages/reports';
import { IntakeTestPage } from '@/pages/intake-test';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/generate" element={<GeneratorPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/intake-test" element={<IntakeTestPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}