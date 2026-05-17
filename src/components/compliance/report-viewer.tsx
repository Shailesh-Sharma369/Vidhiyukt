import { Download, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ComplianceReport } from '@/types';

export function ReportViewer({ report }: { report: ComplianceReport }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              PDF Report Viewer
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Printer className="size-4" />
                Print
              </Button>
              <Button size="sm">
                <Download className="size-4" />
                Export PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{report.framework}</p>
                <h3 className="text-2xl font-semibold text-white">{report.title}</h3>
                <p className="mt-2 text-sm text-slate-300">Generated {new Date(report.generatedAt).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Grade</p>
                <p className="text-3xl font-semibold text-primary">{report.scorecard.grade}</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-300">{report.summary}</p>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Overall coverage</span>
                  <span>{report.scorecard.score}%</span>
                </div>
                <Progress value={report.scorecard.score} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="mb-2 text-sm font-semibold text-white">Evidence summary</p>
                <p className="text-sm text-slate-300">
                  SecureShip grouped notices, retention controls, and vendor oversight into a single narrative for audit and board review.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle>Report breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Findings</p>
            <p className="mt-2 text-sm text-muted-foreground">{report.scorecard.findings.length} items ready for remediation tracking.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Strengths</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {report.scorecard.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Gaps</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {report.scorecard.gaps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}