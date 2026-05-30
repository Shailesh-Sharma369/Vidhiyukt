import type { IntakeSchema, Question } from '@/types';
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
    label: 'Data processing contact email',
    placeholder: 'privacy@example.com',
    validation: {
      required: true,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      message: 'Enter a valid email address.'
    }
  },
  {
    id: 'jurisdictions_in_scope',
    sectionId: 'company-information',
    order: 4,
    type: 'multiselect',
    label: 'Jurisdictions in scope',
    options: jurisdictionQuestionOptions,
    defaultValue: ['GDPR'],
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'personal_data_categories',
    sectionId: 'data-collection',
    order: 1,
    type: 'multiselect',
    label: 'Personal data categories',
    options: dataCategoryQuestionOptions,
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'special_category_data',
    sectionId: 'data-collection',
    order: 2,
    type: 'checkbox',
    label: 'Processes special category or sensitive data',
    defaultValue: false
  },
  {
    id: 'children_data',
    sectionId: 'data-collection',
    order: 3,
    type: 'checkbox',
    label: 'Processes children data',
    defaultValue: false
  },
  {
    id: 'processing_purposes',
    sectionId: 'processing-purpose',
    order: 1,
    type: 'multiselect',
    label: 'Processing purposes',
    options: processingPurposeQuestionOptions,
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'instructions_handling',
    sectionId: 'processing-purpose',
    order: 2,
    type: 'textarea',
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
    label: 'Uses subprocessors',
    defaultValue: false
  },
  {
    id: 'subprocessor_categories',
    sectionId: 'third-party-sharing',
    order: 2,
    type: 'multiselect',
    label: 'Subprocessor categories',
    options: thirdPartySharingQuestionOptions,
    validation: {
      minSelected: 0
    }
  },
  {
    id: 'cross_border_transfers',
    sectionId: 'third-party-sharing',
    order: 3,
    type: 'checkbox',
    label: 'Cross border transfers',
    defaultValue: false
  },
  {
    id: 'transfer_mechanisms',
    sectionId: 'third-party-sharing',
    order: 4,
    type: 'multiselect',
    label: 'Transfer safeguards',
    options: transferMechanismQuestionOptions,
    validation: {
      minSelected: 0
    }
  },
  {
    id: 'rights_supported',
    sectionId: 'user-rights',
    order: 1,
    type: 'multiselect',
    label: 'Rights supported by operations',
    options: rightsQuestionOptions,
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'audit_assistance',
    sectionId: 'user-rights',
    order: 2,
    type: 'checkbox',
    label: 'Provides audit or inspection assistance',
    defaultValue: false
  },
  {
    id: 'breach_notification_timing',
    sectionId: 'user-rights',
    order: 3,
    type: 'text',
    label: 'Breach notification timing',
    placeholder: 'e.g. without undue delay and within 72 hours',
    validation: {
      required: true,
      minLength: 5
    }
  }
] satisfies readonly Question[];

export const dpaSchema = {
  id: 'dpa-intake',
  documentType: 'DPA',
  title: 'Data Processing Agreement Intake',
  description: 'Capture the factual inputs needed to generate a data processing agreement.',
  version: '1.0.0',
  supportedJurisdictions: ['GDPR', 'DPDP', 'CCPA'],
  sections,
  questions
} as const satisfies IntakeSchema;