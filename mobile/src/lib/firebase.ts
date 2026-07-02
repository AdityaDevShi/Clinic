import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error — getReactNativePersistence is exported via the SDK's
// react-native entry point; types resolve at runtime under Metro.
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same Firebase project as the web app (clinic-f7125) — shared users & data.
const firebaseConfig = {
    apiKey: 'AIzaSyAoTo05Q3aohRruyPn--DZKUhhnuAGWWdk',
    authDomain: 'clinic-f7125.firebaseapp.com',
    databaseURL: 'https://clinic-f7125-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'clinic-f7125',
    storageBucket: 'clinic-f7125.firebasestorage.app',
    messagingSenderId: '650321118343',
    appId: '1:650321118343:web:2b46dd9209492abba82422',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// initializeAuth must run exactly once; on fast-refresh fall back to getAuth.
let authInstance;
try {
    authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch {
    authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
