// src/store/intakeStore.ts

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import { createRuntimeEngine, type RuntimeState } from '@/lib/intake/runtime/runtimeEngine';
import { autoSave, resetAutoSaveState } from '@/store/middleware/autoSaveMiddleware';
import { showToast } from '@/store/toastStore';
import type { IntakeAnswerValue, IntakeSchema } from '@/types';
import { sanitizeByType } from '@/lib/intake/sanitization';
import { getIntakeSchema } from '@/constants/intakeSchemas';
import { getNextVisibleSection, getPreviousVisibleSection } from '@/lib/intake/runtime/workflowEngine';
import { computeErrors } from '@/lib/intake-ui/validationHelpers';

export type IntakeRuntimeEngine = ReturnType<typeof createRuntimeEngine>;

export type IntakeStore = {
  // Core
  engine: IntakeRuntimeEngine | null;
  runtimeState: RuntimeState | null;
  activeSchemaId: string | null;
  initialized: boolean;
  error: string | null;

  // UI & validation
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isDraftHydrated: boolean;         // renamed – true after draft restored
  currentSectionId: string | null;

  // Actions
  initialize: (schema: IntakeSchema, schemaId: string) => Promise<void>;
  updateAnswer: (nodeId: string, value: unknown) => Promise<void>;
  reset: () => Promise<void>;
  resetIntakeState: () => void;
  markTouched: (questionId: string) => void;
  validateCurrentAnswers: () => void;
  goToNextSection: () => void;
  goToPreviousSection: () => void;
  setDraftHydrated: (hydrated: boolean) => void;
  setCurrentSection: (sectionId: string | null) => void;
};

const intakeLogger = createLogger('intake');

let unsubscribeRuntime: (() => void) | null = null;
let initializePromise: Promise<void> | null = null;
let initializingSchemaId: string | null = null;

function cleanupRuntimeSubscription() {
  unsubscribeRuntime?.();
  unsubscribeRuntime = null;
}

function emitIntakeError(set: (partial: Partial<IntakeStore>) => void, title: string, fallbackMessage: string, error: unknown) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  set({ error: message });
  showToast({ title, description: message, variant: 'error' });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isIntakeAnswerValue(value: unknown): value is IntakeAnswerValue {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    value === null ||
    isStringArray(value)
  );
}

function createInitialState(): Pick<
  IntakeStore,
  | 'engine'
  | 'runtimeState'
  | 'activeSchemaId'
  | 'initialized'
  | 'error'
  | 'errors'
  | 'touched'
  | 'isDraftHydrated'
  | 'currentSectionId'
> {
  return {
    engine: null,
    runtimeState: null,
    activeSchemaId: null,
    initialized: false,
    error: null,
    errors: {},
    touched: {},
    isDraftHydrated: false,
    currentSectionId: null,
  };
}

