import type {
  ConditionalRule,
  IntakeAnswerMap,
  IntakeAnswerValue,
  IntakeSchema,
  IntakeSchemaDefinition,
  Question,
  QuestionDefinition,
  QuestionValidation,
  UserAnswer
} from '@/types';

const DEFAULT_SCHEMA_TIMESTAMP = '2026-05-30T00:00:00.000Z';

export interface SchemaIntegrityIssue {
  code: string;
  path: string;
  message: string;
}

export class SchemaIntegrityError extends Error {
  readonly issues: SchemaIntegrityIssue[];

  constructor(schemaId: string, issues: SchemaIntegrityIssue[]) {
    super(`Schema integrity validation failed for ${schemaId}: ${issues.length} issue(s)`);
    this.name = 'IntakeSchemaIntegrityError';
    this.issues = issues;
  }
}

function createIssue(code: string, path: string, message: string): SchemaIntegrityIssue {
  return { code, path, message };
}

function normalizeValidationMetadata(validation?: QuestionValidation): QuestionValidation | undefined {
  if (!validation) {
    return undefined;
  }

  return {
    ...validation,
    minSelections: validation.minSelections ?? validation.minSelected,
    maxSelections: validation.maxSelections ?? validation.maxSelected
  };
}

function cloneQuestionDefinition(question: QuestionDefinition): Question {
  if (!question.semanticKey) {
    throw new Error(`Question ${question.id} is missing a semantic key.`);
  }

  return {
    ...question,
    semanticKey: question.semanticKey,
    validation: normalizeValidationMetadata(question.validation),
    options: question.options ? [...question.options] : undefined,
    defaultValue: Array.isArray(question.defaultValue) ? [...question.defaultValue] : question.defaultValue,
    aiMetadata: question.aiMetadata
      ? {
          ...question.aiMetadata,
          complianceFrameworks: question.aiMetadata.complianceFrameworks ? [...question.aiMetadata.complianceFrameworks] : undefined,
          promptHints: question.aiMetadata.promptHints ? [...question.aiMetadata.promptHints] : undefined,
          complianceTags: question.aiMetadata.complianceTags ? [...question.aiMetadata.complianceTags] : undefined
        }
      : undefined,
    conditionalRules: question.conditionalRules ? question.conditionalRules.map(normalizeConditionalRule) : undefined
      } as Question;
}

export function normalizeConditionalRule(rule: ConditionalRule): ConditionalRule {
  return {
    ...rule,
    dependsOn: Array.isArray(rule.dependsOn) ? [...rule.dependsOn] : rule.dependsOn,
    conditions: rule.conditions ? [...rule.conditions] : undefined,
    targetQuestionIds: rule.targetQuestionIds ? [...rule.targetQuestionIds] : undefined
  };
}

