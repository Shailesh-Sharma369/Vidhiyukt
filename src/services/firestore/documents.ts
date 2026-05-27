import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { firebaseDb } from '@/services/firebase/app';
import type { GeneratedDocument } from '@/types';
import type { SecureDocument, SecureDocumentInput, SecureDocumentPatch, SecureDocumentStatus } from '@/types/firestore';
import { deserializeGeneratedDocumentContent, serializeGeneratedDocumentContent } from './serializers';
import { firestoreTimestampToMillis, requireAuthUid, requireFirestoreDb, withFirestoreErrorHandling } from './shared';
import { createLogger } from '@/lib/logger';

const documentsLogger = createLogger('firestore][documents');

function getDocumentsCollection() {
  return collection(requireFirestoreDb(), 'documents');
}

function getDocumentRef(documentId: string) {
  return doc(requireFirestoreDb(), 'documents', documentId);
}

function assertDocumentStatus(status: SecureDocumentStatus | undefined): SecureDocumentStatus {
  if (!status) {
    return 'draft';
  }

  if (['draft', 'published', 'archived'].includes(status)) {
    return status;
  }

  return 'draft';
}

function mapFirestoreDocument(record: SecureDocument) {
  return deserializeGeneratedDocumentContent(record);
}

export async function createDocument(user: { uid: string }, document: GeneratedDocument): Promise<SecureDocument> {
  const createdBy = requireAuthUid(user);
  const input: SecureDocumentInput = {
    title: document.title.trim(),
    content: serializeGeneratedDocumentContent(document),
    status: 'draft'
  };

  return withFirestoreErrorHandling(async () => {
    const ref = doc(getDocumentsCollection());
    const payload = {
      title: input.title,
      content: input.content,
      status: assertDocumentStatus(input.status),
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(ref, payload);
    } catch (error) {
      documentsLogger.error('create failed', { uid: createdBy, path: `documents/${ref.id}`, payload, error });
      throw error;
    }

    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      throw new Error('Document was not created.');
    }

    return { id: snapshot.id, ...(snapshot.data() as Omit<SecureDocument, 'id'>) };
  });
}

export async function updateDocument(user: { uid: string }, documentId: string, patch: SecureDocumentPatch): Promise<SecureDocument> {
  const createdBy = requireAuthUid(user);
  const updatePayload: Partial<Pick<SecureDocument, 'title' | 'content' | 'status' | 'updatedAt'>> = {
    updatedAt: serverTimestamp()
  };

  if (typeof patch.title === 'string') {
    updatePayload.title = patch.title.trim();
  }

  if (typeof patch.content === 'string') {
    updatePayload.content = patch.content;
  }

  if (patch.status) {
    updatePayload.status = assertDocumentStatus(patch.status);
  }

  return withFirestoreErrorHandling(async () => {
    const ref = getDocumentRef(documentId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      throw new Error('Document not found.');
    }

    const current = snapshot.data() as Omit<SecureDocument, 'id'>;
    if (current.createdBy !== createdBy) {
      throw new Error('You can only update your own documents.');
    }

    try {
      await updateDoc(ref, updatePayload);
    } catch (error) {
      documentsLogger.error('update failed', { uid: createdBy, path: `documents/${documentId}`, payload: updatePayload, error });
      throw error;
    }

    const updatedSnapshot = await getDoc(ref);

    if (!updatedSnapshot.exists()) {
      throw new Error('Document not found after update.');
    }

    return { id: updatedSnapshot.id, ...(updatedSnapshot.data() as Omit<SecureDocument, 'id'>) };
  });
}

export async function deleteDocument(user: { uid: string }, documentId: string): Promise<void> {
  const createdBy = requireAuthUid(user);

  return withFirestoreErrorHandling(async () => {
    const ref = getDocumentRef(documentId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      return;
    }

    const current = snapshot.data() as Omit<SecureDocument, 'id'>;
    if (current.createdBy !== createdBy) {
      throw new Error('You can only delete your own documents.');
    }

    await deleteDoc(ref);
  });
}

export async function getUserDocuments(user: { uid: string }): Promise<GeneratedDocument[]> {
  const createdBy = requireAuthUid(user);

  return withFirestoreErrorHandling(async () => {
    const q = query(getDocumentsCollection(), where('createdBy', '==', createdBy));
    try {
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((record) => ({ id: record.id, ...(record.data() as Omit<SecureDocument, 'id'>) }))
        .sort((left, right) => firestoreTimestampToMillis(right.createdAt) - firestoreTimestampToMillis(left.createdAt))
        .map((record) => mapFirestoreDocument(record));
    } catch (error) {
      documentsLogger.error('read failed', { uid: createdBy, query: { collection: 'documents', createdBy }, error });
      throw error;
    }
  });
}