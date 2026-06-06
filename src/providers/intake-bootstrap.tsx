import { useEffect, useRef } from 'react';
import { defaultIntakeSchemaId, getIntakeSchema, isIntakeSchemaId } from '@/constants/intakeSchemas';
import { createLogger } from '@/lib/logger';
import {
  clearIntakeDraft,
  loadIntakeDraft,
  saveIntakeDraft,
  type IntakeDraftPersistence
} from '@/lib/persistence/intakePersistence';
import { useIntakeStore } from '@/store/intakeStore';
import { showToast } from '@/store/toastStore';
import type { IntakeAnswerValue } from '@/types';

const intakeBootstrapLogger = createLogger('intake][bootstrap');
const AUTOSAVE_DELAY_MS = 500;

let hydrationPromise: Promise<void> | null = null;
let hydratingSchemaId: string | null = null;
const hydratedSchemaIds = new Set<string>();

function normalizeAnswers(answers: Readonly<Record<string, IntakeAnswerValue>>): Record<string, IntakeAnswerValue> {
  return Object.fromEntries(
    Object.entries(answers)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => [key, value])
  );
}

function deriveCurrentStep(
  answers: Readonly<Record<string, IntakeAnswerValue>>,
  visibleQuestionIds: readonly string[],
  requiredUnansweredIds: readonly string[]
): number {
  if (requiredUnansweredIds.length > 0) {
    const nextQuestionId = requiredUnansweredIds[0];
    const nextQuestionIndex = visibleQuestionIds.findIndex((questionId) => questionId === nextQuestionId);

    if (nextQuestionIndex >= 0) {
      return nextQuestionIndex;
    }
  }

  const answeredVisibleCount = visibleQuestionIds.filter((questionId) => answers[questionId] !== undefined).length;

  return answeredVisibleCount > 0 ? answeredVisibleCount - 1 : 0;
}

function buildDraftSignature(draft: IntakeDraftPersistence): string {
  return JSON.stringify({
    answers: normalizeAnswers(draft.answers),
    currentStep: draft.currentStep
  });
}

function createDraftFromRuntimeState(
  runtimeState: NonNullable<ReturnType<typeof useIntakeStore.getState>['runtimeState']>
): IntakeDraftPersistence {
  const answers = normalizeAnswers(runtimeState.answers);
  const visibleQuestionIds = runtimeState.visibleQuestions.map((question) => question.id);

  return {
    answers,
    currentStep: deriveCurrentStep(answers, visibleQuestionIds, runtimeState.progress.requiredUnansweredIds),
    timestamp: new Date().toISOString()
  };
}

export function IntakeBootstrap() {
  const initialize = useIntakeStore((state) => state.initialize);
  const updateAnswer = useIntakeStore((state) => state.updateAnswer);
  const runtimeState = useIntakeStore((state) => state.runtimeState);
  const activeSchemaId = useIntakeStore((state) => state.activeSchemaId);

  const isMountedRef = useRef(true);
  const isReplayingRef = useRef(false);
  const isHydratedRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const activeSchemaIdRef = useRef<string | null>(activeSchemaId);
  const lastSavedSignatureBySchemaRef = useRef(new Map<string, string>());

  const resolvedSchemaId = activeSchemaId ?? defaultIntakeSchemaId;

  useEffect(() => {
    isMountedRef.current = true;
    activeSchemaIdRef.current = activeSchemaId;

    return () => {
      isMountedRef.current = false;
    };
  }, [activeSchemaId]);

  useEffect(() => {
    if (!resolvedSchemaId) {
      isHydratedRef.current = false;
      intakeBootstrapLogger.warn('hydration skipped because schema id is missing');
      return;
    }

    if (!isIntakeSchemaId(resolvedSchemaId)) {
      isHydratedRef.current = false;
      intakeBootstrapLogger.warn('hydration skipped because schema id is invalid', { schemaId: resolvedSchemaId });
      return;
    }

    const schema = getIntakeSchema(resolvedSchemaId);

    if (!schema) {
      isHydratedRef.current = false;
      intakeBootstrapLogger.warn('hydration skipped because schema was not found', { schemaId: resolvedSchemaId });
      return;
    }

    if (hydratedSchemaIds.has(resolvedSchemaId)) {
      isHydratedRef.current = true;
      return;
    }

    if (hydrationPromise && hydratingSchemaId === resolvedSchemaId) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    isHydratedRef.current = false;
    hydratingSchemaId = resolvedSchemaId;
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
        const persistedDraft = await loadIntakeDraft(resolvedSchemaId);

        if (!persistedDraft) {
          hydratedSchemaIds.add(resolvedSchemaId);
          isHydratedRef.current = true;
          return;
        }

        lastSavedSignatureBySchemaRef.current.set(resolvedSchemaId, buildDraftSignature(persistedDraft));
        isReplayingRef.current = true;

        for (const [nodeId, value] of Object.entries(normalizeAnswers(persistedDraft.answers))) {
          if (!isMountedRef.current || activeSchemaIdRef.current !== resolvedSchemaId) {
            intakeBootstrapLogger.warn('hydration aborted because schema changed during replay', {
              schemaId: resolvedSchemaId
            });
            return;
          }

          await updateAnswer(nodeId, value);
        }

        hydratedSchemaIds.add(resolvedSchemaId);
        intakeBootstrapLogger.debug('hydration success', {
          schemaId: resolvedSchemaId,
          answerCount: Object.keys(persistedDraft.answers).length,
          currentStep: persistedDraft.currentStep,
          timestamp: persistedDraft.timestamp
        });
      } catch (error) {
        intakeBootstrapLogger.error('hydration failed', { error });
        if (isMountedRef.current) {
          showToast({
            title: 'Draft restore failed',
            description: error instanceof Error ? error.message : 'Your local intake draft could not be restored.',
            variant: 'error'
          });
        }
      } finally {
        isReplayingRef.current = false;
        if (activeSchemaIdRef.current === resolvedSchemaId) {
          isHydratedRef.current = true;
        }
      }
    })().finally(() => {
      hydrationPromise = null;
      hydratingSchemaId = null;
    });

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [initialize, resolvedSchemaId, updateAnswer]);

  useEffect(() => {
    if (!runtimeState || !isHydratedRef.current || isReplayingRef.current || !activeSchemaId) {
      return;
    }

    if (!isIntakeSchemaId(activeSchemaId)) {
      intakeBootstrapLogger.warn('autosave skipped because schema id is invalid', { schemaId: activeSchemaId });
      return;
    }

    const draft = createDraftFromRuntimeState(runtimeState);
    const nextSignature = buildDraftSignature(draft);
    const answerCount = Object.keys(draft.answers).length;
    const previousSignature = lastSavedSignatureBySchemaRef.current.get(activeSchemaId) ?? null;

    if (previousSignature === nextSignature) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          if (!isMountedRef.current || activeSchemaIdRef.current !== activeSchemaId) {
            intakeBootstrapLogger.warn('autosave aborted because schema changed before persistence', {
              schemaId: activeSchemaId
            });
            return;
          }

          if (answerCount === 0) {
            await clearIntakeDraft(activeSchemaId);
            lastSavedSignatureBySchemaRef.current.delete(activeSchemaId);
            return;
          }

          await saveIntakeDraft(activeSchemaId, draft);
          lastSavedSignatureBySchemaRef.current.set(activeSchemaId, nextSignature);
        } catch (error) {
          intakeBootstrapLogger.warn('autosave failed', { error, schemaId: activeSchemaId });
        }
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [activeSchemaId, runtimeState]);

  return null;
}
