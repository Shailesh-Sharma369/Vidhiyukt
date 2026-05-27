import { collection, getDoc, getDocs, query, serverTimestamp, addDoc, where } from 'firebase/firestore';
import type { AuditLog, AuditLogInput } from '@/types/firestore';
import { firestoreTimestampToMillis, requireAuthUid, requireFirestoreDb, withFirestoreErrorHandling } from './shared';

function getAuditsCollection() {
  return collection(requireFirestoreDb(), 'audits');
}

function mapAuditRecord(id: string, data: Omit<AuditLog, 'id'>): AuditLog {
  return { id, ...data };
}

export async function createAuditLog(user: { uid: string }, input: AuditLogInput): Promise<AuditLog> {
  const createdBy = requireAuthUid(user);

  return withFirestoreErrorHandling(async () => {
    const payload = {
      createdBy,
      action: input.action.trim(),
      targetDocId: input.targetDocId,
      createdAt: serverTimestamp()
    } as const;

    const writePayload = {
      ...payload,
      ...(typeof input.details === 'string' ? { details: input.details } : {}),
      ...(typeof input.score === 'number' ? { score: input.score } : {})
    };

    try {
      const ref = await addDoc(getAuditsCollection(), writePayload);
      const snapshot = await getDoc(ref);
      return mapAuditRecord(ref.id, snapshot.data() as Omit<AuditLog, 'id'>);
    } catch (error) {
      console.error('[firestore][audits] create failed', { uid: createdBy, path: 'audits/*', payload: writePayload, error });
      throw error;
    }
  });
}

export async function getUserAudits(user: { uid: string }): Promise<AuditLog[]> {
  const createdBy = requireAuthUid(user);

  return withFirestoreErrorHandling(async () => {
    const q = query(getAuditsCollection(), where('createdBy', '==', createdBy));
    try {
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((record) => mapAuditRecord(record.id, record.data() as Omit<AuditLog, 'id'>))
        .sort((left, right) => firestoreTimestampToMillis(right.createdAt) - firestoreTimestampToMillis(left.createdAt));
    } catch (error) {
      console.error('[firestore][audits] read failed', { uid: createdBy, query: { collection: 'audits', createdBy }, error });
      throw error;
    }
  });
}