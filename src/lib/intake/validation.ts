import type { IntakeAnswerMap, Question, IntakeSchema } from '@/types';
import { isQuestionVisible } from './schemaHelpers';

function isEmptyValue(value: unknown): boolean {
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumericValue(value: unknown): value is number | string {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return !Number.isNaN(Number(value));
  }

  return false;
}

function getAllowedOptions(question: Question): ReadonlySet<string> {
  return new Set(question.options?.map((option) => option.value) ?? []);
}

function getSelectionBounds(question: Question): { minSelections?: number; maxSelections?: number } {
  return {
    minSelections: question.validation?.minSelections ?? question.validation?.minSelected,
    maxSelections: question.validation?.maxSelections ?? question.validation?.maxSelected
  };
}

function validateRequired(question: Question, value: unknown): string[] {
  if (!question.validation?.required) {
    return [];
  }

  if (isEmptyValue(value)) {
    return [question.validation.customErrorMessage ?? `${question.label} is required.`];
  }

  return [];
}

function validateTextLike(question: Question, value: unknown): string[] {
  const errors: string[] = [];

  if (isEmptyValue(value)) {
    return errors;
  }

  const isNumericMode = question.inputMode === 'numeric';
  const isStringValue = typeof value === 'string';

  if (isNumericMode) {
    if (!isNumericValue(value)) {
      errors.push(question.validation?.customErrorMessage ?? `${question.label} must be numeric.`);
      return errors;
    }

    const numericText = isStringValue ? value : String(value);
    const numericValue = typeof value === 'number' ? value : Number(value);

    if (question.validation?.minLength !== undefined && numericText.length < question.validation.minLength) {
      errors.push(question.validation.customErrorMessage ?? `${question.label} must be at least ${question.validation.minLength} characters.`);
    }

    if (question.validation?.maxLength !== undefined && numericText.length > question.validation.maxLength) {
      errors.push(question.validation.customErrorMessage ?? `${question.label} must be at most ${question.validation.maxLength} characters.`);
    }

    if (question.validation?.min !== undefined && numericValue < question.validation.min) {
      errors.push(question.validation.customErrorMessage ?? `${question.label} must be at least ${question.validation.min}.`);
    }

    if (question.validation?.max !== undefined && numericValue > question.validation.max) {
      errors.push(question.validation.customErrorMessage ?? `${question.label} must be at most ${question.validation.max}.`);
    }

    return errors;
  }

  if (!isStringValue) {
    errors.push(`${question.label} must be a string.`);
    return errors;
  }

  const textValue = isStringValue ? value : String(value);
  const validation = question.validation;

  if (validation?.minLength !== undefined && textValue.length < validation.minLength) {
    errors.push(validation.customErrorMessage ?? `${question.label} must be at least ${validation.minLength} characters.`);
  }

  if (validation?.maxLength !== undefined && textValue.length > validation.maxLength) {
    errors.push(validation.customErrorMessage ?? `${question.label} must be at most ${validation.maxLength} characters.`);
  }

  if (validation?.pattern) {
    let pattern: RegExp;

    try {
      pattern = new RegExp(validation.pattern);
    } catch {
      errors.push(validation.customErrorMessage ?? `${question.label} has an invalid validation pattern.`);
      return errors;
    }

    if (!pattern.test(textValue)) {
      errors.push(validation.customErrorMessage ?? `${question.label} format is invalid.`);
    }
  }

  if (isNumericMode && !isNumericValue(value)) {
    errors.push(validation?.customErrorMessage ?? `${question.label} must be numeric.`);
  }

  return errors;
}

function validateChoice(question: Question, value: unknown): string[] {
  const errors: string[] = [];

  if (isEmptyValue(value)) {
    return errors;
  }

  if (typeof value !== 'string') {
    errors.push(`${question.label} must be a string selection.`);
    return errors;
  }

  const allowedOptions = getAllowedOptions(question);

  if (allowedOptions.size > 0 && !allowedOptions.has(value)) {
    errors.push(`${question.label} contains an invalid option "${value}".`);
  }

  return errors;
}

function validateMultiSelect(question: Question, value: unknown): string[] {
  const errors: string[] = [];

  if (isEmptyValue(value)) {
    return errors;
  }

  if (!isStringArray(value)) {
    errors.push(`${question.label} must be an array of string selections.`);
    return errors;
  }

  const allowedOptions = getAllowedOptions(question);

  for (const selectedValue of value) {
    if (allowedOptions.size > 0 && !allowedOptions.has(selectedValue)) {
      errors.push(`${question.label} contains an invalid option "${selectedValue}".`);
    }
  }

  const bounds = getSelectionBounds(question);

  if (bounds.minSelections !== undefined && value.length < bounds.minSelections) {
    errors.push(question.validation?.customErrorMessage ?? `${question.label} must select at least ${bounds.minSelections} option(s).`);
  }

  if (bounds.maxSelections !== undefined && value.length > bounds.maxSelections) {
    errors.push(question.validation?.customErrorMessage ?? `${question.label} must select at most ${bounds.maxSelections} option(s).`);
  }

  return errors;
}

function validateCheckbox(question: Question, value: unknown): string[] {
  if (isEmptyValue(value)) {
    return [];
  }

  return typeof value === 'boolean' ? [] : [`${question.label} must be true or false.`];
}

function validateNumericBounds(question: Question, value: unknown): string[] {
  if (isEmptyValue(value)) {
    return [];
  }

  if (!isNumericValue(value)) {
    return [question.validation?.customErrorMessage ?? `${question.label} must be numeric.`];
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  const errors: string[] = [];

  if (question.validation?.min !== undefined && numericValue < question.validation.min) {
    errors.push(question.validation.customErrorMessage ?? `${question.label} must be at least ${question.validation.min}.`);
  }

  if (question.validation?.max !== undefined && numericValue > question.validation.max) {
    errors.push(question.validation.customErrorMessage ?? `${question.label} must be at most ${question.validation.max}.`);
  }

  return errors;
}

export function validateQuestionAnswer(question: Question, value: unknown): string[] {
  const errors: string[] = [];

  errors.push(...validateRequired(question, value));

  if (errors.length > 0 || isEmptyValue(value)) {
    return errors;
  }

  switch (question.type) {
    case 'text':
    case 'textarea':
      errors.push(...validateTextLike(question, value));
      break;
    case 'select':
    case 'radio':
      errors.push(...validateChoice(question, value));
      break;
    case 'checkbox':
      errors.push(...validateCheckbox(question, value));
      break;
    case 'multiselect':
      errors.push(...validateMultiSelect(question, value));
      break;
  }

  if (question.inputMode !== 'numeric' && (question.validation?.min !== undefined || question.validation?.max !== undefined)) {
    errors.push(...validateNumericBounds(question, value));
  }

  return errors;
}

export function validateSchemaAnswers(schema: IntakeSchema, answers: IntakeAnswerMap): Record<string, string[]> {
  const validationErrors: Record<string, string[]> = {};

  for (const question of schema.questions) {
    if (!isQuestionVisible(schema, question, answers)) {
      continue;
    }

    const answerValue = answers[question.id] ?? question.defaultValue;
    const questionErrors = validateQuestionAnswer(question, answerValue);

    if (questionErrors.length > 0) {
      validationErrors[question.id] = questionErrors;
    }
  }

  return validationErrors;
}