import type { DocumentType } from '@/types';

export const documentTypes: DocumentType[] = [
  'Privacy Policy',
  'DPA',
  'Terms of Service',
  'Cookie Notice',
  'Data Retention Policy',
  'Vendor Agreement'
];

export const jurisdictionOptions = ['GDPR', 'DPDP', 'Both'] as const;
export const toneOptions = ['formal', 'balanced', 'concise'] as const;