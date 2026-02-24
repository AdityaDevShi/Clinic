'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import firebaseConfig from './config';

// Initialize Firebase - only runs on client side due to 'use client' directive
const app = typeof window !== 'undefined'
    ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
    : null;

export const auth = app ? getAuth(app) : null!;
export const db = app ? getFirestore(app) : null!;
export const storage = app ? getStorage(app) : null!;
export const rtdb = app ? getDatabase(app) : null!;

export default app;
