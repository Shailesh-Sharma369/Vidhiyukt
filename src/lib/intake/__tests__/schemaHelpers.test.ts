import { describe, expect, it } from 'vitest';
import type { ConditionalRule, IntakeAnswerMap, IntakeSchemaDefinition } from '@/types';
import {
  evaluateConditionalRules,
  finalizeIntakeSchema,
  getDependentQuestions,
  getVisibleQuestions,
  isQuestionVisible,
  normalizeConditionalRule
} from '../schemaHelpers';

function createVisibilitySchema() {
  const schemaDefinition = {
    id: 'visibility-test-schema',
    documentType: 'Privacy Policy',
    title: 'Visibility Test Schema',
    description: 'Schema used to exercise conditional visibility.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'primary',
        title: 'Primary',
        order: 2,
        questionIds: ['country', 'children_data']
      },
      {
        id: 'secondary',
        title: 'Secondary',
        order: 1,
        questionIds: ['consent_details', 'retention_details', 'exclusive_show_details']
      }
    ],
    questions: [
      {
        id: 'country',
        sectionId: 'primary',
        order: 2,
        semanticKey: 'country',
        type: 'text',
        label: 'Country',
        validation: { required: true }
      },
      {
        id: 'children_data',
        sectionId: 'primary',
        order: 1,
        semanticKey: 'collects_children_data',
        type: 'checkbox',
        label: 'Collects children data',
        defaultValue: false
      },
      {
        id: 'consent_details',
        sectionId: 'secondary',
        order: 1,
        semanticKey: 'consent_details',
        type: 'textarea',
        label: 'Consent details',
        conditionalRules: [
          {
            dependsOn: 'children_data',
            operator: 'equals',
            value: true,
            combinator: 'AND',
            visibility: 'show'
          }
        ]
      },
      {
        id: 'retention_details',
        sectionId: 'secondary',
        order: 2,
        semanticKey: 'retention_details',
        type: 'textarea',
        label: 'Retention details',
        conditionalRules: [
          {
            dependsOn: 'children_data',
            operator: 'equals',
            value: true,
            combinator: 'AND',
            visibility: 'hide'
          },
          {
            dependsOn: 'country',
            operator: 'equals',
            value: 'DE',
            combinator: 'AND',
            visibility: 'hide'
          }
        ]
      },
      {
        id: 'exclusive_show_details',
        sectionId: 'secondary',
        order: 3,
        semanticKey: 'exclusive_show_details',
        type: 'textarea',
        label: 'Exclusive show details',
        conditionalRules: [
          {
            dependsOn: 'country',
            operator: 'equals',
            value: 'US',
            combinator: 'AND',
            visibility: 'show'
          },
          {
            dependsOn: 'children_data',
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

function createRuleSchema() {
  const schemaDefinition = {
    id: 'rule-test-schema',
    documentType: 'Privacy Policy',
    title: 'Rule Test Schema',
    description: 'Schema used to exercise conditional operators.',
    version: '1.0.0',
    supportedJurisdictions: ['GDPR'],
    sections: [
      {
        id: 'main',
        title: 'Main',
        order: 1,
        questionIds: ['flag', 'name', 'tags', 'count', 'score', 'empty_text', 'other_flag']
      }
    ],
    questions: [
      {
        id: 'flag',
        sectionId: 'main',
        order: 1,
        semanticKey: 'flag',
        type: 'checkbox',
        label: 'Flag',
        defaultValue: false
      },
      {
        id: 'other_flag',
        sectionId: 'main',
        order: 7,
        semanticKey: 'other_flag',
        type: 'checkbox',
        label: 'Other flag',
        defaultValue: true
      },
      {
        id: 'name',
        sectionId: 'main',
        order: 2,
        semanticKey: 'name',
        type: 'text',
        label: 'Name'
      },
      {
        id: 'tags',
        sectionId: 'main',
        order: 3,
        semanticKey: 'tags',
        type: 'multiselect',
        label: 'Tags',
        options: [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
          { value: 'gamma', label: 'Gamma' }
        ]
      },
      {
        id: 'count',
        sectionId: 'main',
        order: 4,
        semanticKey: 'count',
        type: 'text',
        inputMode: 'numeric',
        label: 'Count'
      },
      {
        id: 'score',
        sectionId: 'main',
        order: 5,
        semanticKey: 'score',
        type: 'text',
        inputMode: 'numeric',
        label: 'Score'
      },
      {
        id: 'empty_text',
        sectionId: 'main',
        order: 6,
        semanticKey: 'empty_text',
        type: 'text',
        label: 'Empty text'
      }
    ]
  } satisfies IntakeSchemaDefinition;

  return finalizeIntakeSchema(schemaDefinition);
}

describe('normalizeConditionalRule', () => {
  it('preserves a multi-condition rule without flattening the conditions array', () => {
    const rule: ConditionalRule = {
      dependsOn: ['children_data', 'country'],
      operator: 'equals',
      value: true,
      combinator: 'AND',
      conditions: [
        { questionId: 'children_data', operator: 'equals', value: true },
        { questionId: 'country', operator: 'equals', value: 'DE' }
      ]
    };

    const normalized = normalizeConditionalRule(rule);

    expect(normalized.conditions).toHaveLength(2);
    expect(normalized.conditions).toEqual(rule.conditions);
    expect(normalized.dependsOn).toEqual(rule.dependsOn);
    expect(normalized.combinator).toBe('AND');
  });

  it('preserves a single condition rule as a one-item conditions array', () => {
    const rule: ConditionalRule = {
      dependsOn: 'children_data',
      operator: 'equals',
      value: true,
      conditions: [{ questionId: 'children_data', operator: 'equals', value: true }]
    };

    const normalized = normalizeConditionalRule(rule);

    expect(normalized.conditions).toEqual([{ questionId: 'children_data', operator: 'equals', value: true }]);
    expect(normalized.conditions).toHaveLength(1);
  });

  it('keeps legacy single-condition fields intact when a rule has not yet been migrated', () => {
    const legacyRule: ConditionalRule = {
      dependsOn: 'country',
      operator: 'equals',
      value: 'US'
    };

    const normalized = normalizeConditionalRule(legacyRule);

    expect(normalized.dependsOn).toBe('country');
    expect(normalized.operator).toBe('equals');
    expect(normalized.value).toBe('US');
    expect(normalized.conditions).toBeUndefined();
    // Legacy shape remains supported as-is; the helper does not auto-convert it.
  });
});

describe('isQuestionVisible', () => {
  it('returns true for a question with no conditional rules', () => {
    const schema = createVisibilitySchema();
    const question = schema.questions.find((item) => item.id === 'country');

    expect(question).toBeDefined();
    expect(isQuestionVisible(schema, question!, {})).toBe(true);
  });

  it('hides a question when its hide rule matches and shows it otherwise', () => {
    const schema = createVisibilitySchema();
    const question = schema.questions.find((item) => item.id === 'retention_details');

    expect(question).toBeDefined();
    expect(isQuestionVisible(schema, question!, { children_data: true, country: 'FR' })).toBe(false);
    expect(isQuestionVisible(schema, question!, { children_data: false, country: 'FR' })).toBe(true);
  });

  it('hides a question when any of multiple hide rules matches', () => {
    const schema = createVisibilitySchema();
    const question = schema.questions.find((item) => item.id === 'retention_details');

    expect(question).toBeDefined();
    expect(isQuestionVisible(schema, question!, { children_data: false, country: 'DE' })).toBe(false);
    expect(isQuestionVisible(schema, question!, { children_data: false, country: 'FR' })).toBe(true);
  });

  it('shows a question only when its single show rule matches', () => {
    const schema = createVisibilitySchema();
    const question = schema.questions.find((item) => item.id === 'consent_details');

    expect(question).toBeDefined();
    expect(isQuestionVisible(schema, question!, { children_data: true })).toBe(true);
    expect(isQuestionVisible(schema, question!, { children_data: false })).toBe(false);
  });

  it('treats the first show rule as authoritative when multiple show rules are present', () => {
    const schema = createVisibilitySchema();
    const question = schema.questions.find((item) => item.id === 'exclusive_show_details');

    expect(question).toBeDefined();
    expect(isQuestionVisible(schema, question!, { country: 'US', children_data: false })).toBe(true);
    expect(isQuestionVisible(schema, question!, { country: 'CA', children_data: true })).toBe(false);
  });

  it('gives show rules precedence over hide rules when both match', () => {
    const schemaDefinition = {
      id: 'show-hide-precedence-schema',
      documentType: 'Privacy Policy',
      title: 'Show Hide Precedence Schema',
      description: 'Schema used to check precedence.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        {
          id: 'main',
          title: 'Main',
          order: 1,
          questionIds: ['flag', 'target']
        }
      ],
      questions: [
        {
          id: 'flag',
          sectionId: 'main',
          order: 1,
          semanticKey: 'flag',
          type: 'checkbox',
          label: 'Flag',
          defaultValue: false
        },
        {
          id: 'target',
          sectionId: 'main',
          order: 2,
          semanticKey: 'target',
          type: 'text',
          label: 'Target',
          conditionalRules: [
            {
              dependsOn: 'flag',
              operator: 'equals',
              value: true,
              combinator: 'AND',
              visibility: 'show'
            },
            {
              dependsOn: 'flag',
              operator: 'equals',
              value: true,
              combinator: 'AND',
              visibility: 'hide'
            }
          ]
        }
      ]
    } satisfies IntakeSchemaDefinition;

    const schema = finalizeIntakeSchema(schemaDefinition);
    const target = schema.questions.find((item) => item.id === 'target');

    expect(target).toBeDefined();
    expect(isQuestionVisible(schema, target!, { flag: true })).toBe(true);
    expect(isQuestionVisible(schema, target!, { flag: false })).toBe(false);
  });

  it('evaluates conditions with logic all and logic any without flattening them', () => {
    const schema = createRuleSchema();

    const allRule: ConditionalRule = {
      dependsOn: ['name', 'tags'],
      operator: 'exists',
      combinator: 'AND',
      logic: 'all',
      conditions: [
        { questionId: 'name', operator: 'exists' },
        { questionId: 'tags', operator: 'exists' }
      ]
    };

    const anyRule: ConditionalRule = {
      dependsOn: ['name', 'tags'],
      operator: 'exists',
      combinator: 'OR',
      logic: 'any',
      conditions: [
        { questionId: 'name', operator: 'exists' },
        { questionId: 'tags', operator: 'exists' }
      ]
    };

    const answers: IntakeAnswerMap = { name: 'SecureShip', tags: [] };

    expect(evaluateConditionalRules([allRule], answers, schema)).toBe(false);
    expect(evaluateConditionalRules([anyRule], answers, schema)).toBe(true);
  });

  it('returns only visible questions in section order and question order', () => {
    const schema = createVisibilitySchema();
    const visibleWithChildren = getVisibleQuestions(schema, {
      country: 'US',
      children_data: true
    }).map((question) => question.id);

    expect(visibleWithChildren).toEqual([
      'consent_details',
      'exclusive_show_details',
      'children_data',
      'country'
    ]);

    const visibleWithoutChildren = getVisibleQuestions(schema, {
      country: 'FR',
      children_data: false
    }).map((question) => question.id);

    expect(visibleWithoutChildren).toEqual(['retention_details', 'children_data', 'country']);
  });

  it('returns dependent questions that reference a source question directly or through conditional rules', () => {
    const schema = createVisibilitySchema();

    const dependentIds = getDependentQuestions(schema, 'children_data').map((question) => question.id);

    expect(dependentIds).toContain('consent_details');
    expect(dependentIds).toContain('retention_details');
    expect(dependentIds).toContain('exclusive_show_details');
  });

  it('treats empty strings as not existing for visibility checks while false booleans still exist', () => {
    const schema = createRuleSchema();

    const nameExistsRule: ConditionalRule = {
      dependsOn: 'name',
      operator: 'exists',
      combinator: 'AND'
    };

    const flagExistsRule: ConditionalRule = {
      dependsOn: 'flag',
      operator: 'exists',
      combinator: 'AND'
    };

    expect(evaluateConditionalRules([nameExistsRule], { name: '' }, schema)).toBe(false);
    expect(evaluateConditionalRules([flagExistsRule], { flag: false }, schema)).toBe(true);
  });

  it('supports numeric comparisons with stringified numbers', () => {
    const schema = createRuleSchema();

    const greaterThanRule: ConditionalRule = {
      dependsOn: 'count',
      operator: 'greater_than',
      value: '10',
      combinator: 'AND'
    };

    const lessThanRule: ConditionalRule = {
      dependsOn: 'score',
      operator: 'less_than',
      value: 5,
      combinator: 'AND'
    };

    expect(evaluateConditionalRules([greaterThanRule], { count: '12' }, schema)).toBe(true);
    expect(evaluateConditionalRules([greaterThanRule], { count: '9' }, schema)).toBe(false);
    expect(evaluateConditionalRules([lessThanRule], { score: '4' }, schema)).toBe(true);
    expect(evaluateConditionalRules([lessThanRule], { score: '8' }, schema)).toBe(false);
  });

  it('supports string substring and array inclusion checks', () => {
    const schema = createRuleSchema();

    const stringIncludesRule: ConditionalRule = {
      dependsOn: 'name',
      operator: 'includes',
      value: 'Ship',
      combinator: 'AND'
    };

    const arrayIncludesRule: ConditionalRule = {
      dependsOn: 'tags',
      operator: 'includes',
      value: 'beta',
      combinator: 'AND'
    };

    expect(evaluateConditionalRules([stringIncludesRule], { name: 'SecureShip' }, schema)).toBe(true);
    expect(evaluateConditionalRules([stringIncludesRule], { name: 'Privacy' }, schema)).toBe(false);
    expect(evaluateConditionalRules([arrayIncludesRule], { tags: ['alpha', 'beta'] }, schema)).toBe(true);
    expect(evaluateConditionalRules([arrayIncludesRule], { tags: ['alpha'] }, schema)).toBe(false);
  });
});
