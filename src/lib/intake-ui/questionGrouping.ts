// lib/intake-ui/questionGrouping.ts

import type { IntakeSchema, Question } from '@/types';
import type { QuestionSection } from './types';

/**
 * Groups visible questions by their section, preserving section order.
 */
export function groupQuestionsBySection(
  schema: IntakeSchema,
  visibleQuestions: Question[]
): QuestionSection[] {
  const sectionMap = new Map<string, QuestionSection>();

  // Initialize sections from schema (preserves order)
  for (const section of schema.sections) {
    sectionMap.set(section.id, {
      sectionId: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      questions: [],
    });
  }

  // Add visible questions to their sections
  for (const question of visibleQuestions) {
    const section = sectionMap.get(question.sectionId);
    if (section) {
      section.questions.push(question);
    }
  }

  // Filter out sections with no visible questions, sort by order
  return Array.from(sectionMap.values())
    .filter((section) => section.questions.length > 0)
    .sort((a, b) => a.order - b.order);
}