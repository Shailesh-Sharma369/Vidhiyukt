import type { FormSection, QuestionOption } from '@/types';

export type IntakeSectionId = 'company-information' | 'data-collection' | 'processing-purpose' | 'third-party-sharing' | 'user-rights';

export const intakeSectionBlueprints = [
  {
    id: 'company-information',
    title: 'Company Information',
    description: 'Capture the legal entity, product context, and jurisdictional footprint.',
    order: 1
  },
  {
    id: 'data-collection',
    title: 'Data Collection',
    description: 'Describe the categories of data and how the product collects them.',
    order: 2
  },
  {
    id: 'processing-purpose',
    title: 'Processing Purpose',
    description: 'Map collection and processing to the business and compliance rationale.',
    order: 3
  },
  {
    id: 'third-party-sharing',
    title: 'Third Party Sharing',
    description: 'Describe vendors, subprocessors, and transfer mechanics.',
    order: 4
  },
  {
    id: 'user-rights',
    title: 'User Rights',
    description: 'Capture rights handling, request channels, and related operational details.',
    order: 5
  }
] as const satisfies readonly Omit<FormSection, 'questionIds'>[];

export const jurisdictionQuestionOptions = [
  {
    value: 'GDPR',
    label: 'GDPR',
    description: 'European Union and United Kingdom privacy obligations.'
  },
  {
    value: 'DPDP',
    label: 'DPDP Act',
    description: 'India Digital Personal Data Protection Act.'
  },
  {
    value: 'CCPA',
    label: 'CCPA / CPRA',
    description: 'California consumer privacy obligations.'
  }
] as const satisfies readonly QuestionOption[];

export const dataCategoryQuestionOptions = [
  { value: 'account-data', label: 'Account data' },
  { value: 'contact-data', label: 'Contact data' },
  { value: 'payment-data', label: 'Payment data' },
  { value: 'device-data', label: 'Device and browser data' },
  { value: 'usage-data', label: 'Usage and analytics data' },
  { value: 'support-data', label: 'Support and communications data' },
  { value: 'location-data', label: 'Location data' },
  { value: 'children-data', label: 'Children data' },
  { value: 'sensitive-data', label: 'Sensitive / special category data' }
] as const satisfies readonly QuestionOption[];

export const processingPurposeQuestionOptions = [
  { value: 'provide-services', label: 'Provide the service' },
  { value: 'manage-accounts', label: 'Manage accounts and authentication' },
  { value: 'analytics', label: 'Product analytics and improvement' },
  { value: 'support', label: 'Customer support and communications' },
  { value: 'security', label: 'Security, fraud, and abuse prevention' },
  { value: 'marketing', label: 'Marketing and outreach' },
  { value: 'legal-compliance', label: 'Legal and regulatory compliance' },
  { value: 'ai-training', label: 'AI / model training and tuning' }
] as const satisfies readonly QuestionOption[];

export const thirdPartySharingQuestionOptions = [
  { value: 'cloud-hosting', label: 'Cloud hosting providers' },
  { value: 'analytics-tools', label: 'Analytics tools' },
  { value: 'payment-processors', label: 'Payment processors' },
  { value: 'support-tools', label: 'Support and CRM tools' },
  { value: 'legal-authorities', label: 'Legal authorities or regulators' },
  { value: 'subprocessors', label: 'Subprocessors and affiliates' }
] as const satisfies readonly QuestionOption[];

export const rightsQuestionOptions = [
  { value: 'access', label: 'Access' },
  { value: 'correction', label: 'Correction / rectification' },
  { value: 'deletion', label: 'Deletion / erasure' },
  { value: 'portability', label: 'Portability' },
  { value: 'objection', label: 'Objection / opt-out' },
  { value: 'withdraw-consent', label: 'Withdraw consent' },
  { value: 'appeal', label: 'Appeal / complaint' }
] as const satisfies readonly QuestionOption[];

export const transferMechanismQuestionOptions = [
  { value: 'sccs', label: 'Standard Contractual Clauses (SCCs)' },
  { value: 'adequacy', label: 'Adequacy decision' },
  { value: 'consent', label: 'Consent-based transfer' },
  { value: 'intra-group', label: 'Intra-group transfer agreement' },
  { value: 'other', label: 'Other transfer safeguard' }
] as const satisfies readonly QuestionOption[];

export const lawfulBasisQuestionOptions = [
  { value: 'consent', label: 'Consent' },
  { value: 'contract', label: 'Contract necessity' },
  { value: 'legal-obligation', label: 'Legal obligation' },
  { value: 'vital-interests', label: 'Vital interests' },
  { value: 'public-task', label: 'Public task / official authority' },
  { value: 'legitimate-interests', label: 'Legitimate interests' }
] as const satisfies readonly QuestionOption[];

export const consentManagementQuestionOptions = [
  { value: 'granular-consent', label: 'Granular consent choices' },
  { value: 'withdrawal-available', label: 'Consent withdrawal available' },
  { value: 'consent-log', label: 'Consent logging and audit trail' },
  { value: 'parental-consent', label: 'Parental consent flow' },
  { value: 're-consent', label: 'Re-consent on purpose change' }
] as const satisfies readonly QuestionOption[];

export const grievanceContactQuestionOptions = [
  { value: 'email', label: 'Email' },
  { value: 'web-form', label: 'Web form' },
  { value: 'postal-mail', label: 'Postal mail' },
  { value: 'phone', label: 'Phone' }
] as const satisfies readonly QuestionOption[];