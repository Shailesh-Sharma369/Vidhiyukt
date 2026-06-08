import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import { createRuntimeEngine, type RuntimeState } from '@/lib/intake/runtime/runtimeEngine';
import { autoSave, resetAutoSaveState } from '@/store/middleware/autoSaveMiddleware';
import { showToast } from '@/store/toastStore';
import type { IntakeAnswerValue, IntakeSchema } from '@/types';

export type IntakeRuntimeEngine = ReturnType<typeof createRuntimeEngine>;

export type IntakeStore = {
  engine: IntakeRuntimeEngine | null;
  runtimeState: RuntimeState | null;
  activeSchemaId: string | null;
  initialized: boolean;
  isHydrating: boolean;
  error: string | null;
  initialize: (schema: IntakeSchema, schemaId: string) => Promise<void>;
  updateAnswer: (nodeId: string, value: unknown) => Promise<void>;
  reset: () => Promise<void>;
  resetIntakeState: () => void;
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
  showToast({
    title,
    description: message,
    variant: 'error'
  });
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
  'engine' | 'runtimeState' | 'activeSchemaId' | 'initialized' | 'isHydrating' | 'error'
> {
  return {
    engine: null,
    runtimeState: null,
    activeSchemaId: null,
    initialized: false,
    isHydrating: false,
    error: null
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
      set({ isHydrating: true, error: null });

      try {
        cleanupRuntimeSubscription();

        const engine = createRuntimeEngine(schema);
        unsubscribeRuntime = engine.subscribe((runtimeState) => {
          set({ runtimeState, error: null });
        });

        const runtimeState = engine.getState();

        set({
          engine,
          runtimeState,
          activeSchemaId: schemaId,
          initialized: true,
          isHydrating: false,
          error: null
        });

        intakeLogger.debug('initialize success', {
          schemaId,
          visibleQuestionCount: runtimeState.visibleQuestions.length
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
          isHydrating: false
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

    if (!engine) {
      const error = new Error('Intake engine is not initialized.');
      intakeLogger.error('updateAnswer failed', { nodeId, error });
      emitIntakeError(set, 'Intake update failed', 'The intake flow is not ready yet.', error);
      throw error;
    }

    if (!isIntakeAnswerValue(value)) {
      const error = new Error('Unsupported intake answer value.');
      intakeLogger.warn('updateAnswer rejected invalid value', { nodeId, valueType: typeof value });
      emitIntakeError(set, 'Intake update failed', 'The provided answer value is not supported.', error);
      throw error;
    }

    try {
      engine.updateAnswer(nodeId, value);
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
      set({ runtimeState, error: null });
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

        set({
          ...createInitialState()
        });
      }
    }),
    { delay: 500 }
  )
);

export function stopIntakeSubscription() {
  cleanupRuntimeSubscription();
}
