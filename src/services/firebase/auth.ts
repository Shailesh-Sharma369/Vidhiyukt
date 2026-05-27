import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { firebaseReady } from '@/config/firebase';
import { firebaseAuth } from './app';
import type { AuthProfile } from '@/types';

const LOCAL_STORAGE_KEY = 'secureship-local-auth';
const AUTH_RATE_LIMIT_KEY = 'secureship-auth-rate-limit';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export class AuthSubmissionLockedError extends Error {
  retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'AuthSubmissionLockedError';
    this.retryAfterMs = retryAfterMs;
  }
}

function mapFirebaseUser(user: FirebaseUser): AuthProfile {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email ?? 'SecureShip User',
    photoURL: user.photoURL,
    provider: 'firebase'
  };
}

function createLocalUser(email: string): AuthProfile {
  const safeName = email.split('@')[0] || 'SecureShip User';
  return {
    uid: `local-${safeName}`,
    email,
    displayName: safeName,
    provider: 'local'
  };
}

function readLocalUser(): AuthProfile | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthProfile) : null;
  } catch {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    return null;
  }
}

function writeLocalUser(user: AuthProfile | null) {
  if (!user) {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
}

type AuthAction = 'login' | 'register';

type RateLimitBucket = {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRateLimitKey(scope: string) {
  return `${AUTH_RATE_LIMIT_KEY}:${scope}`;
}

function readRateLimitBucket(scope: string): RateLimitBucket | null {
  try {
    const raw = window.localStorage.getItem(getRateLimitKey(scope));
    return raw ? (JSON.parse(raw) as RateLimitBucket) : null;
  } catch {
    window.localStorage.removeItem(getRateLimitKey(scope));
    return null;
  }
}

function writeRateLimitBucket(scope: string, bucket: RateLimitBucket | null) {
  const key = getRateLimitKey(scope);
  if (!bucket) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(bucket));
}

function getRateLimitScopes(action: AuthAction, email: string) {
  const normalizedEmail = normalizeEmail(email);
  return [`global:${action}`, `${action}:${normalizedEmail}`];
}

function getRetryAfterMs(bucket: RateLimitBucket) {
  const now = Date.now();
  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return bucket.blockedUntil - now;
  }

  const windowExpiresAt = bucket.windowStartedAt + RATE_LIMIT_WINDOW_MS;
  return windowExpiresAt > now ? windowExpiresAt - now : 0;
}

function isBucketBlocked(bucket: RateLimitBucket) {
  const now = Date.now();
  return Boolean(bucket.blockedUntil && bucket.blockedUntil > now);
}

function assertAuthRateLimit(action: AuthAction, email: string) {
  for (const scope of getRateLimitScopes(action, email)) {
    const bucket = readRateLimitBucket(scope);
    if (bucket && isBucketBlocked(bucket)) {
      throw new AuthSubmissionLockedError(
        'Too many auth attempts. Please wait a few minutes and try again.',
        getRetryAfterMs(bucket)
      );
    }
  }
}

function recordAuthFailure(action: AuthAction, email: string) {
  const now = Date.now();

  for (const scope of getRateLimitScopes(action, email)) {
    const bucket = readRateLimitBucket(scope);
    const windowExpired = !bucket || now - bucket.windowStartedAt > RATE_LIMIT_WINDOW_MS;
    const nextAttempts = windowExpired ? 1 : bucket.attempts + 1;
    const nextWindowStartedAt = windowExpired ? now : bucket.windowStartedAt;
    const blockedUntil = nextAttempts >= RATE_LIMIT_MAX_ATTEMPTS ? now + RATE_LIMIT_LOCK_MS : null;

    writeRateLimitBucket(scope, {
      attempts: nextAttempts,
      windowStartedAt: nextWindowStartedAt,
      blockedUntil
    });
  }
}

function clearAuthFailures(action: AuthAction, email: string) {
  for (const scope of getRateLimitScopes(action, email)) {
    writeRateLimitBucket(scope, null);
  }
}

function isFirebaseAuthError(error: unknown): error is { code?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthSubmissionLockedError) {
    const minutes = Math.max(1, Math.ceil(error.retryAfterMs / 60000));
    return `Too many attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} before trying again.`;
  }

  if (!isFirebaseAuthError(error)) {
    return 'We could not complete authentication. Please try again.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 8 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts were made from this browser. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The email or password you entered is incorrect.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this project.';
    default:
      return 'We could not complete authentication. Please try again.';
  }
}

export async function watchAuthState(onChange: (user: AuthProfile | null) => void) {
  if (!firebaseAuth) {
    onChange(typeof window === 'undefined' ? null : readLocalUser());
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      console.debug('[auth] session restored', { uid: user.uid });
    } else {
      console.debug('[auth] session cleared');
    }
    onChange(user ? mapFirebaseUser(user) : null);
  });
}

export async function signIn(email: string, password: string) {
  if (!firebaseAuth) {
    const user = createLocalUser(email);
    writeLocalUser(user);
    return user;
  }

  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return mapFirebaseUser(credential.user);
}

export async function signUp(email: string, password: string) {
  if (!firebaseAuth) {
    const user = createLocalUser(email);
    writeLocalUser(user);
    return user;
  }

  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return mapFirebaseUser(credential.user);
}

export async function signOut() {
  if (!firebaseAuth) {
    writeLocalUser(null);
    return;
  }

  await firebaseSignOut(firebaseAuth);
}

export async function signInWithRateLimit(email: string, password: string) {
  const action: AuthAction = 'login';
  assertAuthRateLimit(action, email);

  try {
    const user = await signIn(email, password);
    clearAuthFailures(action, email);
    if (firebaseReady && user.provider === 'firebase') {
      console.debug('[auth] sign-in success', { uid: user.uid });
    }
    return user;
  } catch (error) {
    console.debug('[auth] sign-in failed', { email, error });
    recordAuthFailure(action, email);
    throw error;
  }
}

export async function signUpWithRateLimit(email: string, password: string) {
  const action: AuthAction = 'register';
  assertAuthRateLimit(action, email);

  try {
    const user = await signUp(email, password);
    clearAuthFailures(action, email);
    if (firebaseReady && user.provider === 'firebase') {
      console.debug('[auth] sign-up success', { uid: user.uid });
    }
    return user;
  } catch (error) {
    console.debug('[auth] sign-up failed', { email, error });
    recordAuthFailure(action, email);
    throw error;
  }
}

export function clearAuthRateLimit(email: string) {
  clearAuthFailures('login', email);
  clearAuthFailures('register', email);
}