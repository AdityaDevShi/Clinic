'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './config';

// Initialize Firebase - only runs on client side due to 'use client' directive
// The check for window ensures this doesn't crash during module evaluation in SSR
const app = typeof window !== 'undefined'
    ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
    : null;

// Export with non-null assertions since these are only used in client components
// The 'use client' directive ensures this code runs in browser only
export const auth = app ? getAuth(app) : null!;
export const db = app ? getFirestore(app) : null!;
export const storage = app ? getStorage(app) : null!;

export default app;
