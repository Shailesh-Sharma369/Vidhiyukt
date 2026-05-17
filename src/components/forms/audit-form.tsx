import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldAlert, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { complianceFrameworks } from '@/constants/compliance';
import { useComplianceStore } from '@/store/complianceStore';

const schema = z.object({
  companyName: z.string().min(2),
  framework: z.enum(complianceFrameworks),
  productScope: z.string().min(20),
  dataResidency: z.string().min(5),
  processingRegions: z.string().min(2)
});

type Values = z.infer<typeof schema>;

export function AuditForm() {
  const request = useComplianceStore((state) => state.request);
  const setRequest = useComplianceStore((state) => state.setRequest);
  const runComplianceAudit = useComplianceStore((state) => state.runComplianceAudit);
  const isAuditing = useComplianceStore((state) => state.isAuditing);

  const defaultValues = useMemo<Values>(
    () => ({ ...request, processingRegions: request.processingRegions.join(', ') }),
    [request]
  );

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const onSubmit = handleSubmit(async (values) => {
    setRequest({
      companyName: values.companyName,
      framework: values.framework,
      productScope: values.productScope,
      dataResidency: values.dataResidency,
      processingRegions: values.processingRegions.split(',').map((value) => value.trim()).filter(Boolean)
    });
    await runComplianceAudit();
  });

  return (
    <Card className="bg-slate-950/75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-primary" />
          Compliance Audit Dashboard
        </CardTitle>
        <CardDescription>Run a structured GDPR, DPDP, or AI Act audit and generate a board-ready scorecard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company name</label>
              <Input {...register('companyName')} />
              {errors.companyName ? <p className="text-sm text-red-400">{errors.companyName.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Framework</label>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm" {...register('framework')}>
                {complianceFrameworks.map((framework) => (
                  <option key={framework} value={framework} className="bg-slate-950">
                    {framework}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product scope</label>
            <Textarea {...register('productScope')} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data residency</label>
              <Input {...register('dataResidency')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Processing regions</label>
              <Input placeholder="EU, IN, US" {...register('processingRegions')} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-muted-foreground">Audit results are generated locally in the browser and persisted for reporting.</p>
            <Button type="submit" loading={isAuditing}>
              <ScanText className="size-4" />
              Run audit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}