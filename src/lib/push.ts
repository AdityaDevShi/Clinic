/* eslint-disable @typescript-eslint/no-require-imports, no-eval */
import { getAdminDb } from '@/lib/firebase/admin';

// Same dynamic require the admin SDK uses (avoids Turbopack module mangling).
const admin = eval('require')('firebase-admin');

/**
 * Send an Expo push notification to all of a user's registered devices.
 *
 * This is intentionally best-effort and fire-and-forget: it must NEVER throw
 * into the calling route (a push failure must not fail a payment/cancellation).
 * Call it without awaiting, e.g. `sendPushToUser(uid, {...}).catch(() => {})`.
 */
export async function sendPushToUser(
    uid: string,
    notification: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
    try {
        const adminDb = getAdminDb();
        const userSnap = await adminDb.collection('users').doc(uid).get();
        if (!userSnap.exists) return;

        const tokens: string[] = userSnap.data()?.expoPushTokens || [];
        const valid = tokens.filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'));
        if (valid.length === 0) return;

        const messages = valid.map((to) => ({
            to,
            sound: 'default',
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
        }));

        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        // Prune tokens Expo reports as no longer registered.
        const json = await res.json().catch(() => null);
        const receipts: { status?: string; details?: { error?: string } }[] = json?.data || [];
        const dead: string[] = [];
        receipts.forEach((receipt, i) => {
            if (receipt?.details?.error === 'DeviceNotRegistered') dead.push(valid[i]);
        });
        if (dead.length > 0) {
            await adminDb
                .collection('users')
                .doc(uid)
                .update({ expoPushTokens: admin.firestore.FieldValue.arrayRemove(...dead) });
        }
    } catch (error) {
        console.error('sendPushToUser failed (non-fatal):', error);
    }
}
