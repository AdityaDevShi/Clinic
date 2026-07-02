import { GoogleAuthProvider, signInWithCredential, UserCredential } from 'firebase/auth';
import { auth } from './firebase';
import { WEB_CLIENT_ID } from './config';

/**
 * The Google Sign-In SDK is a native module, so we require it lazily — importing
 * it at module load would crash environments without the native build (Expo Go).
 */
let configured = false;
function getGoogleSignin() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin');
    if (!configured) {
        mod.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
        configured = true;
    }
    return mod;
}

export class GoogleSignInCancelled extends Error {}

/**
 * Runs the native Google sheet and exchanges the Google ID token for a Firebase
 * session. Throws GoogleSignInCancelled if the user dismisses the sheet.
 */
export async function signInWithGoogleCredential(): Promise<UserCredential> {
    const { GoogleSignin, statusCodes } = getGoogleSignin();
    try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        // Support both the newer { type, data } shape and the legacy flat shape.
        const idToken = response?.data?.idToken ?? response?.idToken;
        if (response?.type === 'cancelled' || !idToken) {
            throw new GoogleSignInCancelled('Sign-in cancelled');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        return await signInWithCredential(auth, credential);
    } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === statusCodes?.SIGN_IN_CANCELLED || err instanceof GoogleSignInCancelled) {
            throw new GoogleSignInCancelled('Sign-in cancelled');
        }
        throw err;
    }
}

/** Sign out of Google so the next sign-in shows the account picker. */
export async function signOutGoogle(): Promise<void> {
    try {
        const { GoogleSignin } = getGoogleSignin();
        await GoogleSignin.signOut();
    } catch {
        // not signed in with Google — ignore
    }
}
