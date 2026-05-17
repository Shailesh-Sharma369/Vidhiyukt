import { useDocumentTitle } from '@/hooks/use-document-title';
import { ReportViewer } from '@/components/compliance/report-viewer';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useComplianceStore } from '@/store/complianceStore';

export function ReportsPage() {
  useDocumentTitle('SecureShip | Reports');

  const report = useComplianceStore((state) => state.report);
  const history = useComplianceStore((state) => state.history);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>{report ? <ReportViewer report={report} /> : <EmptyState title="No report generated" description="Run a compliance audit to unlock the PDF viewer and report summary panel." />}</div>
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{item.framework}</p>
                <p className="mt-1 text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              </div>
            ))
          ) : (
            <EmptyState title="Nothing in history yet" description="Previous audit outputs will appear here for easy review and comparison." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}