import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig, firebaseReady } from '@/config/firebase';

export const firebaseApp = firebaseReady ? getApps().length > 0 ? getApp() : initializeApp(firebaseConfig) : null;
export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;