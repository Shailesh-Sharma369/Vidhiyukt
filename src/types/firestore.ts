import type { FieldValue, Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp | FieldValue;

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

export type NewUserProfileInput = {
  name: string;
  email: string;
};

export type UpdateUserProfileInput = Partial<NewUserProfileInput>;

export type SecureDocumentStatus = 'draft' | 'published' | 'archived';

export type SecureDocument = {
  id: string;
  title: string;
  content: string;
  status: SecureDocumentStatus;
  createdBy: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type SecureDocumentInput = {
  title: string;
  content: string;
  status?: SecureDocumentStatus;
};

export type SecureDocumentPatch = Partial<Pick<SecureDocument, 'title' | 'content' | 'status'>>;

export type AuditLog = {
  id: string;
  createdBy: string;
  action: string;
  targetDocId: string;
  details?: string;
  score?: number;
  createdAt: FirestoreTimestamp;
};

export type AuditLogInput = Omit<AuditLog, 'id' | 'createdBy' | 'createdAt'>;

export type ReportType = 'summary' | 'detailed' | 'analytics';

export type Report = {
  id: string;
  title: string;
  type: ReportType;
  content: string;
  createdBy: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type ReportInput = {
  title: string;
  type: ReportType;
  content: string;
};

export type ReportPatch = Partial<Pick<Report, 'title' | 'type' | 'content'>>;