export const useIntakeStore = create<IntakeStore>()(
  autoSave<IntakeStore>(
    (set, get) => ({
      ...createInitialState(),

      initialize: async (schema, schemaId) => {
        if (schemaId.trim().length === 0) {
          const error = new Error('A valid intake schema id is required.');
          intakeLogger.error('initialize failed', { error, schemaId });
          emitIntakeError(set, 'Intake initialization failed', 'Failed to initialize the intake flow.', error);
          throw error;
        }

        if (get().initialized && get().engine && get().runtimeState && get().activeSchemaId === schemaId) {
          return;
        }

        if (initializePromise) {
          if (initializingSchemaId === schemaId) {
            return initializePromise;
          }
          await initializePromise;
          return get().initialize(schema, schemaId);
        }

        initializingSchemaId = schemaId;
        initializePromise = (async () => {
          set({ error: null });

          try {
            cleanupRuntimeSubscription();

            const engine = createRuntimeEngine(schema);
            unsubscribeRuntime = engine.subscribe((runtimeState) => {
              // Revalidate using the helper
              const newErrors = computeErrors(schema, runtimeState.answers);
              set((state) => ({
                runtimeState,
                errors: newErrors,
                error: null,
              }));
            });

            const runtimeState = engine.getState();
            const initialErrors = computeErrors(schema, runtimeState.answers);
            const firstVisibleSection = runtimeState.visibleQuestions[0]?.sectionId ?? null;

            set({
              engine,
              runtimeState,
              activeSchemaId: schemaId,
              initialized: true,
              errors: initialErrors,
              error: null,
              currentSectionId: firstVisibleSection,
            });

            intakeLogger.debug('initialize success', {
              schemaId,
              visibleQuestionCount: runtimeState.visibleQuestions.length,
            });
          } catch (error) {
            cleanupRuntimeSubscription();
            intakeLogger.error('initialize failed', { error });
            emitIntakeError(set, 'Intake initialization failed', 'Failed to initialize the intake flow.', error);
            set({
              engine: null,
              runtimeState: null,
              activeSchemaId: null,
              initialized: false,
              errors: {},
            });
            throw error;
          } finally {
            initializePromise = null;
            initializingSchemaId = null;
          }
        })();

        return initializePromise;
      },

      updateAnswer: async (nodeId, value) => {
        const engine = get().engine;
        const activeSchemaId = get().activeSchemaId;

        if (!engine || !activeSchemaId) {
          const error = new Error('Intake engine or schema not initialized.');
          intakeLogger.error('updateAnswer failed', { nodeId, error });
          emitIntakeError(set, 'Intake update failed', 'The intake flow is not ready yet.', error);
          throw error;
        }

        const schema = getIntakeSchema(activeSchemaId);
        if (!schema) {
          const error = new Error(`Schema "${activeSchemaId}" not found.`);
          intakeLogger.error('updateAnswer failed', { nodeId, error });
          emitIntakeError(set, 'Intake update failed', 'Schema missing.', error);
          throw error;
        }

        const question = schema.questions.find((q) => q.id === nodeId);
        if (!question) {
          const error = new Error(`Question "${nodeId}" not found in schema.`);
          intakeLogger.error('updateAnswer failed', { nodeId, error });
          emitIntakeError(set, 'Intake update failed', 'Question not found.', error);
          throw error;
        }

        // Sanitize
        const sanitizedValue = sanitizeByType(
          value,
          question.type,
          question.inputMode,
          question.options,
          question.validation?.maxLength,
          question.validation?.maxSelections
        );

        if (!isIntakeAnswerValue(sanitizedValue)) {
          const error = new Error('Sanitized value is not a valid intake answer type.');
          intakeLogger.warn('updateAnswer rejected sanitized value', { nodeId, sanitizedValue });
          emitIntakeError(set, 'Intake update failed', 'The provided answer could not be sanitized.', error);
          throw error;
        }

        try {
          engine.updateAnswer(nodeId, sanitizedValue);
          // The subscription will revalidate via computeErrors
        } catch (error) {
          intakeLogger.error('updateAnswer failed', { nodeId, error });
          emitIntakeError(set, 'Intake update failed', 'Failed to update the intake answer.', error);
          throw error;
        }
      },

      reset: async () => {
        const engine = get().engine;
        if (!engine) {
          const error = new Error('Intake engine is not initialized.');
          intakeLogger.error('reset failed', { error });
          emitIntakeError(set, 'Intake reset failed', 'The intake flow is not ready yet.', error);
          throw error;
        }

        try {
          const runtimeState = engine.reset();
          const schema = getIntakeSchema(get().activeSchemaId!);
          const newErrors = schema ? computeErrors(schema, runtimeState.answers) : {};
          const firstVisibleSection = runtimeState.visibleQuestions[0]?.sectionId ?? null;
          set({
            runtimeState,
            errors: newErrors,
            touched: {},
            error: null,
            currentSectionId: firstVisibleSection,
          });
        } catch (error) {
          intakeLogger.error('reset failed', { error });
          emitIntakeError(set, 'Intake reset failed', 'Failed to reset the intake flow.', error);
          throw error;
        }
      },

      resetIntakeState: () => {
        const engine = get().engine;
        resetAutoSaveState();
        cleanupRuntimeSubscription();
        initializePromise = null;
        initializingSchemaId = null;

        if (engine) {
          try {
            engine.reset();
          } catch (error) {
            intakeLogger.warn('resetIntakeState engine reset failed', { error });
          }
        }

        set(createInitialState());
      },

      markTouched: (questionId) => {
        set((state) => ({
          touched: { ...state.touched, [questionId]: true },
        }));
      },

      validateCurrentAnswers: () => {
        const runtimeState = get().runtimeState;
        const activeSchemaId = get().activeSchemaId;
        if (!runtimeState || !activeSchemaId) return;
        const schema = getIntakeSchema(activeSchemaId);
        if (!schema) return;
        const newErrors = computeErrors(schema, runtimeState.answers);
        set({ errors: newErrors });
      },

      goToNextSection: () => {
        const runtimeState = get().runtimeState;
        const activeSchemaId = get().activeSchemaId;
        const currentSectionId = get().currentSectionId;
        if (!runtimeState || !activeSchemaId || !currentSectionId) return;

        const schema = getIntakeSchema(activeSchemaId);
        if (!schema) return;

        const nextSectionId = getNextVisibleSection(schema, runtimeState.answers, currentSectionId);
        if (nextSectionId) {
          set({ currentSectionId: nextSectionId });
        }
      },

      goToPreviousSection: () => {
        const runtimeState = get().runtimeState;
        const activeSchemaId = get().activeSchemaId;
        const currentSectionId = get().currentSectionId;
        if (!runtimeState || !activeSchemaId || !currentSectionId) return;

        const schema = getIntakeSchema(activeSchemaId);
        if (!schema) return;

        const prevSectionId = getPreviousVisibleSection(schema, runtimeState.answers, currentSectionId);
        if (prevSectionId) {
          set({ currentSectionId: prevSectionId });
        }
      },

      setDraftHydrated: (hydrated) => {
        set({ isDraftHydrated: hydrated });
      },

      setCurrentSection: (sectionId) => {
        set({ currentSectionId: sectionId });
      },
    }),
    { delay: 500 }
  )
);

export function stopIntakeSubscription() {
  cleanupRuntimeSubscription();
}