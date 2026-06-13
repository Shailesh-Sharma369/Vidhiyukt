// lib/intake-ui/progressHelpers.ts

import type { Question, IntakeAnswerValue } from '@/types';
import { isQuestionComplete } from '@/lib/intake/runtime/completionEngine';

export function computeProgressPercentage(
  visibleQuestions: Question[],
  answers: Record<string, IntakeAnswerValue>
): number {
  const total = visibleQuestions.length;
  if (total === 0) return 100;
  const answered = visibleQuestions.filter((q) =>
    isQuestionComplete(q, answers[q.id] ?? q.defaultValue)
  ).length;
  return Math.round((answered / total) * 100);
}