import type { IntakeAnswerMap, IntakeSchema, Question } from '@/types';
import { getQuestionById, getSectionQuestions, getVisibleQuestions as getVisibleQuestionsFromSchemaHelpers, isQuestionVisible } from '../schemaHelpers';

export function getVisibleQuestions(schema: IntakeSchema, answers: IntakeAnswerMap = {}): Question[] {
  return getVisibleQuestionsFromSchemaHelpers(schema, answers);
}

export function getVisibleSectionIds(schema: IntakeSchema, answers: IntakeAnswerMap = {}): string[] {
  const visibleQuestionIds = new Set(getVisibleQuestions(schema, answers).map((question) => question.id));

  return [...schema.sections]
    .sort((left, right) => left.order - right.order)
    .filter((section) => getSectionQuestions(schema, section.id).some((question) => visibleQuestionIds.has(question.id)))
    .map((section) => section.id);
}

export function isQuestionVisibleById(schema: IntakeSchema, questionId: string, answers: IntakeAnswerMap = {}): boolean {
  const question = getQuestionById(schema, questionId);

  if (!question) {
    return false;
  }

  return isQuestionVisible(schema, question, answers);
}