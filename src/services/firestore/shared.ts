import { firebaseDb } from '@/services/firebase/app';
import type { AuthProfile } from '@/types';

export class FirestoreServiceError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code = 'unknown', retryable = false) {
    super(message);
    this.name = 'FirestoreServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function requireFirestoreDb() {
  if (!firebaseDb) {
    throw new FirestoreServiceError('Firestore is not configured for this environment.', 'failed-precondition');
  }

  return firebaseDb;
}

export function requireAuthUid(user: Pick<AuthProfile, 'uid'> | null | undefined) {
  if (!user?.uid) {
    throw new FirestoreServiceError('You must be signed in to sync data.', 'unauthenticated');
  }

  return user.uid;
}

function getFirebaseErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  if (!('code' in error)) {
    return undefined;
  }

  return String((error as { code?: string }).code ?? 'unknown');
}

export function normalizeFirestoreError(error: unknown) {
  if (error instanceof FirestoreServiceError) {
    return error;
  }

  const code = getFirebaseErrorCode(error);

  switch (code) {
    case 'permission-denied':
      return new FirestoreServiceError('You do not have permission to access this data.', code, false);
    case 'unauthenticated':
      return new FirestoreServiceError('Your session expired. Please sign in again.', code, false);
    case 'network-request-failed':
      return new FirestoreServiceError('Network error. Check your connection and try again.', code, true);
    case 'unavailable':
      return new FirestoreServiceError('Firestore is temporarily unavailable. Please try again.', code, true);
    case 'resource-exhausted':
      return new FirestoreServiceError('Firestore quota has been exceeded. Please try again later.', code, true);
    case 'deadline-exceeded':
      return new FirestoreServiceError('Firestore took too long to respond. Please retry.', code, true);
    case 'aborted':
      return new FirestoreServiceError('Firestore request was interrupted. Please retry.', code, true);
    case 'failed-precondition':
      return new FirestoreServiceError('Firestore is not ready for this operation.', code, false);
    default:
      return new FirestoreServiceError('Firestore sync failed. Please try again.', code ?? 'unknown', false);
  }
}

export async function withFirestoreErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw normalizeFirestoreError(error);
  }
}

export function firestoreTimestampToIso(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date().toISOString();
}

export function firestoreTimestampToMillis(value: unknown) {
  return new Date(firestoreTimestampToIso(value)).getTime();
}