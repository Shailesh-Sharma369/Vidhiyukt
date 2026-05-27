import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { AuthProfile } from '@/types';
import type { NewUserProfileInput, UpdateUserProfileInput, UserProfile } from '@/types/firestore';
import { firebaseAuth } from '@/services/firebase/app';
import { createLogger } from '@/lib/logger';
import { waitForFirebaseAuthSession } from '@/services/firebase/auth';
import { normalizeFirestoreError, requireAuthUid, requireFirestoreDb, withFirestoreErrorHandling } from './shared';

const usersLogger = createLogger('firestore][users');

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

async function ensureFirestoreAuthSession(uid: string) {
  const currentUser = await waitForFirebaseAuthSession(uid);
  const tokenAvailable = await currentUser.getIdToken(true).then(() => true).catch(() => false);

  usersLogger.debug('auth session ready', {
    authCurrentUser: firebaseAuth?.currentUser,
    uid,
    tokenAvailable
  });

  return currentUser;
}

async function retryOnceOnPermissionDenied<T>(operation: () => Promise<T>, refreshSession?: () => Promise<unknown>) {
  try {
    return await operation();
  } catch (error) {
    const normalized = normalizeFirestoreError(error);

    if (normalized.code !== 'permission-denied') {
      throw normalized;
    }

    await refreshSession?.();
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
    usersLogger.debug('create profile start', { authCurrentUser: firebaseAuth?.currentUser, uid });
    await ensureFirestoreAuthSession(uid);
    const ref = getUserDocRef(uid);
    const payload = {
      name: input.name,
      email: input.email,
      createdAt: serverTimestamp()
    };

    usersLogger.debug('create profile payload', {
      authCurrentUser: firebaseAuth?.currentUser,
      uid,
      path: `users/${uid}`,
      payload
    });

    const existing = await retryOnceOnPermissionDenied(() => getDoc(ref), () => ensureFirestoreAuthSession(uid));

    if (existing.exists()) {
      usersLogger.debug('profile already exists', { authCurrentUser: firebaseAuth?.currentUser, uid });
      return { uid: existing.id, ...(existing.data() as Omit<UserProfile, 'uid'>) };
    }

    try {
      await retryOnceOnPermissionDenied(() => setDoc(ref, payload), () => ensureFirestoreAuthSession(uid));
    } catch (error) {
      usersLogger.error('create profile failed', {
        authCurrentUser: firebaseAuth?.currentUser,
        uid,
        path: `users/${uid}`,
        payload,
        error
      });
      throw error;
    }

    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw normalizeFirestoreError(new Error('Failed to create user profile.'));
    }

    usersLogger.debug('create profile success', { authCurrentUser: firebaseAuth?.currentUser, uid });
    return { uid, ...(snapshot.data() as Omit<UserProfile, 'uid'>) };
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return withFirestoreErrorHandling(async () => {
    usersLogger.debug('get profile start', { authCurrentUser: firebaseAuth?.currentUser, uid });
    const ref = getUserDocRef(uid);
    const snapshot = await retryOnceOnPermissionDenied(() => getDoc(ref), () => ensureFirestoreAuthSession(uid));
    if (!snapshot.exists()) {
      usersLogger.debug('get profile miss', { authCurrentUser: firebaseAuth?.currentUser, uid });
      return null;
    }

    usersLogger.debug('get profile success', { authCurrentUser: firebaseAuth?.currentUser, uid });
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
      await retryOnceOnPermissionDenied(() => updateDoc(ref, payload), () => ensureFirestoreAuthSession(uid));
    } catch (error) {
      usersLogger.error('update profile failed', {
        authCurrentUser: firebaseAuth?.currentUser,
        uid,
        path: `users/${uid}`,
        payload,
        error
      });
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
  usersLogger.debug('ensure profile start', { authCurrentUser: firebaseAuth?.currentUser, uid });
  await ensureFirestoreAuthSession(uid);
  const existing = await retryOnceOnPermissionDenied(() => getUserProfile(uid));

  if (!existing) {
    usersLogger.debug('ensure profile create', { authCurrentUser: firebaseAuth?.currentUser, uid });
    return createUserProfile(user);
  }

  const desiredName = normalizeProfileName(user);
  const desiredEmail = user.email.trim().toLowerCase();

  if (existing.name !== desiredName || existing.email !== desiredEmail || !existing.updatedAt) {
    usersLogger.debug('ensure profile update', { authCurrentUser: firebaseAuth?.currentUser, uid });
    return updateUserProfile(uid, { name: desiredName, email: desiredEmail });
  }

  usersLogger.debug('ensure profile ready', { authCurrentUser: firebaseAuth?.currentUser, uid });
  return existing;
}

const profileSyncPromises = new Map<string, Promise<UserProfile>>();

export function syncUserProfile(user: Pick<AuthProfile, 'uid' | 'email' | 'displayName'>): Promise<UserProfile> {
  const uid = requireAuthUid(user);
  const existingPromise = profileSyncPromises.get(uid);

  if (existingPromise) {
    usersLogger.debug('sync reuse', { authCurrentUser: firebaseAuth?.currentUser, uid });
    return existingPromise;
  }

  usersLogger.debug('sync start', { authCurrentUser: firebaseAuth?.currentUser, uid });
  const syncPromise = ensureUserProfile(user)
    .then((profile) => {
      usersLogger.debug('sync success', { authCurrentUser: firebaseAuth?.currentUser, uid });
      return profile;
    })
    .catch((error) => {
      usersLogger.debug('sync failed', { authCurrentUser: firebaseAuth?.currentUser, uid, error });
      throw error;
    })
    .finally(() => {
      profileSyncPromises.delete(uid);
    });

  profileSyncPromises.set(uid, syncPromise);
  return syncPromise;
}