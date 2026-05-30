import type { IntakeSchemaDefinition, QuestionDefinition } from '@/types';
import {
  dataCategoryQuestionOptions,
  consentManagementQuestionOptions,
  lawfulBasisQuestionOptions,
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
  'company-information': ['company_name', 'company_website', 'privacy_contact_email', 'grievance_officer_name', 'grievance_officer_contact', 'jurisdictions_in_scope'],
  'data-collection': ['collects_children_data', 'collects_sensitive_data', 'data_categories', 'collection_methods'],
  'processing-purpose': ['processing_purposes', 'lawful_basis', 'consent_management', 'automated_decision_making', 'retention_period'],
  'third-party-sharing': ['shares_data_with_vendors', 'sells_or_shares_personal_data', 'ccpa_opt_out_mechanism', 'third_party_categories', 'cross_border_transfers', 'transfer_mechanisms'],
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
    semanticKey: 'data_controller_name',
    label: 'Company name',
    description: 'Legal entity name used in the policy.',
    placeholder: 'SecureShip, Inc.',
    aiMetadata: {
      clauseCategory: 'data-controller-identification',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Use the legal entity name that appears in contracts and notices.']
    },
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
    semanticKey: 'company_website',
    inputMode: 'url',
    label: 'Company website',
    placeholder: 'https://example.com',
    validation: {
      required: true,
      pattern: '^https?://',
      customErrorMessage: 'Enter a valid website URL.'
    }
  },
  {
    id: 'privacy_contact_email',
    sectionId: 'company-information',
    order: 3,
    type: 'text',
    semanticKey: 'privacy_contact_email',
    inputMode: 'email',
    label: 'Privacy contact email',
    placeholder: 'privacy@example.com',
    validation: {
      required: true,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      customErrorMessage: 'Enter a valid email address.'
    }
  },
  {
    id: 'grievance_officer_name',
    sectionId: 'company-information',
    order: 4,
    type: 'text',
    semanticKey: 'grievance_officer_name',
    label: 'Grievance officer name',
    placeholder: 'Privacy lead or grievance officer',
    aiMetadata: {
      clauseCategory: 'grievance-handling',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['DPDP'],
      promptHints: ['Capture the named officer or accountable privacy contact.'],
      complianceTags: ['dpdp-grievance-officer']
    }
  },
  {
    id: 'grievance_officer_contact',
    sectionId: 'company-information',
    order: 5,
    type: 'text',
    semanticKey: 'grievance_officer_contact',
    inputMode: 'email',
    label: 'Grievance officer contact',
    placeholder: 'grievance@example.com',
    validation: {
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      customErrorMessage: 'Enter a valid contact email address.'
    },
    aiMetadata: {
      clauseCategory: 'grievance-contact',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['DPDP'],
      promptHints: ['Provide a contact channel for grievance and complaint escalation.'],
      complianceTags: ['dpdp-grievance-contact']
    }
  },
  {
    id: 'jurisdictions_in_scope',
    sectionId: 'company-information',
    order: 6,
    type: 'multiselect',
    semanticKey: 'jurisdictions_in_scope',
    label: 'Jurisdictions in scope',
    description: 'Select the privacy regimes the policy needs to support.',
    options: jurisdictionQuestionOptions,
    defaultValue: ['GDPR'],
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'collects_children_data',
    sectionId: 'data-collection',
    order: 1,
    type: 'checkbox',
    semanticKey: 'collects_children_data',
    label: 'Collects children data',
    description: 'Indicate whether the product knowingly processes children data.',
    defaultValue: false,
    aiMetadata: {
      clauseCategory: 'children-data-processing',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Only mark true if the product knowingly processes children data.'],
      complianceTags: ['gdpr-article-8', 'dpdp-child-data', 'ccpa-minors']
    }
  },
  {
    id: 'collects_sensitive_data',
    sectionId: 'data-collection',
    order: 2,
    type: 'checkbox',
    semanticKey: 'collects_sensitive_data',
    label: 'Collects sensitive or special category data',
    defaultValue: false,
    aiMetadata: {
      clauseCategory: 'sensitive-data-processing',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Mark true if the product processes sensitive, special category, or regulated personal data.'],
      complianceTags: ['gdpr-article-9', 'ccpa-sensitive-data']
    }
  },
  {
    id: 'data_categories',
    sectionId: 'data-collection',
    order: 3,
    type: 'multiselect',
    semanticKey: 'data_categories_collected',
    label: 'Data categories collected',
    options: dataCategoryQuestionOptions,
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'collection_methods',
    sectionId: 'data-collection',
    order: 4,
    type: 'textarea',
    semanticKey: 'data_collection_methods',
    label: 'Collection methods',
    placeholder: 'Describe forms, SDKs, integrations, logs, and other collection points.',
    validation: {
      required: true,
      minLength: 20,
    },
    aiMetadata: {
      clauseCategory: 'retention-disclosure',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Specify retention by data category or operational purpose.', 'Include deletion or anonymization triggers.'],
      complianceTags: ['gdpr-article-13', 'ccpa-retention']
    }
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
    id: 'lawful_basis',
    sectionId: 'processing-purpose',
    order: 2,
    type: 'multiselect',
    semanticKey: 'lawful_basis',
    label: 'Lawful basis',
    description: 'Select the legal bases used to process personal data.',
    options: lawfulBasisQuestionOptions,
    validation: {
      required: true,
      minSelections: 1
    },
    aiMetadata: {
      clauseCategory: 'lawful-basis',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Map each purpose to a valid legal basis before drafting the notice.'],
      complianceTags: ['gdpr-article-6', 'ccpa-purpose-limitation']
    }
  },
  {
    id: 'consent_management',
    sectionId: 'processing-purpose',
    order: 3,
    type: 'multiselect',
    semanticKey: 'consent_management',
    label: 'Consent management controls',
    description: 'Describe how consent is captured, logged, withdrawn, and refreshed.',
    options: consentManagementQuestionOptions,
    conditionalRules: [
      {
        dependsOn: 'lawful_basis',
        operator: 'includes',
        value: 'consent',
        combinator: 'AND',
        visibility: 'show'
      }
    ],
    aiMetadata: {
      clauseCategory: 'consent-management',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Include withdrawal, logging, age-gating, and consent refresh mechanics.'],
      complianceTags: ['gdpr-consent', 'ccpa-consent-management']
    }
  },
  {
    id: 'automated_decision_making',
    sectionId: 'processing-purpose',
    order: 2,
    type: 'checkbox',
    semanticKey: 'automated_decision_making',
    label: 'Uses automated decision making or profiling',
    defaultValue: false
  },
  {
    id: 'retention_period',
    sectionId: 'processing-purpose',
    order: 4,
    type: 'textarea',
    semanticKey: 'retention_period',
    label: 'Retention period',
    placeholder: 'Describe how long each category of data is retained.',
    validation: {
      required: true,
      minLength: 20
    },
    aiMetadata: {
      clauseCategory: 'retention-disclosure',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Specify retention by data category or operational purpose.', 'Include deletion or anonymization triggers.'],
      complianceTags: ['gdpr-article-13', 'ccpa-retention', 'dpdp-retention']
    }
  },
  {
    id: 'shares_data_with_vendors',
    sectionId: 'third-party-sharing',
    order: 1,
    type: 'checkbox',
    semanticKey: 'shares_data_with_vendors',
    label: 'Shares data with vendors or third parties',
    defaultValue: false
  },
  {
    id: 'sells_or_shares_personal_data',
    sectionId: 'third-party-sharing',
    order: 2,
    type: 'checkbox',
    semanticKey: 'sells_or_shares_personal_data',
    label: 'Sells or shares personal data for targeted advertising',
    defaultValue: false,
    aiMetadata: {
      clauseCategory: 'ccpa-sale-share',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['CCPA'],
      promptHints: ['Set true if the business sells or shares personal data as defined by CCPA/CPRA.']
    }
  },
  {
    id: 'ccpa_opt_out_mechanism',
    sectionId: 'third-party-sharing',
    order: 3,
    type: 'textarea',
    semanticKey: 'ccpa_opt_out_mechanism',
    label: 'CCPA opt-out mechanism',
    placeholder: 'Describe the Do Not Sell or Share link, form, or workflow.',
    conditionalRules: [
      {
        dependsOn: 'sells_or_shares_personal_data',
        operator: 'equals',
        value: true,
        combinator: 'AND',
        visibility: 'show'
      }
    ],
    aiMetadata: {
      clauseCategory: 'ccpa-opt-out',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['CCPA'],
      promptHints: ['Describe the operational path for consumer opt-out requests.']
    }
  },
  {
    id: 'third_party_categories',
    sectionId: 'third-party-sharing',
    order: 4,
    type: 'multiselect',
    semanticKey: 'third_party_categories',
    label: 'Third party categories',
    options: thirdPartySharingQuestionOptions,
    validation: {
      minSelections: 0
    },
    aiMetadata: {
      clauseCategory: 'cross-border-transfer-safeguards',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP'],
      promptHints: ['Document the legal mechanism used for international transfers.', 'Include SCCs, adequacy, or comparable safeguards.'],
      complianceTags: ['gdpr-chapter-v', 'dpdp-transfer']
    }
  },
  {
    id: 'cross_border_transfers',
    sectionId: 'third-party-sharing',
    order: 5,
    type: 'checkbox',
    semanticKey: 'cross_border_transfers',
    label: 'Cross border transfers',
    defaultValue: false,
    aiMetadata: {
      clauseCategory: 'cross-border-transfers',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP'],
      promptHints: ['Confirm whether personal data leaves the primary jurisdiction.', 'Identify destination countries or regions.'],
      complianceTags: ['gdpr-chapter-v', 'dpdp-cross-border']
    }
  },
  {
    id: 'transfer_mechanisms',
    sectionId: 'third-party-sharing',
    order: 6,
    type: 'multiselect',
    semanticKey: 'transfer_mechanisms',
    label: 'Transfer safeguards',
    options: transferMechanismQuestionOptions,
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
    label: 'User rights supported',
    options: rightsQuestionOptions,
    validation: {
      required: true,
      minSelections: 1
    }
  },
  {
    id: 'rights_request_channel',
    sectionId: 'user-rights',
    order: 2,
    type: 'text',
    semanticKey: 'rights_request_channel',
    inputMode: 'email',
    label: 'Rights request channel',
    placeholder: 'privacy@example.com or web form URL',
    validation: {
      required: true,
      minLength: 3
    },
    aiMetadata: {
      clauseCategory: 'rights-request-contact',
      importance: 'high',
      affectsCompliance: true,
      complianceFrameworks: ['GDPR', 'DPDP', 'CCPA'],
      promptHints: ['Provide a contact path for privacy requests and appeals.'],
      complianceTags: ['gdpr-article-12', 'ccpa-request-contact']
    }
  },
  {
    id: 'child_data_retention_question',
    sectionId: 'user-rights',
    order: 3,
    type: 'textarea',
    semanticKey: 'child_data_retention_question',
    label: 'Children data retention handling',
    placeholder: 'Describe retention, deletion, parental consent, and safeguards for children data.',
    conditionalRules: [
      {
        dependsOn: 'collects_children_data',
        operator: 'equals',
        value: true,
        combinator: 'AND',
        visibility: 'show'
      }
    ],
    validation: {
      required: false,
      minLength: 10
    }
  }
] satisfies readonly QuestionDefinition[];

export const privacyPolicySchema = finalizeIntakeSchema({
  schemaId: 'privacy-policy-intake-v1',
  id: 'privacy-policy-intake',
  documentType: 'Privacy Policy',
  title: 'Privacy Policy Intake',
  description: 'Capture the facts needed to generate a privacy policy across major privacy regimes.',
  version: '1.0.0',
  createdAt: '2026-05-30T00:00:00.000Z',
  updatedAt: '2026-05-30T00:00:00.000Z',
  supportedJurisdictions: ['GDPR', 'DPDP', 'CCPA'],
  sections,
  questions
} satisfies IntakeSchemaDefinition);