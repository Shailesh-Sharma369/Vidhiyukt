import type { ConditionalCondition, IntakeAnswerMap, IntakeAnswerValue, IntakeSchema, Question, UserAnswer } from '@/types';

function getQuestionDefaultValue(question: Question): IntakeAnswerValue | undefined {
  switch (question.type) {
    case 'text':
    case 'textarea':
    case 'select':
    case 'radio':
      return question.defaultValue;
    case 'checkbox':
      return question.defaultValue;
    case 'multiselect':
      return question.defaultValue;
  }
}

function resolveAnswerValue(question: Question, answers: IntakeAnswerMap): IntakeAnswerValue | undefined {
  const answer = answers[question.id];
  return answer ?? getQuestionDefaultValue(question);
}

function isEmptyAnswer(value: IntakeAnswerValue | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function evaluateConditionValue(
  answerValue: IntakeAnswerValue | undefined,
  operator: ConditionalCondition['operator'],
  expectedValue?: IntakeAnswerValue
): boolean {
  switch (operator) {
    case 'exists':
      return !isEmptyAnswer(answerValue);
    case 'notExists':
      return isEmptyAnswer(answerValue);
    case 'equals':
      return answerValue === expectedValue;
    case 'notEquals':
      return answerValue !== expectedValue;
    case 'contains':
      if (Array.isArray(answerValue) && typeof expectedValue === 'string') {
        return answerValue.includes(expectedValue);
      }

      if (typeof answerValue === 'string' && typeof expectedValue === 'string') {
        return answerValue.includes(expectedValue);
      }

      return false;
    case 'notContains':
      return !evaluateConditionValue(answerValue, 'contains', expectedValue);
  }
}

function isRuleSatisfied(rule: NonNullable<Question['conditionalRules']>[number], answers: IntakeAnswerMap, schema: IntakeSchema): boolean {
  const logic = rule.logic ?? 'all';

  const conditionResults = rule.conditions.map((condition) => {
    const question = schema.questions.find((item) => item.id === condition.questionId);
    const answerValue = question ? resolveAnswerValue(question, answers) : answers[condition.questionId];
    return evaluateConditionValue(answerValue, condition.operator, condition.value);
  });

  return logic === 'all' ? conditionResults.every(Boolean) : conditionResults.some(Boolean);
}

export function getQuestionById(schema: IntakeSchema, questionId: string): Question | undefined {
  return schema.questions.find((question) => question.id === questionId);
}

export function getSectionQuestions(schema: IntakeSchema, sectionId: string): Question[] {
  const section = schema.sections.find((item) => item.id === sectionId);

  if (!section) {
    return [];
  }

  return section.questionIds
    .map((questionId) => getQuestionById(schema, questionId))
    .filter((question): question is Question => question !== undefined)
    .sort((left, right) => left.order - right.order);
}

export function getVisibleQuestions(schema: IntakeSchema, answers: IntakeAnswerMap = {}): Question[] {
  return [...schema.sections]
    .sort((left, right) => left.order - right.order)
    .flatMap((section) => getSectionQuestions(schema, section.id))
    .filter((question) => {
      if (!question.conditionalRules || question.conditionalRules.length === 0) {
        return true;
      }

      let shouldShow = true;

      for (const rule of question.conditionalRules) {
        if (!rule.targetQuestionIds.includes(question.id)) {
          continue;
        }

        const ruleMatches = isRuleSatisfied(rule, answers, schema);

        if (rule.action === 'hide' && ruleMatches) {
          return false;
        }

        if (rule.action === 'show') {
          shouldShow = shouldShow && ruleMatches;
        }
      }

      return shouldShow;
    });
}

export function getAnswersWithDefaults(schema: IntakeSchema, answers: ReadonlyArray<UserAnswer>): IntakeAnswerMap {
  const answerMap: Record<string, IntakeAnswerValue> = {};

  for (const answer of answers) {
    answerMap[answer.questionId] = answer.value;
  }

  for (const question of schema.questions) {
    if (answerMap[question.id] !== undefined) {
      continue;
    }

    const defaultValue = getQuestionDefaultValue(question);

    if (defaultValue !== undefined) {
      answerMap[question.id] = defaultValue;
    }
  }

  return answerMap;
}