import type { IntakeSchema, Question } from '@/types';
import {
  intakeSectionBlueprints,
  jurisdictionQuestionOptions,
  type IntakeSectionId
} from './shared';

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
    label: 'Company website',
    placeholder: 'https://example.com',
    validation: {
      required: true,
      pattern: '^https?://',
      message: 'Enter a valid website URL.'
    }
  },
  {
    id: 'support_contact_email',
    sectionId: 'company-information',
    order: 3,
    type: 'text',
    label: 'Support contact email',
    placeholder: 'support@example.com',
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
    id: 'requires_user_account',
    sectionId: 'data-collection',
    order: 1,
    type: 'checkbox',
    label: 'Requires user accounts',
    defaultValue: true
  },
  {
    id: 'minimum_age',
    sectionId: 'data-collection',
    order: 2,
    type: 'text',
    label: 'Minimum user age',
    placeholder: '18',
    validation: {
      required: true,
      pattern: '^\\d+$',
      message: 'Enter an integer age.'
    }
  },
  {
    id: 'user_content_allowed',
    sectionId: 'data-collection',
    order: 3,
    type: 'checkbox',
    label: 'Allows user-generated content',
    defaultValue: false
  },
  {
    id: 'subscription_model',
    sectionId: 'data-collection',
    order: 4,
    type: 'textarea',
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
    label: 'Uses payment processors',
    defaultValue: false
  },
  {
    id: 'export_restrictions',
    sectionId: 'third-party-sharing',
    order: 3,
    type: 'textarea',
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
    label: 'Disclose AI-assisted services or support',
    defaultValue: false
  }
] satisfies readonly Question[];

export const termsSchema = {
  id: 'terms-of-service-intake',
  documentType: 'Terms of Service',
  title: 'Terms of Service Intake',
  description: 'Capture the facts needed to generate enforceable terms of service language.',
  version: '1.0.0',
  supportedJurisdictions: ['GDPR', 'DPDP', 'CCPA'],
  sections,
  questions
} as const satisfies IntakeSchema;