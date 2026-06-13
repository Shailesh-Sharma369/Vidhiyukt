// pages/intake-test/index.tsx

import { useEffect, useState } from 'react';
import { useIntakeStore } from '@/store/intakeStore';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { privacyPolicySchema } from '@/constants/intakeSchemas/privacyPolicySchema';
import { defaultIntakeSchemaId } from '@/constants/intakeSchemas';
import { LoadingState } from '@/components/common/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function IntakeTestPage() {
  const initialize = useIntakeStore((state) => state.initialize);
  const reset = useIntakeStore((state) => state.reset);
  const initialized = useIntakeStore((state) => state.initialized);
  const error = useIntakeStore((state) => state.error);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!initialized && !isInitializing) {
      setIsInitializing(true);
      initialize(privacyPolicySchema, defaultIntakeSchemaId)
        .catch((err) => {
          console.error('Failed to initialize intake:', err);
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [initialized, isInitializing, initialize]);

  const handleReset = () => {
    reset().catch(console.error);
  };

  if (isInitializing || (!initialized && !error)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <LoadingState title="Loading Intake Form" description="Preparing privacy policy questions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-500/30 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-300">Initialisation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-200">{error}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Intake Form Test</h1>
          <p className="text-muted-foreground mt-1">Privacy Policy schema – answers auto-save locally</p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Reset Form
        </Button>
      </div>
      <IntakeForm />
    </div>
  );
}