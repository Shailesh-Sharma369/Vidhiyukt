// lib/intake-ui/selectors.ts

import type { IntakeStore } from '@/store/intakeStore';
import type { Question, IntakeAnswerValue } from '@/types';

// Raw selectors – stable references (arrays/objects are fine if used with useShallow)
export const selectVisibleQuestions = (state: IntakeStore): Question[] =>
  state.runtimeState?.visibleQuestions ?? [];

export const selectAnswers = (state: IntakeStore): Record<string, IntakeAnswerValue> =>
  state.runtimeState?.answers ?? {};

export const selectErrors = (state: IntakeStore): Record<string, string[]> => state.errors;

export const selectTouched = (state: IntakeStore): Record<string, boolean> => state.touched;

export const selectIsDraftHydrated = (state: IntakeStore): boolean => state.isDraftHydrated;

export const selectCurrentSectionId = (state: IntakeStore): string | null => state.currentSectionId;

export const selectInitialized = (state: IntakeStore): boolean => state.initialized;

export const selectSchemaId = (state: IntakeStore): string | null => state.activeSchemaId;

export const selectRawVisibleQuestions = (state: IntakeStore): Question[] =>
  state.runtimeState?.visibleQuestions ?? [];

// For errors – returns an array but it's a direct slice of state.errors[questionId]
// This is safe because it returns a new array only when that specific question's errors change.
export const selectErrorsForQuestion = (questionId: string) => (state: IntakeStore): string[] => {
  const errors = state.errors[questionId];
  return errors ?? [];
};