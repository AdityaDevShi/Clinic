import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/lib/firebase';
import { colors, radius, spacing } from '@/constants/theme';

interface WorkshopSettings {
    isEnabled: boolean;
    message: string;
    link?: string;
    updatedAt?: Timestamp;
}

const DISMISS_KEY = 'workshop_dismissed_version';

/**
 * Admin-controlled announcement banner — same settings/workshop doc the
 * website reads, so admin changes show up here live. Rendered inside the
 * page content (never overlaps the header). Dismissal is per-version:
 * when admin updates the message it reappears.
 */
export function WorkshopBanner() {
    const [settings, setSettings] = useState<WorkshopSettings | null>(null);
    const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(DISMISS_KEY).then(setDismissedVersion);
        const unsubscribe = onSnapshot(doc(db, 'settings', 'workshop'), (snap) => {
            setSettings(snap.exists() ? (snap.data() as WorkshopSettings) : null);
        });
        return () => unsubscribe();
    }, []);

    if (!settings?.isEnabled || !settings.message) return null;

    const version = settings.updatedAt ? String(settings.updatedAt.seconds) : settings.message;
    if (dismissedVersion === version) return null;

    const dismiss = async () => {
        setDismissedVersion(version);
        await AsyncStorage.setItem(DISMISS_KEY, version);
    };

    return (
        <View style={styles.banner}>
            <Pressable
                style={styles.content}
                onPress={settings.link ? () => Linking.openURL(settings.link!) : undefined}
            >
                <Ionicons name="megaphone-outline" size={18} color={colors.white} />
                <Text style={styles.message} numberOfLines={3}>
                    {settings.message}
                    {settings.link ? '  →' : ''}
                </Text>
            </Pressable>
            <Pressable onPress={dismiss} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.white} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.secondary600,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    message: { flex: 1, color: colors.white, fontSize: 13, lineHeight: 18 },
});
