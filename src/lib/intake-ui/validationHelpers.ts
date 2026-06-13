// lib/intake-ui/validationHelpers.ts

import type { IntakeSchema, IntakeAnswerMap } from '@/types';
import { validateSchemaAnswers } from '@/lib/intake/validation';

/**
 * Single source of truth for computing validation errors.
 * Pure function – no side effects.
 */
export function computeErrors(schema: IntakeSchema, answers: IntakeAnswerMap): Record<string, string[]> {
  return validateSchemaAnswers(schema, answers);
}