import { Clock3, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ComplianceReport } from '@/types';

export function AuditDashboard({ report }: { report: ComplianceReport }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Compliance audit summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Score</p>
              <p className="mt-2 text-3xl font-semibold">{report.scorecard.score}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Grade</p>
              <p className="mt-2 text-3xl font-semibold text-primary">{report.scorecard.grade}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open findings</p>
              <p className="mt-2 text-3xl font-semibold">{report.scorecard.findings.filter((item) => item.status !== 'pass').length}</p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Coverage</span>
              <span>{report.scorecard.score}%</span>
            </div>
            <Progress value={report.scorecard.score} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Summary</p>
            <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle>Audit activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Clock3 className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="font-medium text-white">Local execution</p>
              <p>Audit scoring runs in browser memory for privacy-first compliance analysis.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <TriangleAlert className="mt-0.5 size-4 text-amber-300" />
            <div>
              <p className="font-medium text-white">Remediation queue</p>
              <p>Track warnings and export fixes into your legal review workflow.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}