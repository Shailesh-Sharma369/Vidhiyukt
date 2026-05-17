import { BarChart3, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { StatCard } from '@/components/common/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { useDocumentStore } from '@/store/documentStore';
import { useComplianceStore } from '@/store/complianceStore';
import { WorkflowTimeline } from '@/components/compliance/workflow-timeline';

export function DashboardPage() {
  useDocumentTitle('SecureShip | Dashboard');

  const documents = useDocumentStore((state) => state.generatedDocuments);
  const activeReport = useComplianceStore((state) => state.report);
  const history = useComplianceStore((state) => state.history);

  const latestDocument = documents[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Compliance workspace at a glance</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Generated docs" value={String(documents.length)} delta="Legal drafts stored locally" tone="blue" />
        <StatCard label="Latest report" value={activeReport ? `${activeReport.scorecard.score}%` : '—'} delta="Current audit score" tone="emerald" />
        <StatCard label="Report history" value={String(history.length)} delta="Recent audit snapshots" tone="cyan" />
        <StatCard label="Workflow stage" value={latestDocument ? 'Draft ready' : 'Start here'} delta="Generator and audit aligned" tone="blue" />
      </div>

      <WorkflowTimeline />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-slate-950/75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Recent compliance intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeReport ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{activeReport.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeReport.scorecard.findings.map((finding) => (
                    <div key={finding.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">{finding.control}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{finding.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No audit results yet"
                description="Run a compliance audit to see scorecards, findings, and remediation guidance in the dashboard."
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-950/75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Latest legal draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestDocument ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{latestDocument.documentType}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{latestDocument.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{latestDocument.excerpt}</p>
                </div>
                <div className="grid gap-3">
                  {latestDocument.sections.map((section) => (
                    <div key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-medium text-white">{section.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{section.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No legal drafts yet"
                description="Open the generator to create a privacy policy, DPA, or related document in minutes."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <FileText className="size-5 text-primary" />
            <p className="mt-3 font-medium text-white">Generate a legal draft</p>
            <p className="mt-2 text-sm text-muted-foreground">Create policy language for your product and jurisdiction.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="size-5 text-primary" />
            <p className="mt-3 font-medium text-white">Run a compliance audit</p>
            <p className="mt-2 text-sm text-muted-foreground">Get a scorecard and remediation checklist.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <BarChart3 className="size-5 text-primary" />
            <p className="mt-3 font-medium text-white">Review your reports</p>
            <p className="mt-2 text-sm text-muted-foreground">Track audit history and export-ready summaries.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}