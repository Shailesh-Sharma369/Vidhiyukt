import type { IntakeSchemaDefinition, QuestionDefinition } from '@/types';
import {
  dataCategoryQuestionOptions,
  intakeSectionBlueprints,
  jurisdictionQuestionOptions,
  processingPurposeQuestionOptions,
  rightsQuestionOptions,
  thirdPartySharingQuestionOptions,
  transferMechanismQuestionOptions,
  type IntakeSectionId
} from './shared';
import { finalizeIntakeSchema } from '../../lib/intake/schemaHelpers';

const questionIdsBySection: Record<IntakeSectionId, string[]> = {
  'company-information': ['controller_name', 'processor_name', 'support_contact_email', 'jurisdictions_in_scope'],
  'data-collection': ['personal_data_categories', 'special_category_data', 'children_data'],
  'processing-purpose': ['processing_purposes', 'instructions_handling', 'retention_after_termination'],
  'third-party-sharing': ['uses_subprocessors', 'subprocessor_categories', 'cross_border_transfers', 'transfer_mechanisms'],
  'user-rights': ['rights_supported', 'audit_assistance', 'breach_notification_timing']
};

const sections = intakeSectionBlueprints.map((section) => ({
  ...section,
  questionIds: questionIdsBySection[section.id]
}));

const questions = [
  {
    id: 'controller_name',
    sectionId: 'company-information',
    order: 1,
    type: 'text',
    semanticKey: 'controller_name',
    label: 'Controller / customer name',
    placeholder: 'Customer legal entity name',
    validation: {
      required: true,
      minLength: 2
    }
  },
  {
    id: 'processor_name',
    sectionId: 'company-information',
    order: 2,
    type: 'text',
    semanticKey: 'processor_name',
    label: 'Processor / service provider name',
    placeholder: 'SecureShip, Inc.',
    validation: {
      required: true,
      minLength: 2
    }
  },
  {
    id: 'support_contact_email',
    sectionId: 'company-information',
    order: 3,
    type: 'text',
    semanticKey: 'support_contact_email',
    inputMode: 'email',
    label: 'Data processing contact email',
    placeholder: 'privacy@example.com',
    validation: {
      required: true,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      customErrorMessage: 'Enter a valid email address.'
    }
  },
  {
    id: 'jurisdictions_in_scope',
    sectionId: 'company-information',
    order: 4,
    type: 'multiselect',
    semanticKey: 'jurisdictions_in_scope',
    label: 'Jurisdictions in scope',
    options: jurisdictionQuestionOptions,
    defaultValue: ['GDPR'],
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'personal_data_categories',
    sectionId: 'data-collection',
    order: 1,
    type: 'multiselect',
    semanticKey: 'personal_data_categories',
    label: 'Personal data categories',
    options: dataCategoryQuestionOptions,
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'special_category_data',
    sectionId: 'data-collection',
    order: 2,
    type: 'checkbox',
    semanticKey: 'special_category_data',
    label: 'Processes special category or sensitive data',
    defaultValue: false
  },
  {
    id: 'children_data',
    sectionId: 'data-collection',
    order: 3,
    type: 'checkbox',
    semanticKey: 'children_data',
    label: 'Processes children data',
    defaultValue: false
  },
  {
    id: 'processing_purposes',
    sectionId: 'processing-purpose',
    order: 1,
    type: 'multiselect',
    semanticKey: 'processing_purposes',
    label: 'Processing purposes',
    options: processingPurposeQuestionOptions,
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'instructions_handling',
    sectionId: 'processing-purpose',
    order: 2,
    type: 'textarea',
    semanticKey: 'instructions_handling',
    label: 'Instructions handling',
    placeholder: 'Describe how customer instructions are received, verified, and executed.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'retention_after_termination',
    sectionId: 'processing-purpose',
    order: 3,
    type: 'textarea',
    semanticKey: 'retention_after_termination',
    label: 'Retention after termination',
    placeholder: 'Describe deletion, export, and post-termination retention commitments.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'uses_subprocessors',
    sectionId: 'third-party-sharing',
    order: 1,
    type: 'checkbox',
    semanticKey: 'uses_subprocessors',
    label: 'Uses subprocessors',
    defaultValue: false
  },
  {
    id: 'subprocessor_categories',
    sectionId: 'third-party-sharing',
    order: 2,
    type: 'multiselect',
    semanticKey: 'subprocessor_categories',
    label: 'Subprocessor categories',
    options: thirdPartySharingQuestionOptions,
    conditionalRules: [
      {
        dependsOn: 'uses_subprocessors',
        operator: 'equals',
        value: true,
        combinator: 'AND',
        visibility: 'show'
      }
    ],
    validation: {
      minSelections: 0
    }
  },
  {
    id: 'cross_border_transfers',
    sectionId: 'third-party-sharing',
    order: 3,
    type: 'checkbox',
    semanticKey: 'cross_border_transfers',
    label: 'Cross border transfers',
    defaultValue: false
  },
  {
    id: 'transfer_mechanisms',
    sectionId: 'third-party-sharing',
    order: 4,
    type: 'multiselect',
    semanticKey: 'transfer_mechanisms',
    label: 'Transfer safeguards',
    options: transferMechanismQuestionOptions,
    conditionalRules: [
      {
        dependsOn: 'cross_border_transfers',
        operator: 'equals',
        value: true,
        combinator: 'AND',
        visibility: 'show'
      }
    ],
    validation: {
      minSelections: 0
    }
  },
  {
    id: 'rights_supported',
    sectionId: 'user-rights',
    order: 1,
    type: 'multiselect',
    semanticKey: 'rights_supported',
    label: 'Rights supported by operations',
    options: rightsQuestionOptions,
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'audit_assistance',
    sectionId: 'user-rights',
    order: 2,
    type: 'checkbox',
    semanticKey: 'audit_assistance',
    label: 'Provides audit or inspection assistance',
    defaultValue: false
  },
  {
    id: 'breach_notification_timing',
    sectionId: 'user-rights',
    order: 3,
    type: 'text',
    semanticKey: 'breach_notification_timing',
    inputMode: 'text',
    label: 'Breach notification timing',
    placeholder: 'e.g. without undue delay and within 72 hours',
    validation: {
      required: true,
      minLength: 5
    }
  }
] satisfies readonly QuestionDefinition[];

export const dpaSchema = finalizeIntakeSchema({
  schemaId: 'dpa-intake-v1',
  id: 'dpa-intake',
  documentType: 'DPA',
  title: 'Data Processing Agreement Intake',
  description: 'Capture the factual inputs needed to generate a data processing agreement.',
  version: '1.0.0',
  createdAt: '2026-05-30T00:00:00.000Z',
  updatedAt: '2026-05-30T00:00:00.000Z',
  supportedJurisdictions: ['GDPR', 'DPDP', 'CCPA'],
  sections,
  questions
} satisfies IntakeSchemaDefinition);