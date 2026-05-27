import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import type { ComplianceReport } from '@/types';
import type { Report, ReportInput, ReportPatch, ReportType } from '@/types/firestore';
import { deserializeComplianceReportContent, serializeComplianceReportContent } from './serializers';
import { firestoreTimestampToMillis, requireAuthUid, requireFirestoreDb, withFirestoreErrorHandling } from './shared';
import { createLogger } from '@/lib/logger';

const reportsLogger = createLogger('firestore][reports');

function getReportsCollection() {
  return collection(requireFirestoreDb(), 'reports');
}

function getReportRef(reportId: string) {
  return doc(requireFirestoreDb(), 'reports', reportId);
}

function assertReportType(type: ReportType | undefined): ReportType {
  if (!type) {
    return 'summary';
  }

  if (['summary', 'detailed', 'analytics'].includes(type)) {
    return type;
  }

  return 'summary';
}

function mapFirestoreReport(record: Report) {
  return deserializeComplianceReportContent(record);
}

export async function createReport(user: { uid: string }, report: ComplianceReport, type: ReportType = 'summary'): Promise<Report> {
  const createdBy = requireAuthUid(user);
  const input: ReportInput = {
    title: report.title.trim(),
    type: assertReportType(type),
    content: serializeComplianceReportContent(report)
  };

  return withFirestoreErrorHandling(async () => {
    const ref = doc(getReportsCollection());
    const payload = {
      title: input.title,
      type: input.type,
      content: input.content,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(ref, payload);
    } catch (error) {
      reportsLogger.error('create failed', { uid: createdBy, path: `reports/${ref.id}`, payload, error });
      throw error;
    }

    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error('Report was not created.');
    }

    return { id: snapshot.id, ...(snapshot.data() as Omit<Report, 'id'>) };
  });
}

export async function updateReport(user: { uid: string }, reportId: string, patch: ReportPatch): Promise<Report> {
  const createdBy = requireAuthUid(user);
  const updatePayload: Partial<Pick<Report, 'title' | 'type' | 'content' | 'updatedAt'>> = {
    updatedAt: serverTimestamp()
  };

  if (typeof patch.title === 'string') {
    updatePayload.title = patch.title.trim();
  }

  if (typeof patch.type === 'string') {
    updatePayload.type = assertReportType(patch.type);
  }

  if (typeof patch.content === 'string') {
    updatePayload.content = patch.content;
  }

  return withFirestoreErrorHandling(async () => {
    const ref = getReportRef(reportId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      throw new Error('Report not found.');
    }

    const current = snapshot.data() as Omit<Report, 'id'>;
    if (current.createdBy !== createdBy) {
      throw new Error('You can only update your own reports.');
    }

    try {
      await updateDoc(ref, updatePayload);
    } catch (error) {
      reportsLogger.error('update failed', { uid: createdBy, path: `reports/${reportId}`, payload: updatePayload, error });
      throw error;
    }

    const updatedSnapshot = await getDoc(ref);

    if (!updatedSnapshot.exists()) {
      throw new Error('Report not found after update.');
    }

    return { id: updatedSnapshot.id, ...(updatedSnapshot.data() as Omit<Report, 'id'>) };
  });
}

export async function deleteReport(user: { uid: string }, reportId: string): Promise<void> {
  const createdBy = requireAuthUid(user);

  return withFirestoreErrorHandling(async () => {
    const ref = getReportRef(reportId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      return;
    }

    const current = snapshot.data() as Omit<Report, 'id'>;
    if (current.createdBy !== createdBy) {
      throw new Error('You can only delete your own reports.');
    }

    await deleteDoc(ref);
  });
}

export async function getUserReports(user: { uid: string }): Promise<ComplianceReport[]> {
  const createdBy = requireAuthUid(user);

  return withFirestoreErrorHandling(async () => {
    const q = query(getReportsCollection(), where('createdBy', '==', createdBy));
    try {
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((record) => ({ id: record.id, ...(record.data() as Omit<Report, 'id'>) }))
        .sort((left, right) => firestoreTimestampToMillis(right.createdAt) - firestoreTimestampToMillis(left.createdAt))
        .map((record) => mapFirestoreReport(record));
    } catch (error) {
      reportsLogger.error('read failed', { uid: createdBy, query: { collection: 'reports', createdBy }, error });
      throw error;
    }
  });
}