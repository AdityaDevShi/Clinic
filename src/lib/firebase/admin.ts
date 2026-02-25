/* eslint-disable @typescript-eslint/no-require-imports */

// Dynamic require to bypass Turbopack bundling issue.
// Turbopack mangles the firebase-admin module name (appends a hash),
// causing "Cannot find module" errors in Cloud Functions at runtime.
// eslint-disable-next-line no-eval
const admin = eval('require')('firebase-admin');

// Use a global variable to ensure the app is initialized only once
// across hot reloads and multiple module evaluations.
const globalForAdmin = globalThis as typeof globalThis & { _firebaseAdminInitialized?: boolean };

if (!globalForAdmin._firebaseAdminInitialized) {
    try {
        admin.initializeApp();
        globalForAdmin._firebaseAdminInitialized = true;
        console.log('Firebase Admin SDK initialized with Application Default Credentials.');
    } catch (error: unknown) {
        // If already initialized (e.g., by another module), that's fine
        if (error instanceof Error && error.message.includes('already exists')) {
            globalForAdmin._firebaseAdminInitialized = true;
        } else {
            console.error('Firebase Admin SDK initialization error:', error);
        }
    }
}

export const getAdminDb = () => {
    return admin.firestore();
};

export const getAdminAuth = () => {
    return admin.auth();
};
