import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Booking } from './types';

// Foreground presentation.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const TOKEN_KEY = 'expoPushToken';
const REMINDER_KEY = 'bookingReminders';

function getProjectId(): string | undefined {
    return (
        (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
        Constants.easConfig?.projectId
    );
}

/**
 * Request permission (once) and store this device's Expo push token on the
 * user's own Firestore doc. Fire-and-forget: never throws to the caller.
 */
export async function registerPushToken(uid: string): Promise<void> {
    try {
        if (!Device.isDevice) return;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.DEFAULT,
            });
        }

        const existing = await Notifications.getPermissionsAsync();
        let granted = existing.granted;
        if (!granted && existing.canAskAgain) {
            const req = await Notifications.requestPermissionsAsync();
            granted = req.granted;
        }
        if (!granted) return;

        const projectId = getProjectId();
        const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

        await updateDoc(doc(db, 'users', uid), { expoPushTokens: arrayUnion(token) });
        await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
        console.warn('Push token registration skipped:', err);
    }
}

/** Remove this device's token on sign-out. */
export async function unregisterPushToken(uid: string): Promise<void> {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
            await updateDoc(doc(db, 'users', uid), { expoPushTokens: arrayRemove(token) });
        }
    } catch {
        // ignore
    }
}

type ReminderRecord = { time: string; ids: string[] };

/**
 * Keep on-device reminders (24h + 1h before) in sync with the client's
 * confirmed upcoming bookings. Reschedules on time change, clears on
 * cancel/complete/past.
 */
export async function syncBookingReminders(bookings: Booking[]): Promise<void> {
    if (!Device.isDevice) return;
    try {
        const map: Record<string, ReminderRecord> = JSON.parse((await AsyncStorage.getItem(REMINDER_KEY)) || '{}');
        const now = new Date();
        const active = new Set<string>();

        for (const b of bookings) {
            if (b.status !== 'confirmed' || b.sessionTime <= now) continue;
            active.add(b.id);
            const iso = b.sessionTime.toISOString();
            if (map[b.id]?.time === iso) continue; // already scheduled for this time

            // time changed (reschedule) — clear stale ones first
            if (map[b.id]) await cancelIds(map[b.id].ids);

            const ids: string[] = [];
            for (const hoursBefore of [24, 1]) {
                const triggerTime = new Date(b.sessionTime.getTime() - hoursBefore * 3600 * 1000);
                if (triggerTime <= now) continue;
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Upcoming session',
                        body: `Your session with ${b.therapistName} is in ${hoursBefore === 24 ? '24 hours' : '1 hour'}.`,
                        data: { bookingId: b.id },
                    },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerTime },
                });
                ids.push(id);
            }
            map[b.id] = { time: iso, ids };
        }

        // Clear reminders for bookings no longer active.
        for (const bid of Object.keys(map)) {
            if (!active.has(bid)) {
                await cancelIds(map[bid].ids);
                delete map[bid];
            }
        }

        await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(map));
    } catch (err) {
        console.warn('Reminder sync skipped:', err);
    }
}

async function cancelIds(ids: string[]): Promise<void> {
    for (const id of ids) {
        try {
            await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
            // ignore
        }
    }
}
