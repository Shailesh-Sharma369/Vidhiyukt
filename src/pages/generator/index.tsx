// src/pages/generator/index.tsx

import { useDocumentTitle } from '@/hooks/use-document-title';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { useIntakeStore } from '@/store/intakeStore';
import { useEffect } from 'react';
import { privacyPolicySchema } from '@/constants/intakeSchemas/privacyPolicySchema';
import { defaultIntakeSchemaId } from '@/constants/intakeSchemas';

export function GeneratorPage() {
  useDocumentTitle('SecureShip | Generator');

  const initialize = useIntakeStore((state) => state.initialize);
  const initialized = useIntakeStore((state) => state.initialized);
  const isDraftHydrated = useIntakeStore((state) => state.isDraftHydrated);
  const runtimeState = useIntakeStore((state) => state.runtimeState);

  // Initialize the intake engine with Privacy Policy schema when page loads
  useEffect(() => {
    if (!initialized) {
      initialize(privacyPolicySchema, defaultIntakeSchemaId).catch(console.error);
    }
  }, [initialized, initialize]);

  // Check if any answers exist (to show preview)
  const hasAnswers = runtimeState && Object.keys(runtimeState.answers).length > 0;

  if (!initialized || !isDraftHydrated) {
    return <LoadingState title="Loading generator" description="Preparing document intake form..." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left side: Dynamic Intake Form */}
      <IntakeForm />

      {/* Right side: Preview of generated document (placeholder until Module 1.7) */}
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle>Generated document preview</CardTitle>
        </CardHeader>
        <CardContent>
          {hasAnswers ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready to generate</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Document will appear here</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once you complete the intake form, the AI will generate a compliant legal document.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Next step</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Module 1.7 will implement the AI Payload Builder – then the document will be generated here.
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No document generated yet"
              description="Fill out the intake form to generate a privacy policy, DPA, or terms of service."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}