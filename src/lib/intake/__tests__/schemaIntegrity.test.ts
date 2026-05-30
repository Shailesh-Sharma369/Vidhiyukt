import { describe, expect, it } from 'vitest';
import type { IntakeSchemaDefinition } from '@/types';
import {
  finalizeIntakeSchema,
  SchemaIntegrityError,
  validateSchemaIntegrity
} from '../schemaHelpers';
import { dpaSchema } from '../../../constants/intakeSchemas/dpaSchema';
import { privacyPolicySchema } from '../../../constants/intakeSchemas/privacyPolicySchema';
import { termsSchema } from '../../../constants/intakeSchemas/termsSchema';

function createBaseSchema(): IntakeSchemaDefinition {
  return {
    id: 'base-schema',
    documentType: 'Privacy Policy',
    title: 'Base Schema',
    description: 'Base schema for integrity tests.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['company_name']
      }
    ],
    questions: [
      {
        id: 'company_name',
        sectionId: 'main',
        order: 1,
        semanticKey: 'company_name',
        type: 'text',
        label: 'Company name'
      }
    ]
  };
}

describe('validateSchemaIntegrity', () => {
  it('accepts the real production schemas without throwing', () => {
    expect(() => validateSchemaIntegrity(privacyPolicySchema)).not.toThrow();
    expect(() => validateSchemaIntegrity(termsSchema)).not.toThrow();
    expect(() => validateSchemaIntegrity(dpaSchema)).not.toThrow();
  });

  it('throws for duplicate question IDs', () => {
    const schema = createBaseSchema();
    schema.questions = [
      ...schema.questions,
      {
        id: 'company_name',
        sectionId: 'main',
        order: 2,
        semanticKey: 'company_name_duplicate',
        type: 'text',
        label: 'Duplicate'
      }
    ];

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'duplicate_question_id')).toBe(true);
    }
  });

  it('throws for duplicate semantic keys', () => {
    const schema = createBaseSchema();
    schema.questions = [
      ...schema.questions,
      {
        id: 'company_alias',
        sectionId: 'main',
        order: 2,
        semanticKey: 'company_name',
        type: 'text',
        label: 'Alias'
      }
    ];

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'duplicate_semantic_key')).toBe(true);
    }
  });

  it('throws for duplicate section IDs', () => {
    const schema = createBaseSchema();
    schema.sections = [
      ...schema.sections,
      {
        id: 'main',
        title: 'Duplicate Main',
        order: 2,
        questionIds: ['company_name']
      }
    ];

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'duplicate_section_id')).toBe(true);
    }
  });

  it('throws when a section references a missing question ID', () => {
    const schema = createBaseSchema();
    schema.sections[0].questionIds = ['company_name', 'missing_question'];

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'invalid_question_reference')).toBe(true);
    }
  });

  it('throws when a section is empty', () => {
    const schema = createBaseSchema();
    schema.sections[0].questionIds = [];

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'empty_section')).toBe(true);
    }
  });

  it('throws when a conditional rule references an unknown question', () => {
    const schema = createBaseSchema();
    schema.questions[0].conditionalRules = [
      {
        dependsOn: 'missing_question',
        operator: 'equals',
        value: true,
        combinator: 'AND',
        visibility: 'show'
      }
    ];

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'invalid_conditional_reference')).toBe(true);
    }
  });

  it('throws when a question is missing a semantic key', () => {
    const schema = createBaseSchema();
    delete schema.questions[0].semanticKey;

    try {
      validateSchemaIntegrity(schema);
      throw new Error('Expected schema validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaIntegrityError);
      expect((error as SchemaIntegrityError).issues.some((issue) => issue.code === 'missing_semantic_key')).toBe(true);
    }
  });

  it('does not throw for a valid schema', () => {
    const schema = createBaseSchema();

    expect(() => validateSchemaIntegrity(schema)).not.toThrow();
  });
});

describe('finalizeIntakeSchema', () => {
  it('calls schema integrity validation before finalizing the schema', () => {
    const invalidSchema = createBaseSchema();
    invalidSchema.sections[0].questionIds = [];

    expect(() => finalizeIntakeSchema(invalidSchema)).toThrow(SchemaIntegrityError);
  });
});
