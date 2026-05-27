import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateLegalDocument } from '@/services/ai/localAi';
import type { DocumentDraft, GeneratedDocument } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { createDocument, getUserDocuments } from '@/services/firestore/documents';
import { deserializeGeneratedDocumentContent } from '@/services/firestore/serializers';
import { FirestoreServiceError } from '@/services/firestore/shared';
import { showToast } from '@/store/toastStore';

type DocumentStore = {
  draft: DocumentDraft;
  generatedDocuments: GeneratedDocument[];
  activeDocumentId: string | null;
  isGenerating: boolean;
  isLoadingDocuments: boolean;
  setDraft: (patch: Partial<DocumentDraft>) => void;
  loadUserDocuments: () => Promise<void>;
  generateDocument: () => Promise<GeneratedDocument>;
  selectDocument: (id: string) => void;
  clearActiveDocument: () => void;
  resetDocuments: () => void;
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
      isLoadingDocuments: false,
      setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      loadUserDocuments: async () => {
        const user = useAuthStore.getState().user;

        if (!user) {
          set({ generatedDocuments: [], activeDocumentId: null, isLoadingDocuments: false });
          return;
        }

        set({ isLoadingDocuments: true });

        try {
          console.debug('[firestore][documents] load start', { uid: user.uid });
          const documents = await getUserDocuments(user);
          set({
            generatedDocuments: documents,
            activeDocumentId: documents[0]?.id ?? null
          });
          console.debug('[firestore][documents] load success', { uid: user.uid, count: documents.length });
        } catch (error) {
          console.debug('[firestore][documents] load failed', { uid: user.uid, error });
          const message = error instanceof Error ? error.message : 'Failed to load your documents.';
          showToast({ title: 'Document sync failed', description: message, variant: 'error' });
        } finally {
          set({ isLoadingDocuments: false });
        }
      },
      generateDocument: async () => {
        const user = useAuthStore.getState().user;

        if (!user) {
          throw new FirestoreServiceError('You must be signed in to generate documents.', 'unauthenticated');
        }

        set({ isGenerating: true });

        try {
          console.debug('[firestore][documents] write start', { uid: user.uid });
          const document = await generateLegalDocument(get().draft);
          set((state) => ({
            generatedDocuments: [document, ...state.generatedDocuments.filter((item) => item.id !== document.id)].slice(0, 10),
            activeDocumentId: document.id
          }));

          const savedDocument = await createDocument(user, document);
          const hydratedDocument = deserializeGeneratedDocumentContent(savedDocument);

          set((state) => ({
            generatedDocuments: [hydratedDocument, ...state.generatedDocuments.filter((item) => item.id !== document.id)].slice(0, 10),
            activeDocumentId: hydratedDocument.id
          }));

          console.debug('[firestore][documents] write success', { uid: user.uid, id: hydratedDocument.id });

          return hydratedDocument;
        } catch (error) {
          console.debug('[firestore][documents] write failed', { uid: user.uid, error });
          const message = error instanceof Error ? error.message : 'Failed to generate or sync the document.';
          showToast({ title: 'Document generation failed', description: message, variant: 'error' });
          throw error;
        } finally {
          set({ isGenerating: false });
        }
      },
      selectDocument: (id) => set({ activeDocumentId: id }),
      clearActiveDocument: () => set({ activeDocumentId: null }),
      resetDocuments: () => set({ generatedDocuments: [], activeDocumentId: null, isGenerating: false, isLoadingDocuments: false })
    }),
    {
      name: 'secureship-documents',
      partialize: (state) => ({ draft: state.draft })
    }
  )
);