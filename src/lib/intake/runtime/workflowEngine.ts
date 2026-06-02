import type { IntakeAnswerMap, IntakeSchema, Question } from '@/types';
import { getVisibleQuestions } from './visibilityEngine';

function getOrderedVisibleQuestions(schema: IntakeSchema, answers: IntakeAnswerMap): Question[] {
  return getVisibleQuestions(schema, answers);
}

export function getNextVisibleQuestion(schema: IntakeSchema, answers: IntakeAnswerMap, currentQuestionId: string): Question | null {
  const visibleQuestions = getOrderedVisibleQuestions(schema, answers);
  const currentIndex = visibleQuestions.findIndex((question) => question.id === currentQuestionId);

  if (currentIndex < 0 || currentIndex + 1 >= visibleQuestions.length) {
    return null;
  }

  return visibleQuestions[currentIndex + 1] ?? null;
}

export function getPreviousVisibleQuestion(schema: IntakeSchema, answers: IntakeAnswerMap, currentQuestionId: string): Question | null {
  const visibleQuestions = getOrderedVisibleQuestions(schema, answers);
  const currentIndex = visibleQuestions.findIndex((question) => question.id === currentQuestionId);

  if (currentIndex <= 0) {
    return null;
  }

  return visibleQuestions[currentIndex - 1] ?? null;
}

export function getNextVisibleSection(schema: IntakeSchema, answers: IntakeAnswerMap, currentSectionId: string): string | null {
  const visibleQuestions = getOrderedVisibleQuestions(schema, answers);
  const visibleSectionIds = [...schema.sections]
    .sort((left, right) => left.order - right.order)
    .filter((section) => visibleQuestions.some((question) => question.sectionId === section.id))
    .map((section) => section.id);

  const currentIndex = visibleSectionIds.findIndex((sectionId) => sectionId === currentSectionId);

  if (currentIndex < 0 || currentIndex + 1 >= visibleSectionIds.length) {
    return null;
  }

  return visibleSectionIds[currentIndex + 1] ?? null;
}

export function getPreviousVisibleSection(schema: IntakeSchema, answers: IntakeAnswerMap, currentSectionId: string): string | null {
  const visibleQuestions = getOrderedVisibleQuestions(schema, answers);
  const visibleSectionIds = [...schema.sections]
    .sort((left, right) => left.order - right.order)
    .filter((section) => visibleQuestions.some((question) => question.sectionId === section.id))
    .map((section) => section.id);

  const currentIndex = visibleSectionIds.findIndex((sectionId) => sectionId === currentSectionId);

  if (currentIndex <= 0) {
    return null;
  }

  return visibleSectionIds[currentIndex - 1] ?? null;
}