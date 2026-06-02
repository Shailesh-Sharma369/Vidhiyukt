import type { IntakeAnswerMap, IntakeAnswerValue, IntakeSchema, Question } from '@/types';
import { isEmptyValue } from '../validation';

export function isQuestionComplete(question: Question, value: IntakeAnswerValue | undefined): boolean {
  if (!question.validation?.required) {
    return true;
  }

  return !isEmptyValue(value);
}

export function getProgress(
  _schema: IntakeSchema,
  answers: IntakeAnswerMap,
  visibleQuestions: readonly Question[]
): {
  totalVisible: number;
  answeredVisible: number;
  percentage: number;
  requiredUnansweredIds: string[];
} {
  const totalVisible = visibleQuestions.length;
  const requiredUnansweredIds: string[] = [];
  let answeredVisible = 0;

  for (const question of visibleQuestions) {
    const value = answers[question.id] ?? question.defaultValue;
    const complete = isQuestionComplete(question, value);

    if (complete) {
      answeredVisible += 1;
    }

    if (question.validation?.required && !complete) {
      requiredUnansweredIds.push(question.id);
    }
  }

  return {
    totalVisible,
    answeredVisible,
    percentage: totalVisible === 0 ? 100 : Math.round((answeredVisible / totalVisible) * 100),
    requiredUnansweredIds
  };
}

export function isSectionComplete(schema: IntakeSchema, sectionId: string, answers: IntakeAnswerMap, visibleQuestions: readonly Question[]): boolean {
  const sectionQuestionIds = new Set(visibleQuestions.filter((question) => question.sectionId === sectionId).map((question) => question.id));

  if (sectionQuestionIds.size === 0) {
    return true;
  }

  return visibleQuestions
    .filter((question) => sectionQuestionIds.has(question.id))
    .every((question) => isQuestionComplete(question, answers[question.id] ?? question.defaultValue));
}

export function isIntakeComplete(schema: IntakeSchema, answers: IntakeAnswerMap, visibleQuestions: readonly Question[]): boolean {
  return visibleQuestions.every((question) => isQuestionComplete(question, answers[question.id] ?? question.defaultValue));
}

export function isAIPayloadReady(schema: IntakeSchema, answers: IntakeAnswerMap, visibleQuestions: readonly Question[]): boolean {
  return visibleQuestions.every((question) => {
    if (!question.aiMetadata?.affectsCompliance) {
      return true;
    }

    return !isEmptyValue(answers[question.id] ?? question.defaultValue);
  });
}