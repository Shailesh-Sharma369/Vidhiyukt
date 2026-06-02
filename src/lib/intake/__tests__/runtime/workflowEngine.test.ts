import { describe, expect, it } from 'vitest';
import type { IntakeSchemaDefinition } from '@/types';
import { finalizeIntakeSchema } from '../../schemaHelpers';
import {
  getNextVisibleQuestion,
  getNextVisibleSection,
  getPreviousVisibleQuestion
} from '../../runtime/workflowEngine';

function createWorkflowSchema() {
  const schemaDefinition = {
    id: 'runtime-workflow-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Workflow Schema',
    description: 'Schema for workflow tests.',
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

describe('workflowEngine', () => {
  it('walks visible questions in order and skips hidden questions', () => {
    const schema = createWorkflowSchema();
    const answers = {
      country: 'US',
      collects_children: false
    };

    expect(getNextVisibleQuestion(schema, answers, 'country')?.id).toBe('collects_children');
    expect(getNextVisibleQuestion(schema, answers, 'collects_children')?.id).toBe('retention_details');
    expect(getNextVisibleQuestion(schema, answers, 'retention_details')).toBeNull();
    expect(getPreviousVisibleQuestion(schema, answers, 'collects_children')?.id).toBe('country');
  });

  it('walks visible sections in order', () => {
    const schema = createWorkflowSchema();
    const answers = {
      country: 'US',
      collects_children: true
    };

    expect(getNextVisibleSection(schema, answers, 'main')).toBe('details');
    expect(getNextVisibleSection(schema, answers, 'details')).toBeNull();
  });
});