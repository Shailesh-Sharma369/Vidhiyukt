import { useCallback } from 'react';
import { useIntakeStore } from '@/store/intakeStore';

export function useQuestionErrors(questionId: string) {
  const errorArray = useIntakeStore((state) => state.errors[questionId] ?? []);
  const touched = useIntakeStore((state) => state.touched[questionId] ?? false);
  const markTouched = useIntakeStore((state) => state.markTouched);

  const onBlur = useCallback(() => {
    if (!touched) {
      markTouched(questionId);
    }
  }, [touched, markTouched, questionId]);

  const errors = touched ? errorArray : [];
  return { errors, onBlur, hasErrors: errors.length > 0 };
}