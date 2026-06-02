import { describe, expect, it } from 'vitest';
import type { IntakeAnswerMap, IntakeSchemaDefinition } from '@/types';
import { finalizeIntakeSchema } from '../../schemaHelpers';
import { buildDependencyGraph } from '../../runtime/dependencyGraph';
import { getAffectedQuestionsOnAnswerChange } from '../../runtime/propagationEngine';

function createPropagationSchema() {
  const schemaDefinition = {
    id: 'runtime-propagation-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Propagation Schema',
    description: 'Schema for propagation tests.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['country', 'lawful_basis', 'transfer_mechanisms', 'summary']
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
        id: 'lawful_basis',
        sectionId: 'main',
        order: 2,
        semanticKey: 'lawful_basis',
        type: 'text',
        label: 'Lawful basis',
        conditionalRules: [
          {
            dependsOn: 'country',
            operator: 'equals',
            value: 'DE',
            combinator: 'AND',
            visibility: 'show'
          }
        ]
      },
      {
        id: 'transfer_mechanisms',
        sectionId: 'main',
        order: 3,
        semanticKey: 'transfer_mechanisms',
        type: 'multiselect',
        label: 'Transfer mechanisms',
        options: [{ value: 'SCCs', label: 'SCCs' }],
        conditionalRules: [
          {
            dependsOn: 'lawful_basis',
            operator: 'exists',
            combinator: 'AND',
            visibility: 'show',
            conditions: [{ questionId: 'lawful_basis', operator: 'exists' }]
          }
        ]
      },
      {
        id: 'summary',
        sectionId: 'main',
        order: 4,
        semanticKey: 'summary',
        type: 'textarea',
        label: 'Summary',
        conditionalRules: [
          {
            dependsOn: 'transfer_mechanisms',
            operator: 'exists',
            combinator: 'AND',
            visibility: 'show'
          }
        ]
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

describe('propagationEngine', () => {
  it('returns dependent questions affected by a changed answer', () => {
    const schema = createPropagationSchema();
    const dependencyGraph = buildDependencyGraph(schema);
    const oldAnswers: IntakeAnswerMap = { country: 'US' };
    const newAnswers: IntakeAnswerMap = { country: 'DE' };

    expect(getAffectedQuestionsOnAnswerChange(dependencyGraph, 'country', oldAnswers, newAnswers)).toEqual(new Set(['lawful_basis', 'transfer_mechanisms', 'summary']));
  });

  it('returns an empty set when the changed answer value is unchanged', () => {
    const schema = createPropagationSchema();
    const dependencyGraph = buildDependencyGraph(schema);
    const answers: IntakeAnswerMap = { country: 'US' };

    expect(getAffectedQuestionsOnAnswerChange(dependencyGraph, 'country', answers, answers)).toEqual(new Set());
  });
});