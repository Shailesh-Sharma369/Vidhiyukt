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
  'company-information': ['company_name', 'company_website', 'privacy_contact_email', 'jurisdictions_in_scope'],
  'data-collection': ['collects_children_data', 'collects_sensitive_data', 'data_categories', 'collection_methods'],
  'processing-purpose': ['processing_purposes', 'automated_decision_making', 'retention_period'],
  'third-party-sharing': ['shares_data_with_vendors', 'third_party_categories', 'cross_border_transfers', 'transfer_mechanisms'],
  'user-rights': ['rights_supported', 'rights_request_channel', 'child_data_retention_question']
};

const sections = intakeSectionBlueprints.map((section) => ({
  ...section,
  questionIds: questionIdsBySection[section.id]
}));

const questions = [
  {
    id: 'company_name',
    sectionId: 'company-information',
    order: 1,
    type: 'text',
    label: 'Company name',
    description: 'Legal entity name used in the policy.',
    placeholder: 'SecureShip, Inc.',
    validation: {
      required: true,
      minLength: 2
    }
  },
  {
    id: 'company_website',
    sectionId: 'company-information',
    order: 2,
    type: 'text',
    label: 'Company website',
    placeholder: 'https://example.com',
    validation: {
      required: true,
      pattern: '^https?://',
      message: 'Enter a valid website URL.'
    }
  },
  {
    id: 'privacy_contact_email',
    sectionId: 'company-information',
    order: 3,
    type: 'text',
    label: 'Privacy contact email',
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
    description: 'Select the privacy regimes the policy needs to support.',
    options: jurisdictionQuestionOptions,
    defaultValue: ['GDPR'],
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'collects_children_data',
    sectionId: 'data-collection',
    order: 1,
    type: 'checkbox',
    label: 'Collects children data',
    description: 'Indicate whether the product knowingly processes children data.',
    defaultValue: false
  },
  {
    id: 'collects_sensitive_data',
    sectionId: 'data-collection',
    order: 2,
    type: 'checkbox',
    label: 'Collects sensitive or special category data',
    defaultValue: false
  },
  {
    id: 'data_categories',
    sectionId: 'data-collection',
    order: 3,
    type: 'multiselect',
    label: 'Data categories collected',
    options: dataCategoryQuestionOptions,
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'collection_methods',
    sectionId: 'data-collection',
    order: 4,
    type: 'textarea',
    label: 'Collection methods',
    placeholder: 'Describe forms, SDKs, integrations, logs, and other collection points.',
    validation: {
      required: true,
      minLength: 20
    }
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
    id: 'automated_decision_making',
    sectionId: 'processing-purpose',
    order: 2,
    type: 'checkbox',
    label: 'Uses automated decision making or profiling',
    defaultValue: false
  },
  {
    id: 'retention_period',
    sectionId: 'processing-purpose',
    order: 3,
    type: 'textarea',
    label: 'Retention period',
    placeholder: 'Describe how long each category of data is retained.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'shares_data_with_vendors',
    sectionId: 'third-party-sharing',
    order: 1,
    type: 'checkbox',
    label: 'Shares data with vendors or third parties',
    defaultValue: false
  },
  {
    id: 'third_party_categories',
    sectionId: 'third-party-sharing',
    order: 2,
    type: 'multiselect',
    label: 'Third party categories',
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
    label: 'User rights supported',
    options: rightsQuestionOptions,
    validation: {
      required: true,
      minSelected: 1
    }
  },
  {
    id: 'rights_request_channel',
    sectionId: 'user-rights',
    order: 2,
    type: 'text',
    label: 'Rights request channel',
    placeholder: 'privacy@example.com or web form URL',
    validation: {
      required: true,
      minLength: 3
    }
  },
  {
    id: 'child_data_retention_question',
    sectionId: 'user-rights',
    order: 3,
    type: 'textarea',
    label: 'Children data retention handling',
    placeholder: 'Describe retention, deletion, parental consent, and safeguards for children data.',
    conditionalRules: [
      {
        id: 'show-child-retention-question',
        conditions: [
          {
            questionId: 'collects_children_data',
            operator: 'equals',
            value: true
          }
        ],
        logic: 'all',
        action: 'show',
        targetQuestionIds: ['child_data_retention_question']
      }
    ],
    validation: {
      required: false,
      minLength: 10
    }
  }
] satisfies readonly Question[];

export const privacyPolicySchema = {
  id: 'privacy-policy-intake',
  documentType: 'Privacy Policy',
  title: 'Privacy Policy Intake',
  description: 'Capture the facts needed to generate a privacy policy across major privacy regimes.',
  version: '1.0.0',
  supportedJurisdictions: ['GDPR', 'DPDP', 'CCPA'],
  sections,
  questions
} as const satisfies IntakeSchema;