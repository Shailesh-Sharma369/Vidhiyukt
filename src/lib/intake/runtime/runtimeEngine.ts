import type { IntakeAnswerMap, IntakeAnswerValue, IntakeSchema, Question } from '@/types';
import { getVisibleQuestions } from './visibilityEngine';
import { getProgress, isAIPayloadReady } from './completionEngine';
import { buildDependencyGraph } from './dependencyGraph';
import { getPreviousVisibleSection } from './workflowEngine';

export interface RuntimeState {
  answers: IntakeAnswerMap;
  visibleQuestions: Question[];
  visibleSectionIds: string[];
  progress: ReturnType<typeof getProgress>;
  aiPayloadReady: boolean;
  lastUpdated: string;
}

function cloneAnswers(answers: IntakeAnswerMap): Record<string, IntakeAnswerValue> {
  return { ...answers };
}

function cloneState(state: RuntimeState): RuntimeState {
  return structuredClone(state);
}

function areAnswerValuesEqual(left: IntakeAnswerValue | undefined, right: IntakeAnswerValue | undefined): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  return Object.is(left, right);
}

function getVisibleSectionIdsFromQuestions(
  schema: IntakeSchema,
  visibleQuestions: readonly Question[]
): string[] {
  const visibleQuestionSectionIds = new Set(visibleQuestions.map((question) => question.sectionId));

  return [...schema.sections]
    .sort((left, right) => left.order - right.order)
    .filter((section) => visibleQuestionSectionIds.has(section.id))
    .map((section) => section.id);
}

function createState(schema: IntakeSchema, answers: IntakeAnswerMap): RuntimeState {
  const visibleQuestions = getVisibleQuestions(schema, answers);
  const progress = getProgress(schema, answers, visibleQuestions);

  return {
    answers: cloneAnswers(answers),
    visibleQuestions,
    visibleSectionIds: getVisibleSectionIdsFromQuestions(schema, visibleQuestions),
    progress,
    aiPayloadReady: isAIPayloadReady(schema, answers, visibleQuestions),
    lastUpdated: new Date().toISOString()
  };
}

export function createRuntimeEngine(schema: IntakeSchema): {
  getState(): RuntimeState;
  updateAnswer(questionId: string, value: IntakeAnswerValue): RuntimeState;
  reset(answers?: IntakeAnswerMap): RuntimeState;
  subscribe(listener: (state: RuntimeState) => void): () => void;
  getNextQuestion(currentId: string): Question | null;
  getPreviousQuestion(currentId: string): Question | null;
  getPreviousSection(currentSectionId: string): string | null;
} {
  const dependencyGraph = buildDependencyGraph(schema);
  let state = createState(schema, {});
  const subscribers = new Set<(runtimeState: RuntimeState) => void>();

  const notify = (): void => {
    for (const listener of subscribers) {
      listener(cloneState(state));
    }
  };

  return {
    getState: () => cloneState(state),
    getNextQuestion: (currentId) => {
      const idx = state.visibleQuestions.findIndex((question) => question.id === currentId);

      return idx >= 0 && idx + 1 < state.visibleQuestions.length ? state.visibleQuestions[idx + 1] : null;
    },
    getPreviousQuestion: (currentId) => {
      const idx = state.visibleQuestions.findIndex((question) => question.id === currentId);

      return idx > 0 ? state.visibleQuestions[idx - 1] : null;
    },
    getPreviousSection: (currentSectionId) => getPreviousVisibleSection(schema, state.answers, currentSectionId),
    updateAnswer: (questionId, value) => {
      const previousValue = state.answers[questionId];

      if (areAnswerValuesEqual(previousValue, value)) {
        return cloneState(state);
      }

      const nextAnswers = cloneAnswers(state.answers);
      nextAnswers[questionId] = value;

      const nextVisibleQuestions = getVisibleQuestions(schema, nextAnswers);
      const progress = getProgress(schema, nextAnswers, nextVisibleQuestions);
      const aiPayloadReady = isAIPayloadReady(schema, nextAnswers, nextVisibleQuestions);

      state = {
        answers: cloneAnswers(nextAnswers),
        visibleQuestions: nextVisibleQuestions,
        visibleSectionIds: getVisibleSectionIdsFromQuestions(schema, nextVisibleQuestions),
        progress,
        aiPayloadReady,
        lastUpdated: new Date().toISOString()
      };

      notify();
      return cloneState(state);
    },
    reset: (answers = {}) => {
      state = createState(schema, answers);
      notify();
      return cloneState(state);
    },
    subscribe: (listener) => {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    }
  };
}