import type { DocumentType, JurisdictionType } from './intake';

export type DocumentStatus = 'draft' | 'generated' | 'reviewed' | 'published';

export type DocumentDraft = {
  companyName: string;
  documentType: DocumentType;
  jurisdiction: JurisdictionType | 'Both';
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