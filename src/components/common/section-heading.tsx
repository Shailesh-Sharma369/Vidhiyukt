import { Badge } from '@/components/ui/badge';

export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">{eyebrow}</Badge>
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
      <p className="text-lg leading-8 text-slate-300">{description}</p>
    </div>
  );
}