import { useDocumentTitle } from '@/hooks/use-document-title';
import { AuditForm } from '@/components/forms/audit-form';
import { AuditDashboard } from '@/components/compliance/audit-dashboard';
import { ComplianceScorecard } from '@/components/compliance/compliance-scorecard';
import { EmptyState } from '@/components/common/empty-state';
import { useComplianceStore } from '@/store/complianceStore';

export function AuditPage() {
  useDocumentTitle('SecureShip | Audit');

  const report = useComplianceStore((state) => state.report);
  const scorecard = useComplianceStore((state) => state.scorecard);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <AuditForm />
        {report && scorecard ? <AuditDashboard report={report} /> : <EmptyState title="Audit results will appear here" description="Run an audit to generate a scorecard, findings, and a review-ready compliance summary." />}
      </div>
      <div>{scorecard ? <ComplianceScorecard scorecard={scorecard} /> : <EmptyState title="No scorecard yet" description="Complete an audit to see clause validation, strengths, and remediation gaps." />}</div>
    </div>
  );
}