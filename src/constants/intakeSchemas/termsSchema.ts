import type { IntakeSchemaDefinition, QuestionDefinition } from '@/types';
import {
  intakeSectionBlueprints,
  jurisdictionQuestionOptions,
  type IntakeSectionId
} from './shared';
import { finalizeIntakeSchema } from '../../lib/intake/schemaHelpers';

const questionIdsBySection: Record<IntakeSectionId, string[]> = {
  'company-information': ['company_name', 'company_website', 'support_contact_email', 'jurisdictions_in_scope'],
  'data-collection': ['requires_user_account', 'minimum_age', 'user_content_allowed', 'subscription_model'],
  'processing-purpose': ['service_scope', 'acceptable_use', 'account_termination_terms'],
  'third-party-sharing': ['third_party_services', 'payment_processors', 'export_restrictions'],
  'user-rights': ['dispute_resolution', 'governing_law', 'ai_assistance_disclosure']
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
    semanticKey: 'company_name',
    label: 'Company name',
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
    id: 'support_contact_email',
    sectionId: 'company-information',
    order: 3,
    type: 'text',
    semanticKey: 'support_contact_email',
    inputMode: 'email',
    label: 'Support contact email',
    placeholder: 'support@example.com',
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
    id: 'requires_user_account',
    sectionId: 'data-collection',
    order: 1,
    type: 'checkbox',
    semanticKey: 'requires_user_account',
    label: 'Requires user accounts',
    defaultValue: true
  },
  {
    id: 'minimum_age',
    sectionId: 'data-collection',
    order: 2,
    type: 'text',
    semanticKey: 'minimum_age',
    inputMode: 'numeric',
    label: 'Minimum user age',
    placeholder: '18',
    validation: {
      required: true,
      pattern: '^\\d+$',
      customErrorMessage: 'Enter an integer age.'
    }
  },
  {
    id: 'user_content_allowed',
    sectionId: 'data-collection',
    order: 3,
    type: 'checkbox',
    semanticKey: 'user_content_allowed',
    label: 'Allows user-generated content',
    defaultValue: false
  },
  {
    id: 'subscription_model',
    sectionId: 'data-collection',
    order: 4,
    type: 'textarea',
    semanticKey: 'subscription_model',
    label: 'Subscription or billing model',
    placeholder: 'Describe paid plans, renewals, free trials, and cancellations.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'service_scope',
    sectionId: 'processing-purpose',
    order: 1,
    type: 'textarea',
    semanticKey: 'service_scope',
    label: 'Service scope',
    placeholder: 'Describe the software or services covered by the terms.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'acceptable_use',
    sectionId: 'processing-purpose',
    order: 2,
    type: 'textarea',
    semanticKey: 'acceptable_use',
    label: 'Acceptable use restrictions',
    placeholder: 'Describe prohibited conduct, misuse, and abuse handling.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'account_termination_terms',
    sectionId: 'processing-purpose',
    order: 3,
    type: 'textarea',
    semanticKey: 'account_termination_terms',
    label: 'Account suspension and termination terms',
    placeholder: 'Describe suspension rights, termination triggers, and notice periods.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'third_party_services',
    sectionId: 'third-party-sharing',
    order: 1,
    type: 'textarea',
    semanticKey: 'third_party_services',
    label: 'Third party services',
    placeholder: 'List integrated vendors, subprocessors, and dependencies.',
    validation: {
      required: false,
      minLength: 10
    }
  },
  {
    id: 'payment_processors',
    sectionId: 'third-party-sharing',
    order: 2,
    type: 'checkbox',
    semanticKey: 'payment_processors',
    label: 'Uses payment processors',
    defaultValue: false
  },
  {
    id: 'export_restrictions',
    sectionId: 'third-party-sharing',
    order: 3,
    type: 'textarea',
    semanticKey: 'export_restrictions',
    label: 'Export or geographic restrictions',
    placeholder: 'Describe export controls, sanctions, or regional restrictions.',
    validation: {
      required: false,
      minLength: 10
    }
  },
  {
    id: 'dispute_resolution',
    sectionId: 'user-rights',
    order: 1,
    type: 'textarea',
    semanticKey: 'dispute_resolution',
    label: 'Dispute resolution',
    placeholder: 'Describe arbitration, venue, or escalation terms.',
    validation: {
      required: true,
      minLength: 20
    }
  },
  {
    id: 'governing_law',
    sectionId: 'user-rights',
    order: 2,
    type: 'text',
    semanticKey: 'governing_law',
    label: 'Governing law',
    placeholder: 'State or country law',
    validation: {
      required: true,
      minLength: 3
    }
  },
  {
    id: 'ai_assistance_disclosure',
    sectionId: 'user-rights',
    order: 3,
    type: 'checkbox',
    semanticKey: 'ai_assistance_disclosure',
    label: 'Disclose AI-assisted services or support',
    defaultValue: false
  }
] satisfies readonly QuestionDefinition[];

export const termsSchema = finalizeIntakeSchema({
  schemaId: 'terms-of-service-intake-v1',
  id: 'terms-of-service-intake',
  documentType: 'Terms of Service',
  title: 'Terms of Service Intake',
  description: 'Capture the facts needed to generate enforceable terms of service language.',
  version: '1.0.0',
  createdAt: '2026-05-30T00:00:00.000Z',
  updatedAt: '2026-05-30T00:00:00.000Z',
  supportedJurisdictions: ['GDPR', 'DPDP', 'CCPA'],
  sections,
  questions
} satisfies IntakeSchemaDefinition);