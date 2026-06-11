// src/store/middleware/autoSaveMiddleware.ts

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { createLogger } from '@/lib/logger';
import { saveIntakeDraft } from '@/lib/persistence/intakePersistence';
import { useAuthStore } from '@/store/authStore';
import type { IntakeAnswerValue } from '@/types';

declare global {
  interface Window {
    __INTAKE_REPLAYING__?: boolean;
  }
}

type AutoSaveRuntimeState = {
  answers: Record<string, IntakeAnswerValue>;
};

type AutoSaveStateSlice = {
  runtimeState: AutoSaveRuntimeState | null;
  activeSchemaId: string | null;
};

type AutoSaveOptions = {
  delay?: number;
};

const autoSaveLogger = createLogger('intake][autosave');
const DEFAULT_AUTO_SAVE_DELAY_MS = 500;

let autoSaveTimerId: number | null = null;
let lastQueuedSignature: string | null = null;
let lastSavedSignature: string | null = null;

function cloneAnswers(
  answers: Readonly<Record<string, IntakeAnswerValue>>
): Record<string, IntakeAnswerValue> {
  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])
  );
}

function normalizeAnswers(
  answers: Readonly<Record<string, IntakeAnswerValue>>
): Record<string, IntakeAnswerValue> {
  return Object.fromEntries(
    Object.entries(answers)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])
  );
}

function buildAutoSaveSignature(
  userId: string,
  schemaId: string,
  answers: Readonly<Record<string, IntakeAnswerValue>>
): string {
  return JSON.stringify({
    userId,
    schemaId,
    answers: normalizeAnswers(answers)
  });
}

function clearTimer(): void {
  if (typeof window !== 'undefined' && autoSaveTimerId !== null) {
    window.clearTimeout(autoSaveTimerId);
  }
  autoSaveTimerId = null;
}

export function resetAutoSaveState(): void {
  clearTimer();
  lastQueuedSignature = null;
  lastSavedSignature = null;
}

function isReplayingHydration(): boolean {
  return typeof window !== 'undefined' && window.__INTAKE_REPLAYING__ === true;
}

function havePersistenceInputsChanged<T extends AutoSaveStateSlice>(previousState: T, nextState: T): boolean {
  return (
    previousState.activeSchemaId !== nextState.activeSchemaId ||
    previousState.runtimeState !== nextState.runtimeState
  );
}

function scheduleAutoSave<T extends AutoSaveStateSlice>(state: T, delay: number): void {
  if (typeof window === 'undefined' || isReplayingHydration()) {
    clearTimer();
    return;
  }

  const schemaId = state.activeSchemaId;
  const runtimeState = state.runtimeState;

  if (!schemaId || !runtimeState) {
    clearTimer();
    return;
  }

  const userId = useAuthStore.getState().user?.uid ?? 'guest';
  const answersSnapshot = cloneAnswers(runtimeState.answers);
  const signature = buildAutoSaveSignature(userId, schemaId, answersSnapshot);

  if (signature === lastSavedSignature || signature === lastQueuedSignature) {
    return;
  }

  clearTimer();
  lastQueuedSignature = signature;

  autoSaveTimerId = window.setTimeout(() => {
    autoSaveTimerId = null;

    void (async () => {
      try {
        await saveIntakeDraft(userId, schemaId, {
          answers: answersSnapshot,
          currentStep: 0,
          timestamp: new Date().toISOString()
        });
        lastSavedSignature = signature;
      } catch (error) {
        autoSaveLogger.warn('autosave failed', { error, schemaId, userId });
      } finally {
        if (lastQueuedSignature === signature) {
          lastQueuedSignature = null;
        }
      }
    })();
  }, delay);
}

/**
 * Fixed middleware – uses a type‑safe wrapper for `set`
 */
export function autoSave<T extends AutoSaveStateSlice>(
  config: StateCreator<T, [], []>,
  options?: AutoSaveOptions
): StateCreator<T, [], []> {
  const delay = options?.delay ?? DEFAULT_AUTO_SAVE_DELAY_MS;

  return (set, get, api) => {
    const wrappedSet: typeof set = (state, replace) => {
      const previousState = get();
      // Use type assertion to bypass overload resolution
      (set as any)(state, replace);
      const nextState = get();
      if (havePersistenceInputsChanged(previousState, nextState)) {
        scheduleAutoSave(nextState, delay);
      }
    };

    return config(wrappedSet, get, api);
  };
}