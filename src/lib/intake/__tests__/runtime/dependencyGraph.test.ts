import { describe, expect, it } from 'vitest';
import type { IntakeSchema, IntakeSchemaDefinition } from '@/types';
import { finalizeIntakeSchema } from '../../schemaHelpers';
import {
  buildDependencyGraph,
  detectCircularDependencies,
  getDependencyChain,
  getDependentQuestions
} from '../../runtime/dependencyGraph';

function createDependencySchema() {
  const schemaDefinition = {
    id: 'runtime-dependency-schema',
    documentType: 'Privacy Policy',
    title: 'Runtime Dependency Schema',
    description: 'Schema for dependency graph tests.',
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

describe('dependencyGraph', () => {
  it('builds dependency edges from conditional references', () => {
    const schema = createDependencySchema();
    const graph = buildDependencyGraph(schema);

    expect(getDependentQuestions(graph, 'country')).toEqual(['lawful_basis']);
    expect(getDependentQuestions(graph, 'lawful_basis')).toEqual(['transfer_mechanisms']);
    expect(getDependencyChain(graph, 'country')).toEqual(['lawful_basis', 'transfer_mechanisms', 'summary']);
  });

  it('throws when a dependency references its own question', () => {
    const schema = {
      id: 'self-dependency-schema',
      documentType: 'Privacy Policy',
      title: 'Self Dependency Schema',
      description: 'Schema with self dependency.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        {
          id: 'main',
          title: 'Main',
          order: 1,
          questionIds: ['q1']
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
          conditionalRules: [
            {
              dependsOn: 'q1',
              operator: 'equals',
              value: 'yes',
              combinator: 'AND',
              visibility: 'show'
            }
          ]
        }
      ]
    } satisfies IntakeSchemaDefinition;

    expect(() => buildDependencyGraph(schema as never)).toThrow('cannot depend on itself');
  });

  it('throws when semantic keys collide', () => {
    const schema = {
      id: 'collision-schema',
      documentType: 'Privacy Policy',
      title: 'Collision Schema',
      description: 'Schema with duplicate semantic keys.',
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
          semanticKey: 'duplicate_key',
          type: 'text',
          label: 'Q1'
        },
        {
          id: 'q2',
          sectionId: 'main',
          order: 2,
          semanticKey: 'duplicate_key',
          type: 'text',
          label: 'Q2'
        }
      ]
    } satisfies IntakeSchemaDefinition;

    expect(() => buildDependencyGraph(schema as never)).toThrow('Duplicate semantic key "duplicate_key" found on questions "q1" and "q2".');
  });

  it('throws when semantic keys are empty or whitespace', () => {
    const schema = {
      id: 'invalid-semantic-key-schema',
      documentType: 'Privacy Policy',
      title: 'Invalid Semantic Key Schema',
      description: 'Schema with invalid semantic keys.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        {
          id: 'main',
          title: 'Main',
          order: 1,
          questionIds: ['q1']
        }
      ],
      questions: [
        {
          id: 'q1',
          sectionId: 'main',
          order: 1,
          semanticKey: '   ',
          type: 'text',
          label: 'Q1'
        }
      ]
    } satisfies IntakeSchemaDefinition;

    expect(() => buildDependencyGraph(schema as never)).toThrow('Invalid semantic key for question "q1"');
  });

  it('throws when a dependency reference contains non-string values', () => {
    const schema = {
      id: 'invalid-reference-schema',
      documentType: 'Privacy Policy',
      title: 'Invalid Reference Schema',
      description: 'Schema with invalid dependency reference values.',
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
          label: 'Q1'
        },
        {
          id: 'q2',
          sectionId: 'main',
          order: 2,
          semanticKey: 'q2',
          type: 'text',
          label: 'Q2',
          conditionalRules: [
            {
              dependsOn: ['q1', 42 as never],
              operator: 'equals',
              value: 'yes',
              combinator: 'AND',
              visibility: 'show'
            }
          ]
        }
      ]
    } satisfies IntakeSchemaDefinition;

    expect(() => buildDependencyGraph(schema as never)).toThrow('dependency reference must be a string');
  });

  it('throws for unknown dependency references', () => {
    const schema = {
      id: 'unknown-dependency-schema',
      documentType: 'Privacy Policy',
      title: 'Unknown Dependency Schema',
      description: 'Schema with an invalid dependency reference.',
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
          label: 'Q1'
        },
        {
          id: 'q2',
          sectionId: 'main',
          order: 2,
          semanticKey: 'q2',
          type: 'text',
          label: 'Q2',
          conditionalRules: [
            {
              dependsOn: 'non_existing_question',
              operator: 'equals',
              value: 'yes',
              combinator: 'AND',
              visibility: 'show'
            }
          ]
        }
      ]
    } satisfies IntakeSchemaDefinition as unknown as IntakeSchema;

    expect(() => buildDependencyGraph(schema)).toThrow('Unknown dependency reference "non_existing_question" in question "q2" with semantic key "q2".');
  });

  it('detects direct circular dependencies', () => {
    const schema = {
      id: 'direct-cycle-schema',
      documentType: 'Privacy Policy',
      title: 'Direct Cycle Schema',
      description: 'Schema with direct cycle.',
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

    expect(() => buildDependencyGraph(schema as never)).toThrow(/Circular intake dependencies detected/);
  });

  it('detects indirect circular dependencies', () => {
    const schema = {
      id: 'indirect-cycle-schema',
      documentType: 'Privacy Policy',
      title: 'Indirect Cycle Schema',
      description: 'Schema with indirect cycle.',
      version: '1.0.0',
      supportedJurisdictions: ['GDPR'],
      sections: [
        {
          id: 'main',
          title: 'Main',
          order: 1,
          questionIds: ['q1', 'q2', 'q3']
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
          conditionalRules: [{ dependsOn: 'q3', operator: 'exists', combinator: 'AND', visibility: 'show' }]
        },
        {
          id: 'q3',
          sectionId: 'main',
          order: 3,
          semanticKey: 'q3',
          type: 'text',
          label: 'Q3',
          conditionalRules: [{ dependsOn: 'q1', operator: 'exists', combinator: 'AND', visibility: 'show' }]
        }
      ]
    } satisfies IntakeSchemaDefinition;

    expect(() => buildDependencyGraph(schema as never)).toThrow(/Circular intake dependencies detected/);
  });
});