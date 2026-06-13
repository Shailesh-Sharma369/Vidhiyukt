// src/providers/intake-bootstrap.tsx

import { useEffect, useRef } from 'react';
import { defaultIntakeSchemaId, getIntakeSchema, isIntakeSchemaId } from '@/constants/intakeSchemas';
import { createLogger } from '@/lib/logger';
import { loadIntakeDraft } from '@/lib/persistence/intakePersistence';
import { useAuthStore } from '@/store/authStore';
import { useIntakeStore } from '@/store/intakeStore';
import { showToast } from '@/store/toastStore';
import type { IntakeAnswerValue } from '@/types';

declare global {
  interface Window {
    __INTAKE_REPLAYING__?: boolean;
  }
}

const intakeBootstrapLogger = createLogger('intake][bootstrap');

let hydrationPromise: Promise<void> | null = null;
let hydratingDraftKey: string | null = null;
const hydratedDraftKeys = new Set<string>();

function normalizeAnswers(answers: Readonly<Record<string, IntakeAnswerValue>>): Record<string, IntakeAnswerValue> {
  return Object.fromEntries(
    Object.entries(answers)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => [key, value])
  );
}

function getHydrationKey(userId: string, schemaId: string): string {
  return `${userId}:${schemaId}`;
}

export function IntakeBootstrap() {
  const userId = useAuthStore((state) => state.user?.uid ?? 'guest');
  const initialize = useIntakeStore((state) => state.initialize);
  const updateAnswer = useIntakeStore((state) => state.updateAnswer);
  const setDraftHydrated = useIntakeStore((state) => state.setDraftHydrated);
  const activeSchemaId = useIntakeStore((state) => state.activeSchemaId);

  const isMountedRef = useRef(true);
  const activeSchemaIdRef = useRef<string | null>(activeSchemaId);

  const resolvedSchemaId = activeSchemaId ?? defaultIntakeSchemaId;
  const hydrationKey = getHydrationKey(userId, resolvedSchemaId);

  useEffect(() => {
    isMountedRef.current = true;
    activeSchemaIdRef.current = activeSchemaId;

    return () => {
      isMountedRef.current = false;
    };
  }, [activeSchemaId]);

  useEffect(() => {
    if (!resolvedSchemaId) {
      intakeBootstrapLogger.warn('hydration skipped because schema id is missing');
      return;
    }

    if (!isIntakeSchemaId(resolvedSchemaId)) {
      intakeBootstrapLogger.warn('hydration skipped because schema id is invalid', { schemaId: resolvedSchemaId });
      return;
    }

    const schema = getIntakeSchema(resolvedSchemaId);

    if (!schema) {
      intakeBootstrapLogger.warn('hydration skipped because schema was not found', { schemaId: resolvedSchemaId });
      return;
    }

    if (hydratedDraftKeys.has(hydrationKey)) {
      return;
    }

    if (hydrationPromise && hydratingDraftKey === hydrationKey) {
      return;
    }

    hydratingDraftKey = hydrationKey;
    hydrationPromise = (async () => {
      try {
        await initialize(schema, resolvedSchemaId);
        activeSchemaIdRef.current = resolvedSchemaId;
      } catch (error) {
        intakeBootstrapLogger.error('initialize failed during bootstrap', { error });
        if (isMountedRef.current) {
          showToast({
            title: 'Intake setup failed',
            description: error instanceof Error ? error.message : 'Failed to initialize the intake flow.',
            variant: 'error'
          });
        }
        return;
      }

      try {
        const persistedDraft = await loadIntakeDraft(userId, resolvedSchemaId);

        if (!persistedDraft) {
          hydratedDraftKeys.add(hydrationKey);
          setDraftHydrated(true);
          return;
        }

        window.__INTAKE_REPLAYING__ = true;

        for (const [nodeId, value] of Object.entries(normalizeAnswers(persistedDraft.answers))) {
          if (!isMountedRef.current || activeSchemaIdRef.current !== resolvedSchemaId) {
            intakeBootstrapLogger.warn('hydration aborted because schema changed during replay', {
              schemaId: resolvedSchemaId
            });
            return;
          }

          await updateAnswer(nodeId, value);
        }

        hydratedDraftKeys.add(hydrationKey);
        setDraftHydrated(true);
        intakeBootstrapLogger.debug('hydration success', {
          schemaId: resolvedSchemaId,
          userId,
          answerCount: Object.keys(persistedDraft.answers).length,
          currentStep: persistedDraft.currentStep,
          timestamp: persistedDraft.timestamp
        });
      } catch (error) {
        intakeBootstrapLogger.error('hydration failed', { error });
        setDraftHydrated(true); // Still mark hydrated to avoid infinite loading, but with no draft
        if (isMountedRef.current) {
          showToast({
            title: 'Draft restore failed',
            description: error instanceof Error ? error.message : 'Your local intake draft could not be restored.',
            variant: 'error'
          });
        }
      } finally {
        window.__INTAKE_REPLAYING__ = false;
      }
    })().finally(() => {
      hydrationPromise = null;
      hydratingDraftKey = null;
    });
  }, [hydrationKey, initialize, resolvedSchemaId, updateAnswer, userId, setDraftHydrated]);

  return null;
}