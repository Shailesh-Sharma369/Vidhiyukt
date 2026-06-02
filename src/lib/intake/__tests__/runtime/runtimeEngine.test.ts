import { describe, expect, it } from 'vitest';
import type { IntakeSchemaDefinition } from '@/types';
import { finalizeIntakeSchema } from '../../schemaHelpers';
import { createRuntimeEngine } from '../../runtime/runtimeEngine';

function createRuntimeSchema() {
  const schemaDefinition = {
    id: 'runtime-engine-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Engine Schema',
    description: 'Schema for runtime engine tests.',
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

function createDeepChainSchema() {
  const schemaDefinition = {
    id: 'runtime-deep-chain-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Deep Chain Schema',
    description: 'Schema for deep dependency chain tests.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5']
      }
    ],
    questions: [
      {
        id: 'q1',
        sectionId: 'main',
        order: 1,
        semanticKey: 'q1',
        type: 'checkbox',
        label: 'Q1',
        defaultValue: false
      },
      {
        id: 'q2',
        sectionId: 'main',
        order: 2,
        semanticKey: 'q2',
        type: 'text',
        label: 'Q2',
        conditionalRules: [{ dependsOn: 'q1', operator: 'equals', value: true, combinator: 'AND', visibility: 'show' }]
      },
      {
        id: 'q3',
        sectionId: 'main',
        order: 3,
        semanticKey: 'q3',
        type: 'text',
        label: 'Q3',
        conditionalRules: [{ dependsOn: 'q2', operator: 'exists', combinator: 'AND', visibility: 'show' }]
      },
      {
        id: 'q4',
        sectionId: 'main',
        order: 4,
        semanticKey: 'q4',
        type: 'text',
        label: 'Q4',
        conditionalRules: [{ dependsOn: 'q3', operator: 'exists', combinator: 'AND', visibility: 'show' }]
      },
      {
        id: 'q5',
        sectionId: 'main',
        order: 5,
        semanticKey: 'q5',
        type: 'text',
        label: 'Q5',
        conditionalRules: [{ dependsOn: 'q4', operator: 'exists', combinator: 'AND', visibility: 'show' }]
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

function createCircularSchema() {
  const schemaDefinition = {
    id: 'runtime-circular-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Circular Schema',
    description: 'Schema with circular dependencies.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['q1', 'q2']
      }
    ],
    questions: [
      {
        id: 'q1',
        sectionId: 'main',
        order: 1,
        semanticKey: 'q1',
        type: 'text',
        label: 'Q1',
        conditionalRules: [{ dependsOn: 'q2', operator: 'exists', combinator: 'AND', visibility: 'show' }]
      },
      {
        id: 'q2',
        sectionId: 'main',
        order: 2,
        semanticKey: 'q2',
        type: 'text',
        label: 'Q2',
        conditionalRules: [{ dependsOn: 'q1', operator: 'exists', combinator: 'AND', visibility: 'show' }]
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

describe('runtimeEngine', () => {
  it('recomputes visibility, completion, and AI readiness when answers change', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);

    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['company_name', 'collects_children']);
    expect(engine.getState().progress).toEqual({
      totalVisible: 2,
      answeredVisible: 1,
      percentage: 50,
      requiredUnansweredIds: ['company_name']
    });
    expect(engine.getState().aiPayloadReady).toBe(false);

    engine.updateAnswer('company_name', 'Acme Inc.');
    engine.updateAnswer('collects_children', true);

    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['company_name', 'collects_children', 'children_policy']);
    expect(engine.getState().aiPayloadReady).toBe(false);

    engine.updateAnswer('children_policy', 'We publish a children policy.');

    expect(engine.getState().aiPayloadReady).toBe(true);
    expect(engine.getState().progress.requiredUnansweredIds).toEqual([]);
  });

  it('exposes navigation helpers for visible questions', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);

    expect(engine.getNextQuestion('company_name')?.id).toBe('collects_children');
    expect(engine.getPreviousQuestion('company_name')).toBeNull();
    expect(engine.getPreviousSection('main')).toBeNull();

    engine.updateAnswer('collects_children', true);

    expect(engine.getNextQuestion('collects_children')?.id).toBe('children_policy');
    expect(engine.getPreviousQuestion('children_policy')?.id).toBe('collects_children');
    expect(engine.getPreviousSection('details')).toBe('main');
  });

  it('notifies subscribers and supports reset', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);
    const states: string[][] = [];
    const unsubscribe = engine.subscribe((state) => {
      states.push(state.visibleQuestions.map((question) => question.id));
    });

    engine.updateAnswer('company_name', 'Acme Inc.');
    engine.reset({ company_name: 'Reset Co.' });
    unsubscribe();
    engine.updateAnswer('collects_children', true);

    expect(states).toEqual([
      ['company_name', 'collects_children'],
      ['company_name', 'collects_children']
    ]);
    expect(engine.getState().answers.company_name).toBe('Reset Co.');
  });

  it('does not notify subscribers when the answer value is unchanged', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);
    let notifications = 0;

    engine.subscribe(() => {
      notifications += 1;
    });

    engine.updateAnswer('company_name', 'Acme Inc.');
    engine.updateAnswer('company_name', 'Acme Inc.');

    expect(notifications).toBe(1);
  });

  it('recomputes visibility correctly through a deep dependency chain', () => {
    const schema = createDeepChainSchema();
    const engine = createRuntimeEngine(schema);

    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['q1']);

    engine.updateAnswer('q1', true);
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['q1', 'q2']);

    engine.updateAnswer('q2', 'value-2');
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['q1', 'q2', 'q3']);

    engine.updateAnswer('q3', 'value-3');
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['q1', 'q2', 'q3', 'q4']);

    engine.updateAnswer('q4', 'value-4');
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });

  it('keeps ai readiness false when a visible compliance question is missing', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);

    expect(engine.getState().aiPayloadReady).toBe(false);
    expect(engine.getState().progress.totalVisible).toBe(2);
  });

  it('keeps ai readiness true when a compliance question is hidden', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);

    engine.updateAnswer('collects_children', false);
    expect(engine.getState().visibleQuestions.map((question) => question.id)).not.toContain('children_policy');
    expect(engine.getState().aiPayloadReady).toBe(false);

    engine.updateAnswer('company_name', 'Acme Inc.');
    expect(engine.getState().aiPayloadReady).toBe(true);
  });

  it('treats default values as answers for readiness and progress where applicable', () => {
    const schema = finalizeIntakeSchema({
      id: 'default-value-schema',
      documentType: 'Privacy Policy',
      title: 'Default Value Schema',
      description: 'Schema with default values.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [{ id: 'main', title: 'Main', order: 1, questionIds: ['q1', 'q2'] }],
      questions: [
        { id: 'q1', sectionId: 'main', order: 1, semanticKey: 'q1', type: 'text', label: 'Q1', validation: { required: true }, defaultValue: 'default' },
        { id: 'q2', sectionId: 'main', order: 2, semanticKey: 'q2', type: 'text', label: 'Q2', aiMetadata: { clauseCategory: 'test', importance: 'high', affectsCompliance: true }, defaultValue: 'filled by default' }
      ]
    } satisfies IntakeSchemaDefinition);

    const engine = createRuntimeEngine(schema);
    expect(engine.getState().progress.answeredVisible).toBe(2);
    expect(engine.getState().aiPayloadReady).toBe(true);
  });

  it('documents totalVisible zero behavior explicitly', () => {
    const schema = finalizeIntakeSchema({
      id: 'empty-schema',
      documentType: 'Privacy Policy',
      title: 'Empty Schema',
      description: 'Schema with no visible questions.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [],
      questions: []
    } satisfies IntakeSchemaDefinition);

    const engine = createRuntimeEngine(schema);
    expect(engine.getState().progress).toEqual({
      totalVisible: 0,
      answeredVisible: 0,
      percentage: 100,
      requiredUnansweredIds: []
    });
  });

  it('handles repeated visibility toggles without stale state', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);

    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['company_name', 'collects_children']);

    engine.updateAnswer('collects_children', true);
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['company_name', 'collects_children', 'children_policy']);

    engine.updateAnswer('collects_children', false);
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['company_name', 'collects_children']);

    engine.updateAnswer('collects_children', true);
    expect(engine.getState().visibleQuestions.map((question) => question.id)).toEqual(['company_name', 'collects_children', 'children_policy']);
  });

  it('returns immutable state snapshots from getState', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);
    const state = engine.getState();

    (state.answers as Record<string, string | boolean | number | string[] | null>)['company_name'] = 'mutated';
    state.visibleQuestions.push(state.visibleQuestions[0]);

    expect(engine.getState().answers.company_name).toBeUndefined();
    expect(engine.getState().visibleQuestions).toHaveLength(2);
  });

  it('sends cloned state to subscribers', () => {
    const schema = createRuntimeSchema();
    const engine = createRuntimeEngine(schema);
    let observedState: ReturnType<typeof engine.getState> | null = null;

    engine.subscribe((state) => {
      observedState = state;
      (state.answers as Record<string, string | boolean | number | string[] | null>)['company_name'] = 'subscriber-mutation';
      state.visibleQuestions.length = 0;
    });

    engine.updateAnswer('company_name', 'Acme Inc.');

    expect(observedState).not.toBeNull();
    expect(engine.getState().answers.company_name).toBe('Acme Inc.');
    expect(engine.getState().visibleQuestions).toHaveLength(2);
  });
});