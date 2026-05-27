import type { DocumentType } from '@/types';

export const documentTypes = [
  'Privacy Policy',
  'DPA',
  'Terms of Service',
  'Cookie Notice',
  'Data Retention Policy',
  'Vendor Agreement'
] as const satisfies readonly DocumentType[];

export const jurisdictionOptions = ['GDPR', 'DPDP', 'Both'] as const;
export const toneOptions = ['formal', 'balanced', 'concise'] as const;