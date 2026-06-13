// lib/intake-ui/types.ts

import type { Question, IntakeAnswerValue } from '@/types';

/**
 * Group of questions belonging to the same section, with section metadata.
 */
export type QuestionSection = {
  sectionId: string;
  title: string;
  description?: string;
  order: number;
  questions: Question[];
};

/**
 * Props passed to every field component.
 */
export type FieldComponentProps = {
  question: Question;
  value: IntakeAnswerValue;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
};