export function validateSchemaIntegrity(schema: IntakeSchemaDefinition): void {
  const issues: SchemaIntegrityIssue[] = [];
  const questionIds = new Set<string>();
  const semanticKeys = new Set<string>();
  const sectionsById = new Map<string, number>();

  for (const section of schema.sections) {
    const existingCount = sectionsById.get(section.id) ?? 0;
    sectionsById.set(section.id, existingCount + 1);
  }

  for (const [sectionId, count] of sectionsById.entries()) {
    if (count > 1) {
      issues.push(createIssue('duplicate_section_id', `sections.${sectionId}`, `Duplicate section id "${sectionId}".`));
    }
  }

  const sectionIds = new Set(schema.sections.map((section) => section.id));
  const questionById = new Map<string, QuestionDefinition>();

  for (const question of schema.questions) {
    if (questionIds.has(question.id)) {
      issues.push(createIssue('duplicate_question_id', `questions.${question.id}`, `Duplicate question id "${question.id}".`));
    } else {
      questionIds.add(question.id);
      questionById.set(question.id, question);
    }

    if (!question.semanticKey || question.semanticKey.trim().length === 0) {
      issues.push(createIssue('missing_semantic_key', `questions.${question.id}.semanticKey`, `Question "${question.id}" is missing a semantic key.`));
    } else if (semanticKeys.has(question.semanticKey)) {
      issues.push(createIssue('duplicate_semantic_key', `questions.${question.id}.semanticKey`, `Duplicate semantic key "${question.semanticKey}".`));
    } else {
      semanticKeys.add(question.semanticKey);
    }

    if (!sectionIds.has(question.sectionId)) {
      issues.push(createIssue('orphan_section_reference', `questions.${question.id}.sectionId`, `Question "${question.id}" references unknown section "${question.sectionId}".`));
    }
  }

  for (const section of schema.sections) {
    if (section.questionIds.length === 0) {
      issues.push(createIssue('empty_section', `sections.${section.id}.questionIds`, `Section "${section.id}" does not contain any questions.`));
    }

    for (const questionId of section.questionIds) {
      if (!questionById.has(questionId)) {
        issues.push(createIssue('invalid_question_reference', `sections.${section.id}.questionIds`, `Section "${section.id}" references unknown question id "${questionId}".`));
        continue;
      }

      const referencedQuestion = questionById.get(questionId);

      if (referencedQuestion && referencedQuestion.sectionId !== section.id) {
        issues.push(createIssue('orphan_section_reference', `sections.${section.id}.questionIds`, `Section "${section.id}" references question "${questionId}" whose sectionId is "${referencedQuestion.sectionId}".`));
      }
    }
  }

  for (const question of schema.questions) {
    for (const rule of question.conditionalRules ?? []) {
      const dependsOnReferences = Array.isArray(rule.dependsOn) ? rule.dependsOn : [rule.dependsOn];

      for (const reference of dependsOnReferences) {
        if (!questionIds.has(reference) && !semanticKeys.has(reference)) {
          issues.push(createIssue('invalid_conditional_reference', `questions.${question.id}.conditionalRules.dependsOn`, `Question "${question.id}" has a conditional reference to unknown question "${reference}".`));
        }
      }

      for (const targetQuestionId of rule.targetQuestionIds ?? []) {
        if (!questionIds.has(targetQuestionId) && !semanticKeys.has(targetQuestionId)) {
          issues.push(createIssue('invalid_conditional_reference', `questions.${question.id}.conditionalRules.targetQuestionIds`, `Question "${question.id}" has a conditional target reference to unknown question "${targetQuestionId}".`));
        }
      }

      for (const condition of rule.conditions ?? []) {
        if (!questionIds.has(condition.questionId) && !semanticKeys.has(condition.questionId)) {
          issues.push(createIssue('invalid_conditional_reference', `questions.${question.id}.conditionalRules.conditions`, `Question "${question.id}" references unknown condition question "${condition.questionId}".`));
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new SchemaIntegrityError(schema.id, issues);
  }
}

export function finalizeIntakeSchema(schema: IntakeSchemaDefinition): IntakeSchema {
  validateSchemaIntegrity(schema);

  const normalizedQuestions = schema.questions.map(cloneQuestionDefinition);

  return {
    ...schema,
    schemaId: schema.schemaId ?? schema.id,
    createdAt: schema.createdAt ?? DEFAULT_SCHEMA_TIMESTAMP,
    updatedAt: schema.updatedAt ?? DEFAULT_SCHEMA_TIMESTAMP,
    sections: schema.sections.map((section) => ({
      ...section,
      questionIds: [...section.questionIds]
    })),
    questions: normalizedQuestions
  };
}

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

function resolveQuestionAnswer(schema: IntakeSchema, reference: string, answers: IntakeAnswerMap): IntakeAnswerValue | undefined {
  const byId = getQuestionById(schema, reference);

  if (byId) {
    return resolveAnswerValue(byId, answers);
  }

  const bySemanticKey = getQuestionBySemanticKey(schema, reference);

  return bySemanticKey ? resolveAnswerValue(bySemanticKey, answers) : answers[reference];
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

function toComparableNumber(value: IntakeAnswerValue | undefined): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? undefined : parsedValue;
  }

  return undefined;
}

function evaluateConditionalCondition(answerValue: IntakeAnswerValue | undefined, rule: ConditionalRule): boolean {
  switch (rule.operator) {
    case 'exists':
      return !isEmptyAnswer(answerValue);
    case 'equals':
      return answerValue === rule.value;
    case 'not_equals':
      return answerValue !== rule.value;
    case 'includes':
      if (Array.isArray(answerValue) && typeof rule.value === 'string') {
        return answerValue.includes(rule.value);
      }

      if (typeof answerValue === 'string' && typeof rule.value === 'string') {
        return answerValue.includes(rule.value);
      }

      return false;
    case 'not_includes':
      return !evaluateConditionalCondition(answerValue, { ...rule, operator: 'includes' });
    case 'greater_than': {
      const actualValue = toComparableNumber(answerValue);
      const expectedValue = toComparableNumber(rule.value);
      return actualValue !== undefined && expectedValue !== undefined ? actualValue > expectedValue : false;
    }
    case 'less_than': {
      const actualValue = toComparableNumber(answerValue);
      const expectedValue = toComparableNumber(rule.value);
      return actualValue !== undefined && expectedValue !== undefined ? actualValue < expectedValue : false;
    }
  }
}

function evaluateRuleDependencies(rule: ConditionalRule, answers: IntakeAnswerMap, schema: IntakeSchema): boolean {
  const references = Array.isArray(rule.dependsOn) ? rule.dependsOn : [rule.dependsOn];

  if (rule.combinator === 'OR') {
    return references.some((reference) => evaluateConditionalCondition(resolveQuestionAnswer(schema, reference, answers), rule));
  }

  return references.every((reference) => evaluateConditionalCondition(resolveQuestionAnswer(schema, reference, answers), rule));
}

export function getQuestionById(schema: IntakeSchema, questionId: string): Question | undefined {
  return schema.questions.find((question) => question.id === questionId);
}

export function getQuestionBySemanticKey(schema: IntakeSchema, semanticKey: string): Question | undefined {
  return schema.questions.find((question) => question.semanticKey === semanticKey);
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

export function evaluateConditionalRules(rules: readonly ConditionalRule[] | undefined, answers: IntakeAnswerMap, schema: IntakeSchema): boolean {
  if (!rules || rules.length === 0) {
    return false;
  }

  return rules.some((rule) => evaluateRuleDependencies(rule, answers, schema));
}

export function isQuestionVisible(schema: IntakeSchema, question: Question, answers: IntakeAnswerMap = {}): boolean {
  if (!question.conditionalRules || question.conditionalRules.length === 0) {
    return true;
  }

  const showRules = question.conditionalRules.filter((rule) => (rule.visibility ?? rule.action) === 'show');
  const hideRules = question.conditionalRules.filter((rule) => (rule.visibility ?? rule.action) === 'hide');

  // A show rule is authoritative: if one exists, visibility depends only on that rule.
  if (showRules.length > 0) {
    return evaluateRuleDependencies(showRules[0], answers, schema);
  }

  // Without a show rule, the question stays visible unless any hide rule matches.
  return !hideRules.some((rule) => evaluateRuleDependencies(rule, answers, schema));
}

export function getDependentQuestions(schema: IntakeSchema, questionReference: string): Question[] {
  return schema.questions
    .filter((question) =>
      (question.conditionalRules ?? []).some((rule) => {
        const references = Array.isArray(rule.dependsOn) ? rule.dependsOn : [rule.dependsOn];
        if (references.includes(questionReference)) {
          return true;
        }

        if (rule.targetQuestionIds?.includes(questionReference)) {
          return true;
        }

        return (rule.conditions ?? []).some((condition) => condition.questionId === questionReference);
      })
    )
    .sort((left, right) => left.order - right.order);
}

export function getVisibleQuestions(schema: IntakeSchema, answers: IntakeAnswerMap = {}): Question[] {
  return [...schema.sections]
    .sort((left, right) => left.order - right.order)
    .flatMap((section) => getSectionQuestions(schema, section.id))
    .filter((question) => isQuestionVisible(schema, question, answers));
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