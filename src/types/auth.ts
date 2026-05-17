export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

export type AuthProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  provider: 'firebase' | 'local';
};

export type AuthCredentials = {
  email: string;
  password: string;
};