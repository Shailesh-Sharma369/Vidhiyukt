import { appEnv } from '@/config/env';

export const firebaseConfig = appEnv.firebase;
export const firebaseReady = Object.values(firebaseConfig).every(Boolean);