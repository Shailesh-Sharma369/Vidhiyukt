import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { documentTypes, jurisdictionOptions, toneOptions } from '@/constants/documents';
import type { JurisdictionType } from '@/types/intake';
import { useDocumentStore } from '@/store/documentStore';

const schema = z.object({
  companyName: z.string().min(2),
  documentType: z.enum(documentTypes),
  jurisdiction: z.enum(jurisdictionOptions),
  tone: z.enum(toneOptions),
  productSummary: z.string().min(20),
  dataCategories: z.string().min(10),
  audience: z.string().min(10)
});

type Values = z.infer<typeof schema>;

type DocumentGeneratorValues = Omit<Values, 'jurisdiction'> & {
  jurisdiction: JurisdictionType | 'Both';
};

export function DocumentGeneratorForm() {
  const draft = useDocumentStore((state) => state.draft);
  const setDraft = useDocumentStore((state) => state.setDraft);
  const generateDocument = useDocumentStore((state) => state.generateDocument);
  const isGenerating = useDocumentStore((state) => state.isGenerating);

  const defaultValues = useMemo<DocumentGeneratorValues>(() => draft, [draft]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DocumentGeneratorValues>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const onSubmit = handleSubmit(async (values) => {
    setDraft(values);
    await generateDocument();
  });

  return (
    <Card className="bg-slate-950/75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WandSparkles className="size-5 text-primary" />
          AI Legal Draft Generator
        </CardTitle>
        <CardDescription>Provide product context to generate a privacy-aware legal draft with reusable sections.</CardDescription>
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
              <label className="text-sm font-medium">Document type</label>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm" {...register('documentType')}>
                {documentTypes.map((type) => (
                  <option key={type} value={type} className="bg-slate-950">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jurisdiction</label>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm" {...register('jurisdiction')}>
                {jurisdictionOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-950">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm" {...register('tone')}>
                {toneOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-950">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product summary</label>
            <Textarea {...register('productSummary')} />
            {errors.productSummary ? <p className="text-sm text-red-400">{errors.productSummary.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data categories</label>
            <Input {...register('dataCategories')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Audience</label>
            <Input {...register('audience')} />
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-muted-foreground">Produces a structured draft, clause summaries, and compliance-friendly language.</p>
            <Button type="submit" loading={isGenerating}>
              <FileText className="size-4" />
              Generate draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}