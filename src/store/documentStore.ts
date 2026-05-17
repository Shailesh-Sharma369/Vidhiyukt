import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateLegalDocument } from '@/services/ai/localAi';
import type { DocumentDraft, GeneratedDocument } from '@/types';

type DocumentStore = {
  draft: DocumentDraft;
  generatedDocuments: GeneratedDocument[];
  activeDocumentId: string | null;
  isGenerating: boolean;
  setDraft: (patch: Partial<DocumentDraft>) => void;
  generateDocument: () => Promise<GeneratedDocument>;
  selectDocument: (id: string) => void;
  clearActiveDocument: () => void;
};

const initialDraft: DocumentDraft = {
  companyName: 'SecureShip',
  documentType: 'Privacy Policy',
  jurisdiction: 'GDPR',
  tone: 'balanced',
  productSummary: 'AI compliance workspace for legal and privacy teams.',
  dataCategories: 'Account data, usage telemetry, audit logs',
  audience: 'SaaS customers and internal privacy teams'
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      draft: initialDraft,
      generatedDocuments: [],
      activeDocumentId: null,
      isGenerating: false,
      setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      generateDocument: async () => {
        set({ isGenerating: true });
        const document = await generateLegalDocument(get().draft);
        set((state) => ({
          isGenerating: false,
          generatedDocuments: [document, ...state.generatedDocuments].slice(0, 10),
          activeDocumentId: document.id
        }));
        return document;
      },
      selectDocument: (id) => set({ activeDocumentId: id }),
      clearActiveDocument: () => set({ activeDocumentId: null })
    }),
    {
      name: 'secureship-documents',
      partialize: (state) => ({ generatedDocuments: state.generatedDocuments, draft: state.draft })
    }
  )
);