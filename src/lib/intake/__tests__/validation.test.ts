import { describe, expect, it } from 'vitest';
import type { IntakeAnswerMap, IntakeSchemaDefinition, Question } from '@/types';
import { finalizeIntakeSchema } from '../schemaHelpers';
import { validateQuestionAnswer, validateSchemaAnswers } from '../validation';

function createQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'question',
    sectionId: 'section',
    order: 1,
    semanticKey: 'question',
    type: 'text',
    label: 'Question',
    ...overrides
  } as Question;
}

function createValidationSchema(): ReturnType<typeof finalizeIntakeSchema> {
  const schemaDefinition = {
    id: 'validation-schema',
    documentType: 'Privacy Policy',
    title: 'Validation Schema',
    description: 'Schema for validation tests.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['country', 'tags', 'hidden_field', 'show_field']
      }
    ],
    questions: [
      {
        id: 'country',
        sectionId: 'main',
        order: 1,
        semanticKey: 'country',
        type: 'text',
        label: 'Country',
        validation: {
          required: true,
          minLength: 2,
          maxLength: 5,
          pattern: '^[A-Z]+$'
        }
      },
      {
        id: 'tags',
        sectionId: 'main',
        order: 2,
        semanticKey: 'tags',
        type: 'multiselect',
        label: 'Tags',
        options: [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
          { value: 'gamma', label: 'Gamma' }
        ],
        validation: {
          required: true,
          minSelections: 1,
          maxSelections: 2
        }
      },
      {
        id: 'hidden_field',
        sectionId: 'main',
        order: 3,
        semanticKey: 'hidden_field',
        type: 'text',
        label: 'Hidden field',
        validation: {
          required: true,
          minLength: 3
        },
        conditionalRules: [
          {
            dependsOn: 'show_field',
            operator: 'equals',
            value: 'show',
            combinator: 'AND',
            visibility: 'show'
          }
        ]
      },
      {
        id: 'show_field',
        sectionId: 'main',
        order: 4,
        semanticKey: 'show_field',
        type: 'text',
        label: 'Show field',
        validation: {
          required: false
        }
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

describe('validateQuestionAnswer', () => {
  it('returns a required error for empty string, empty array, undefined, and null', () => {
    const textQuestion = createQuestion({
      type: 'text',
      validation: { required: true },
      label: 'Text'
    });
    const multiSelectQuestion = createQuestion({
      type: 'multiselect',
      options: [{ value: 'a', label: 'A' }],
      validation: { required: true },
      label: 'Multi'
    });

    expect(validateQuestionAnswer(textQuestion, '')).toEqual(['Text is required.']);
    expect(validateQuestionAnswer(textQuestion, undefined)).toEqual(['Text is required.']);
    expect(validateQuestionAnswer(textQuestion, null)).toEqual(['Text is required.']);
    expect(validateQuestionAnswer(multiSelectQuestion, [])).toEqual(['Multi is required.']);
  });

  it('accepts non-empty values for required fields across supported types', () => {
    const textQuestion = createQuestion({ type: 'text', validation: { required: true }, label: 'Text' });
    const selectQuestion = createQuestion({
      type: 'select',
      options: [{ value: 'one', label: 'One' }],
      validation: { required: true },
      label: 'Select'
    });
    const multiSelectQuestion = createQuestion({
      type: 'multiselect',
      options: [{ value: 'one', label: 'One' }],
      validation: { required: true },
      label: 'Multi'
    });
    const checkboxQuestion = createQuestion({ type: 'checkbox', validation: { required: true }, label: 'Checkbox' });

    expect(validateQuestionAnswer(textQuestion, 'value')).toEqual([]);
    expect(validateQuestionAnswer(selectQuestion, 'one')).toEqual([]);
    expect(validateQuestionAnswer(multiSelectQuestion, ['one'])).toEqual([]);
    expect(validateQuestionAnswer(checkboxQuestion, true)).toEqual([]);
  });

  it('enforces minLength and maxLength for text answers', () => {
    const question = createQuestion({
      type: 'text',
      validation: { minLength: 3, maxLength: 5 },
      label: 'Text'
    });

    expect(validateQuestionAnswer(question, 'ab')).toEqual(['Text must be at least 3 characters.']);
    expect(validateQuestionAnswer(question, 'abcde')).toEqual([]);
    expect(validateQuestionAnswer(question, 'abcdef')).toEqual(['Text must be at most 5 characters.']);
  });

  it('enforces numeric min and max bounds and rejects NaN and Infinity', () => {
    const question = createQuestion({
      type: 'text',
      inputMode: 'numeric',
      validation: { min: 3, max: 10 },
      label: 'Number'
    });

    expect(validateQuestionAnswer(question, 2)).toEqual(['Number must be at least 3.']);
    expect(validateQuestionAnswer(question, '7')).toEqual([]);
    expect(validateQuestionAnswer(question, 11)).toEqual(['Number must be at most 10.']);
    expect(validateQuestionAnswer(question, NaN)).toEqual(['Number must be numeric.']);
    expect(validateQuestionAnswer(question, Infinity)).toEqual(['Number must be numeric.']);
  });

  it('enforces minSelections and maxSelections for multiselect answers', () => {
    const question = createQuestion({
      type: 'multiselect',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' }
      ],
      validation: { minSelections: 2, maxSelections: 3 },
      label: 'Selections'
    });

    expect(validateQuestionAnswer(question, ['a'])).toEqual(['Selections must select at least 2 option(s).']);
    expect(validateQuestionAnswer(question, ['a', 'b'])).toEqual([]);
    expect(validateQuestionAnswer(question, ['a', 'b', 'c', 'a'])).toEqual(['Selections must select at most 3 option(s).']);
  });

  it('validates regular expressions and returns a friendly error for invalid patterns', () => {
    const question = createQuestion({
      type: 'text',
      validation: { pattern: '^[A-Z]+$' },
      label: 'Code'
    });
    const invalidPatternQuestion = createQuestion({
      type: 'text',
      validation: { pattern: '[' },
      label: 'Broken Pattern'
    });

    expect(validateQuestionAnswer(question, 'ABC')).toEqual([]);
    expect(validateQuestionAnswer(question, 'Abc')).toEqual(['Code format is invalid.']);
    expect(validateQuestionAnswer(invalidPatternQuestion, 'any value')).toEqual(['Broken Pattern has an invalid validation pattern.']);
  });

  it('rejects invalid options for select and multiselect answers', () => {
    const selectQuestion = createQuestion({
      type: 'select',
      options: [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' }
      ],
      label: 'Select'
    });
    const multiQuestion = createQuestion({
      type: 'multiselect',
      options: [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' }
      ],
      label: 'Multi'
    });

    expect(validateQuestionAnswer(selectQuestion, 'three')).toEqual(['Select contains an invalid option "three".']);
    expect(validateQuestionAnswer(multiQuestion, ['one', 'three'])).toEqual(['Multi contains an invalid option "three".']);
  });

  it('rejects wrong types for text and multiselect questions', () => {
    const textQuestion = createQuestion({ type: 'text', label: 'Text' });
    const multiQuestion = createQuestion({ type: 'multiselect', label: 'Multi' });

    expect(validateQuestionAnswer(textQuestion, true)).toEqual(['Text must be a string.']);
    expect(validateQuestionAnswer(multiQuestion, 42)).toEqual(['Multi must be an array of string selections.']);
  });

  it('short-circuits empty optional values before running non-required validation rules', () => {
    const question = createQuestion({
      type: 'text',
      validation: {
        minLength: 10,
        pattern: '^[a-z]+$'
      },
      label: 'Optional text'
    });

    expect(validateQuestionAnswer(question, undefined)).toEqual([]);
    expect(validateQuestionAnswer(question, null)).toEqual([]);
    expect(validateQuestionAnswer(question, '')).toEqual([]);
    expect(validateQuestionAnswer(question, [])).toEqual([]);
  });

  it('handles long strings and special regex characters without throwing', () => {
    const question = createQuestion({
      type: 'text',
      validation: { pattern: '^hello\nworld$' },
      label: 'Long text'
    });

    const longValue = `${'a'.repeat(1000)}!@#$%^&*()[]{}|`;

    expect(validateQuestionAnswer(question, longValue)).toEqual(['Long text format is invalid.']);
    expect(validateQuestionAnswer(question, 'hello\nworld')).toEqual([]);
  });
});

describe('validateSchemaAnswers', () => {
  it('returns validation errors only for visible questions', () => {
    const schema = createValidationSchema();
    const answers: IntakeAnswerMap = {
      country: 'US',
      tags: ['alpha'],
      hidden_field: '',
      show_field: 'hide'
    };

    const errors = validateSchemaAnswers(schema, answers);

    expect(errors.country).toBeUndefined();
    expect(errors.tags).toBeUndefined();
    expect(errors.hidden_field).toBeUndefined();
    expect(errors.show_field).toBeUndefined();
  });

  it('validates visible questions and ignores hidden question answers entirely', () => {
    const schema = createValidationSchema();
    const answers: IntakeAnswerMap = {
      country: 'u',
      tags: ['alpha', 'delta'],
      hidden_field: '',
      show_field: 'show'
    };

    const errors = validateSchemaAnswers(schema, answers);

    expect(errors.country).toEqual(['Country must be at least 2 characters.', 'Country format is invalid.']);
    expect(errors.tags).toEqual(['Tags contains an invalid option "delta".']);
    expect(errors.hidden_field).toEqual(['Hidden field is required.']);
  });

  it('handles very large multiselect answers without losing invalid-option detection', () => {
    const schemaDefinition = {
      id: 'large-array-schema',
      documentType: 'Privacy Policy',
      title: 'Large Array Schema',
      description: 'Schema for large array validation.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        {
          id: 'main',
          title: 'Main',
          order: 1,
          questionIds: ['tags']
        }
      ],
      questions: [
        {
          id: 'tags',
          sectionId: 'main',
          order: 1,
          semanticKey: 'tags',
          type: 'multiselect',
          label: 'Tags',
          options: [{ value: 'allowed', label: 'Allowed' }],
          validation: { maxSelections: 1000 }
        }
      ]
    } satisfies IntakeSchemaDefinition;

    const schema = finalizeIntakeSchema(schemaDefinition);
    const answers: IntakeAnswerMap = { tags: Array.from({ length: 1000 }, (_, index) => (index === 999 ? 'invalid' : 'allowed')) };

    const errors = validateSchemaAnswers(schema, answers);

    expect(errors.tags).toEqual(['Tags contains an invalid option "invalid".']);
  });
});
