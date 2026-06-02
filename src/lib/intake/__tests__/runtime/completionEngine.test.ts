import { describe, expect, it } from 'vitest';
import type { IntakeAnswerMap, IntakeSchemaDefinition } from '@/types';
import { finalizeIntakeSchema } from '../../schemaHelpers';
import { getProgress, isAIPayloadReady, isIntakeComplete, isQuestionComplete, isSectionComplete } from '../../runtime/completionEngine';
import { getVisibleQuestions } from '../../runtime/visibilityEngine';

function createCompletionSchema() {
  const schemaDefinition = {
    id: 'runtime-completion-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Completion Schema',
    description: 'Schema for completion tests.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['company_name', 'collects_children']
      },
      {
        id: 'details',
        title: 'Details',
        order: 2,
        questionIds: ['children_policy']
      }
    ],
    questions: [
      {
        id: 'company_name',
        sectionId: 'main',
        order: 1,
        semanticKey: 'company_name',
        type: 'text',
        label: 'Company name',
        validation: { required: true },
        aiMetadata: {
          clauseCategory: 'company',
          importance: 'high',
          affectsCompliance: true
        }
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
        id: 'children_policy',
        sectionId: 'details',
        order: 1,
        semanticKey: 'children_policy',
        type: 'textarea',
        label: 'Children policy',
        validation: { required: true },
        aiMetadata: {
          clauseCategory: 'children',
          importance: 'medium',
          affectsCompliance: true
        },
        conditionalRules: [
          {
            dependsOn: 'collects_children',
            operator: 'equals',
            value: true,
            combinator: 'AND',
            visibility: 'show'
          }
        ]
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

describe('completionEngine', () => {
  it('calculates progress from visible questions only', () => {
    const schema = createCompletionSchema();
    const visibleQuestions = getVisibleQuestions(schema, { collects_children: false });
    const answers: IntakeAnswerMap = {
      company_name: 'Acme Inc.',
      collects_children: false
    };

    expect(getProgress(schema, answers, visibleQuestions)).toEqual({
      totalVisible: 2,
      answeredVisible: 2,
      percentage: 100,
      requiredUnansweredIds: []
    });
  });

  it('flags required visible questions that still need answers', () => {
    const schema = createCompletionSchema();
    const visibleQuestions = getVisibleQuestions(schema, { collects_children: true });
    const answers: IntakeAnswerMap = {
      company_name: '',
      collects_children: true,
      children_policy: ''
    };

    expect(getProgress(schema, answers, visibleQuestions)).toEqual({
      totalVisible: 3,
      answeredVisible: 1,
      percentage: 33,
      requiredUnansweredIds: ['company_name', 'children_policy']
    });
    expect(isAIPayloadReady(schema, answers, visibleQuestions)).toBe(false);
  });

  it('treats required empty values as incomplete and optional empty values as complete', () => {
    const schema = createCompletionSchema();
    const visibleQuestions = getVisibleQuestions(schema, { collects_children: false });
    const companyNameQuestion = visibleQuestions.find((question) => question.id === 'company_name');
    const collectsChildrenQuestion = visibleQuestions.find((question) => question.id === 'collects_children');

    expect(companyNameQuestion && isQuestionComplete(companyNameQuestion, '')).toBe(false);
    expect(collectsChildrenQuestion && isQuestionComplete(collectsChildrenQuestion, false)).toBe(true);
  });

  it('evaluates section and intake completion across visible questions', () => {
    const schema = createCompletionSchema();
    const visibleQuestions = getVisibleQuestions(schema, { collects_children: true });
    const answers: IntakeAnswerMap = {
      company_name: 'Acme Inc.',
      collects_children: true,
      children_policy: 'We provide a children policy.'
    };

    expect(isSectionComplete(schema, 'main', answers, visibleQuestions)).toBe(true);
    expect(isSectionComplete(schema, 'details', answers, visibleQuestions)).toBe(true);
    expect(isIntakeComplete(schema, answers, visibleQuestions)).toBe(true);
    expect(isAIPayloadReady(schema, answers, visibleQuestions)).toBe(true);
  });
});