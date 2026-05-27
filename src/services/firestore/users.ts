import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { AuthProfile } from '@/types';
import type { NewUserProfileInput, UpdateUserProfileInput, UserProfile } from '@/types/firestore';
import { firebaseAuth } from '@/services/firebase/app';
import { normalizeFirestoreError, requireAuthUid, requireFirestoreDb, withFirestoreErrorHandling } from './shared';

function getUserDocRef(uid: string) {
  const db = requireFirestoreDb();
  return doc(db, 'users', uid);
}

function normalizeProfileName(authUser: Pick<AuthProfile, 'email' | 'displayName'>) {
  return authUser.displayName?.trim() || authUser.email.split('@')[0] || 'SecureShip User';
}

async function refreshAuthTokenOnce() {
  await firebaseAuth?.currentUser?.getIdToken(true).catch(() => undefined);
}

async function retryOnceOnPermissionDenied<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    const normalized = normalizeFirestoreError(error);

    if (normalized.code !== 'permission-denied') {
      throw normalized;
    }

    await refreshAuthTokenOnce();
    return operation().catch((retryError) => {
      throw normalizeFirestoreError(retryError);
    });
  }
}

export async function createUserProfile(user: Pick<AuthProfile, 'uid' | 'email' | 'displayName'>): Promise<UserProfile> {
  const uid = requireAuthUid(user);
  const input: NewUserProfileInput = {
    name: normalizeProfileName(user),
    email: user.email.trim().toLowerCase()
  };

  return withFirestoreErrorHandling(async () => {
    console.debug('[firestore][users] create profile start', { uid });
    const ref = getUserDocRef(uid);
    const payload = {
      name: input.name,
      email: input.email,
      createdAt: serverTimestamp()
    };

    const existing = await retryOnceOnPermissionDenied(() => getDoc(ref));

    if (existing.exists()) {
      console.debug('[firestore][users] profile already exists', { uid });
      return { uid: existing.id, ...(existing.data() as Omit<UserProfile, 'uid'>) };
    }

    try {
      await retryOnceOnPermissionDenied(() => setDoc(ref, payload));
    } catch (error) {
      console.error('[firestore][users] create profile failed', { uid, path: `users/${uid}`, payload, error });
      throw error;
    }

    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw normalizeFirestoreError(new Error('Failed to create user profile.'));
    }

    console.debug('[firestore][users] create profile success', { uid });
    return { uid, ...(snapshot.data() as Omit<UserProfile, 'uid'>) };
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return withFirestoreErrorHandling(async () => {
    console.debug('[firestore][users] get profile start', { uid });
    const ref = getUserDocRef(uid);
    const snapshot = await retryOnceOnPermissionDenied(() => getDoc(ref));
    if (!snapshot.exists()) {
      console.debug('[firestore][users] get profile miss', { uid });
      return null;
    }

    console.debug('[firestore][users] get profile success', { uid });
    return { uid: snapshot.id, ...(snapshot.data() as Omit<UserProfile, 'uid'>) };
  });
}

export async function updateUserProfile(uid: string, patch: UpdateUserProfileInput): Promise<UserProfile> {
  const updatePayload: UpdateUserProfileInput = {};

  if (typeof patch.name === 'string') {
    updatePayload.name = patch.name.trim();
  }

  if (typeof patch.email === 'string') {
    updatePayload.email = patch.email.trim().toLowerCase();
  }

  return withFirestoreErrorHandling(async () => {
    const ref = getUserDocRef(uid);
    const payload = {
      ...updatePayload,
      updatedAt: serverTimestamp()
    };

    try {
      await retryOnceOnPermissionDenied(() => updateDoc(ref, payload));
    } catch (error) {
      console.error('[firestore][users] update profile failed', { uid, path: `users/${uid}`, payload, error });
      throw error;
    }

    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw normalizeFirestoreError(new Error('Failed to update user profile.'));
    }

    return { uid: snapshot.id, ...(snapshot.data() as Omit<UserProfile, 'uid'>) };
  });
}

export async function ensureUserProfile(user: Pick<AuthProfile, 'uid' | 'email' | 'displayName'>): Promise<UserProfile> {
  const uid = requireAuthUid(user);
  console.debug('[firestore][users] ensure profile start', { uid });
  const existing = await retryOnceOnPermissionDenied(() => getUserProfile(uid));

  if (!existing) {
    console.debug('[firestore][users] ensure profile create', { uid });
    return createUserProfile(user);
  }

  const desiredName = normalizeProfileName(user);
  const desiredEmail = user.email.trim().toLowerCase();

  if (existing.name !== desiredName || existing.email !== desiredEmail || !existing.updatedAt) {
    console.debug('[firestore][users] ensure profile update', { uid });
    return updateUserProfile(uid, { name: desiredName, email: desiredEmail });
  }

  console.debug('[firestore][users] ensure profile ready', { uid });
  return existing;
}