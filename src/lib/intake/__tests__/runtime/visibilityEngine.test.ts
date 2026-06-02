import { describe, expect, it } from 'vitest';
import type { IntakeSchemaDefinition } from '@/types';
import { finalizeIntakeSchema } from '../../schemaHelpers';
import { getVisibleQuestions, getVisibleSectionIds, isQuestionVisibleById } from '../../runtime/visibilityEngine';

function createVisibilitySchema() {
  const schemaDefinition = {
    id: 'runtime-visibility-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Visibility Schema',
    description: 'Schema for visibility runtime tests.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['country', 'collects_children']
      },
      {
        id: 'details',
        title: 'Details',
        order: 2,
        questionIds: ['consent_details', 'retention_details']
      }
    ],
    questions: [
      {
        id: 'country',
        sectionId: 'main',
        order: 1,
        semanticKey: 'country',
        type: 'text',
        label: 'Country'
      },
      {
        id: 'collects_children',
        sectionId: 'main',
        order: 2,
        semanticKey: 'collects_children',
        type: 'checkbox',
        label: 'Collects children data',
        defaultValue: false
      },
      {
        id: 'consent_details',
        sectionId: 'details',
        order: 1,
        semanticKey: 'consent_details',
        type: 'textarea',
        label: 'Consent details',
        conditionalRules: [
          {
            dependsOn: 'collects_children',
            operator: 'equals',
            value: true,
            combinator: 'AND',
            visibility: 'show'
          }
        ]
      },
      {
        id: 'retention_details',
        sectionId: 'details',
        order: 2,
        semanticKey: 'retention_details',
        type: 'textarea',
        label: 'Retention details',
        conditionalRules: [
          {
            dependsOn: 'country',
            operator: 'equals',
            value: 'DE',
            combinator: 'AND',
            visibility: 'hide'
          }
        ]
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

describe('visibilityEngine', () => {
  it('supports AND conditions across multiple dependencies', () => {
    const schema = finalizeIntakeSchema({
      id: 'and-rule-schema',
      documentType: 'Privacy Policy',
      title: 'AND Rule Schema',
      description: 'Schema for AND rule tests.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        { id: 'main', title: 'Main', order: 1, questionIds: ['q1', 'q2', 'q3'] }
      ],
      questions: [
        { id: 'q1', sectionId: 'main', order: 1, semanticKey: 'q1', type: 'checkbox', label: 'Q1', defaultValue: false },
        { id: 'q2', sectionId: 'main', order: 2, semanticKey: 'q2', type: 'checkbox', label: 'Q2', defaultValue: false },
        {
          id: 'q3',
          sectionId: 'main',
          order: 3,
          semanticKey: 'q3',
          type: 'text',
          label: 'Q3',
          conditionalRules: [
            { dependsOn: ['q1', 'q2'], operator: 'equals', value: true, combinator: 'AND', visibility: 'show' }
          ]
        }
      ]
    } satisfies IntakeSchemaDefinition);

    expect(getVisibleQuestions(schema, { q1: true, q2: false }).map((question) => question.id)).toEqual(['q1', 'q2']);
    expect(getVisibleQuestions(schema, { q1: true, q2: true }).map((question) => question.id)).toEqual(['q1', 'q2', 'q3']);
  });

  it('supports OR conditions across multiple dependencies', () => {
    const schema = finalizeIntakeSchema({
      id: 'or-rule-schema',
      documentType: 'Privacy Policy',
      title: 'OR Rule Schema',
      description: 'Schema for OR rule tests.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        { id: 'main', title: 'Main', order: 1, questionIds: ['q1', 'q2', 'q3'] }
      ],
      questions: [
        { id: 'q1', sectionId: 'main', order: 1, semanticKey: 'q1', type: 'checkbox', label: 'Q1', defaultValue: false },
        { id: 'q2', sectionId: 'main', order: 2, semanticKey: 'q2', type: 'checkbox', label: 'Q2', defaultValue: false },
        {
          id: 'q3',
          sectionId: 'main',
          order: 3,
          semanticKey: 'q3',
          type: 'text',
          label: 'Q3',
          conditionalRules: [
            { dependsOn: ['q1', 'q2'], operator: 'equals', value: true, combinator: 'OR', visibility: 'show' }
          ]
        }
      ]
    } satisfies IntakeSchemaDefinition);

    expect(getVisibleQuestions(schema, { q1: false, q2: false }).map((question) => question.id)).toEqual(['q1', 'q2']);
    expect(getVisibleQuestions(schema, { q1: true, q2: false }).map((question) => question.id)).toEqual(['q1', 'q2', 'q3']);
    expect(getVisibleQuestions(schema, { q1: false, q2: true }).map((question) => question.id)).toEqual(['q1', 'q2', 'q3']);
  });

  it('handles multi-level dependency chains', () => {
    const schema = finalizeIntakeSchema({
      id: 'chain-schema',
      documentType: 'Privacy Policy',
      title: 'Chain Schema',
      description: 'Schema for chain tests.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [{ id: 'main', title: 'Main', order: 1, questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'] }],
      questions: [
        { id: 'q1', sectionId: 'main', order: 1, semanticKey: 'q1', type: 'checkbox', label: 'Q1', defaultValue: false },
        { id: 'q2', sectionId: 'main', order: 2, semanticKey: 'q2', type: 'text', label: 'Q2', conditionalRules: [{ dependsOn: 'q1', operator: 'equals', value: true, combinator: 'AND', visibility: 'show' }] },
        { id: 'q3', sectionId: 'main', order: 3, semanticKey: 'q3', type: 'text', label: 'Q3', conditionalRules: [{ dependsOn: 'q2', operator: 'exists', combinator: 'AND', visibility: 'show' }] },
        { id: 'q4', sectionId: 'main', order: 4, semanticKey: 'q4', type: 'text', label: 'Q4', conditionalRules: [{ dependsOn: 'q3', operator: 'exists', combinator: 'AND', visibility: 'show' }] },
        { id: 'q5', sectionId: 'main', order: 5, semanticKey: 'q5', type: 'text', label: 'Q5', conditionalRules: [{ dependsOn: 'q4', operator: 'exists', combinator: 'AND', visibility: 'show' }] }
      ]
    } satisfies IntakeSchemaDefinition);

    expect(getVisibleQuestions(schema, { q1: false }).map((question) => question.id)).toEqual(['q1']);
    expect(getVisibleQuestions(schema, { q1: true, q2: 'x', q3: 'x', q4: 'x' }).map((question) => question.id)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });

  it('handles hidden to visible to hidden transitions', () => {
    const schema = createVisibilitySchema();

    expect(getVisibleQuestions(schema, { country: 'US', collects_children: false }).map((question) => question.id)).toEqual(['country', 'collects_children', 'retention_details']);
    expect(getVisibleQuestions(schema, { country: 'US', collects_children: true }).map((question) => question.id)).toEqual(['country', 'collects_children', 'consent_details', 'retention_details']);
    expect(getVisibleQuestions(schema, { country: 'DE', collects_children: true }).map((question) => question.id)).toEqual(['country', 'collects_children', 'consent_details']);
  });

  it('updates branching dependencies correctly', () => {
    const schema = finalizeIntakeSchema({
      id: 'branching-schema',
      documentType: 'Privacy Policy',
      title: 'Branching Schema',
      description: 'Schema for branching tests.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [{ id: 'main', title: 'Main', order: 1, questionIds: ['q1', 'q2', 'q3', 'q4'] }],
      questions: [
        { id: 'q1', sectionId: 'main', order: 1, semanticKey: 'q1', type: 'checkbox', label: 'Q1', defaultValue: false },
        { id: 'q2', sectionId: 'main', order: 2, semanticKey: 'q2', type: 'text', label: 'Q2', conditionalRules: [{ dependsOn: 'q1', operator: 'equals', value: true, combinator: 'AND', visibility: 'show' }] },
        { id: 'q3', sectionId: 'main', order: 3, semanticKey: 'q3', type: 'text', label: 'Q3', conditionalRules: [{ dependsOn: 'q1', operator: 'equals', value: true, combinator: 'AND', visibility: 'show' }] },
        { id: 'q4', sectionId: 'main', order: 4, semanticKey: 'q4', type: 'text', label: 'Q4', conditionalRules: [{ dependsOn: 'q1', operator: 'equals', value: true, combinator: 'AND', visibility: 'show' }] }
      ]
    } satisfies IntakeSchemaDefinition);

    expect(getVisibleQuestions(schema, { q1: false }).map((question) => question.id)).toEqual(['q1']);
    expect(getVisibleQuestions(schema, { q1: true }).map((question) => question.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
  });

  it('returns the visible questions in schema order', () => {
    const schema = createVisibilitySchema();
    const answers = {
      country: 'DE',
      collects_children: false
    };

    expect(getVisibleQuestions(schema, answers).map((question) => question.id)).toEqual(['country', 'collects_children']);
  });

  it('respects show and hide conditional rules by question id', () => {
    const schema = createVisibilitySchema();

    expect(isQuestionVisibleById(schema, 'consent_details', { collects_children: false })).toBe(false);
    expect(isQuestionVisibleById(schema, 'consent_details', { collects_children: true })).toBe(true);
    expect(isQuestionVisibleById(schema, 'retention_details', { country: 'DE' })).toBe(false);
  });

  it('returns only sections that still contain visible questions', () => {
    const schema = createVisibilitySchema();

    expect(getVisibleSectionIds(schema, { country: 'DE', collects_children: false })).toEqual(['main']);
    expect(getVisibleSectionIds(schema, { country: 'US', collects_children: true })).toEqual(['main', 'details']);
  });
});