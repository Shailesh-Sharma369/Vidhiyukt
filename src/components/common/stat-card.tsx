import { Card, CardContent } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  delta,
  tone = 'blue'
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'blue' | 'emerald' | 'cyan';
}) {
  const toneClass = {
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-300',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-300'
  }[tone];

  return (
    <Card className="bg-gradient-to-br from-white/8 to-white/3">
      <CardContent className="space-y-2 p-5">
        <div className={`inline-flex rounded-full border border-white/10 bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${toneClass}`}>{label}</div>
        <div className="text-3xl font-semibold">{value}</div>
        {delta ? <p className="text-sm text-muted-foreground">{delta}</p> : null}
      </CardContent>
    </Card>
  );
}