import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { firebaseAuth } from './app';
import type { AuthProfile } from '@/types';

const LOCAL_STORAGE_KEY = 'secureship-local-auth';

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
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthProfile) : null;
}

function writeLocalUser(user: AuthProfile | null) {
  if (!user) {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
}

export async function watchAuthState(onChange: (user: AuthProfile | null) => void) {
  if (!firebaseAuth) {
    onChange(typeof window === 'undefined' ? null : readLocalUser());
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
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