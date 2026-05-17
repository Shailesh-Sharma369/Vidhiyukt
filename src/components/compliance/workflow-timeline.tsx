import { CheckCircle2, FileStack, ScanLine, ShieldCheck } from 'lucide-react';

const steps = [
  { title: 'Capture', description: 'Collect product, processing, and jurisdiction inputs.', icon: FileStack },
  { title: 'Generate', description: 'Create legal artifacts and clause summaries.', icon: ShieldCheck },
  { title: 'Audit', description: 'Score controls against GDPR or DPDP requirements.', icon: ScanLine },
  { title: 'Export', description: 'Package reports and remediation guidance for review.', icon: CheckCircle2 }
];

export function WorkflowTimeline() {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Icon className="size-5" />
              </div>
              <span className="text-sm text-muted-foreground">0{index + 1}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}