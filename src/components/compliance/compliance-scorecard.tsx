import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ComplianceScorecard as ScorecardType } from '@/types';

export function ComplianceScorecard({ scorecard }: { scorecard: ScorecardType }) {
  return (
    <Card className="bg-slate-950/75">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Clause Validation Scorecard</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted-foreground">Grade {scorecard.grade}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-5xl font-semibold text-white">{scorecard.score}</div>
            <p className="mt-2 text-sm text-muted-foreground">{scorecard.benchmark}</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Compliance coverage</span>
                <span>{scorecard.score}%</span>
              </div>
              <Progress value={scorecard.score} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  Strengths
                </div>
                <ul className="space-y-1 text-sm text-slate-200">
                  {scorecard.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="size-4" />
                  Gaps
                </div>
                <ul className="space-y-1 text-sm text-slate-200">
                  {scorecard.gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {scorecard.findings.map((finding) => (
            <div key={finding.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <p className="font-medium">{finding.control}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {finding.severity}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{finding.description}</p>
              <p className="mt-2 text-sm text-emerald-300">Recommendation: {finding.recommendation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}