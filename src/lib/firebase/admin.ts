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
        const credential = admin.credential.cert({
            projectId: process.env.ADMIN_PROJECT_ID,
            clientEmail: process.env.ADMIN_CLIENT_EMAIL,
            privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        });
        admin.initializeApp({ credential });
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

/**
 * Verify the Firebase ID token on an incoming API request.
 * Reads the `Authorization: Bearer <idToken>` header, verifies it with the
 * Admin SDK, and returns the authenticated uid — or null if missing/invalid.
 *
 * Never trust a uid sent in the request body: it is attacker-controlled.
 * Always derive the caller's identity from the verified token instead.
 */
export const verifyRequestUid = async (req: Request): Promise<string | null> => {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) {
        return null;
    }
    try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        return decoded.uid;
    } catch (error) {
        console.error('ID token verification failed:', error);
        return null;
    }
};

export const getAdminStorage = () => {
    return admin.storage();
};
