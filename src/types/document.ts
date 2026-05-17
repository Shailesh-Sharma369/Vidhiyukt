export type DocumentType =
  | 'Privacy Policy'
  | 'DPA'
  | 'Terms of Service'
  | 'Cookie Notice'
  | 'Data Retention Policy'
  | 'Vendor Agreement';

export type DocumentStatus = 'draft' | 'generated' | 'reviewed' | 'published';

export type DocumentDraft = {
  companyName: string;
  documentType: DocumentType;
  jurisdiction: 'GDPR' | 'DPDP' | 'Both';
  tone: 'formal' | 'balanced' | 'concise';
  productSummary: string;
  dataCategories: string;
  audience: string;
};

export type GeneratedDocument = DocumentDraft & {
  id: string;
  title: string;
  status: DocumentStatus;
  excerpt: string;
  createdAt: string;
  sections: Array<{
    title: string;
    summary: string;
  }>;
};