import { useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { DocumentGeneratorForm } from '@/components/forms/document-generator-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { useDocumentStore } from '@/store/documentStore';

export function GeneratorPage() {
  useDocumentTitle('SecureShip | Generator');

  const documents = useDocumentStore((state) => state.generatedDocuments);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const isLoadingDocuments = useDocumentStore((state) => state.isLoadingDocuments);

  const activeDocument = useMemo(
    () => documents.find((item) => item.id === activeDocumentId) ?? documents[0] ?? null,
    [activeDocumentId, documents]
  );

  if (isLoadingDocuments && documents.length === 0) {
    return <LoadingState title="Loading your documents" description="Syncing your Firestore workspace and recent legal drafts." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <DocumentGeneratorForm />
      <Card className="bg-slate-950/75">
        <CardHeader>
          <CardTitle>Generated document preview</CardTitle>
        </CardHeader>
        <CardContent>
          {activeDocument ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{activeDocument.status}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{activeDocument.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{activeDocument.excerpt}</p>
              </div>
              <div className="space-y-3">
                {activeDocument.sections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">{section.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{section.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No document generated yet"
              description="Use the form to create a privacy policy, DPA, or other legal draft and see the output here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}