import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { Therapist } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { effectivePrice } from '@/components/TherapistCard';
import { colors, radius, spacing } from '@/constants/theme';

/**
 * Order summary. The consent gate + Razorpay payment attach here in the
 * native-modules build step (they require a dev build, not Expo Go).
 */
export default function Checkout() {
    const { therapistId, slots: slotsParam } = useLocalSearchParams<{ therapistId: string; slots: string }>();
    const [therapist, setTherapist] = useState<Therapist | null>(null);

    const sessionTimes: Date[] = (() => {
        try {
            return (JSON.parse(slotsParam || '[]') as string[]).map((iso) => new Date(iso));
        } catch {
            return [];
        }
    })();

    useEffect(() => {
        if (!therapistId) return;
        getDoc(doc(db, 'therapists', therapistId)).then((snap) => {
            setTherapist(snap.exists() ? ({ id: snap.id, ...snap.data() } as Therapist) : null);
        });
    }, [therapistId]);

    if (!therapist) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    const { price } = effectivePrice(therapist);
    const total = price * sessionTimes.length;

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Checkout', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen>
                <Heading style={{ marginBottom: spacing.lg }}>Order Summary</Heading>

                <View style={styles.card}>
                    <Body style={styles.therapistName}>{therapist.name}</Body>
                    <Muted style={{ marginBottom: spacing.md }}>{therapist.specialization}</Muted>
                    {sessionTimes.map((time, i) => (
                        <View key={i} style={styles.sessionRow}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary600} />
                            <Body>{format(time, 'EEE, MMM d · h:mm a')}</Body>
                            <Text style={styles.sessionPrice}>₹{price}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Body style={{ fontWeight: '700' }}>Total</Body>
                        <Text style={styles.total}>₹{total}</Text>
                    </View>
                </View>

                <View style={styles.notice}>
                    <Ionicons name="construct-outline" size={20} color={colors.warning} />
                    <Body style={{ flex: 1 }}>
                        Payment is coming in the next build step (it needs the development
                        build with the Razorpay module). Booking + consent + payment will
                        complete here.
                    </Body>
                </View>
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.lg,
    },
    therapistName: { fontSize: 17, fontWeight: '600', color: colors.neutral800 },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral100,
    },
    sessionPrice: { marginLeft: 'auto', fontWeight: '600', color: colors.neutral700 },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
    },
    total: { fontSize: 22, fontWeight: '700', color: colors.primary600 },
    notice: {
        flexDirection: 'row',
        gap: spacing.md,
        backgroundColor: colors.warningBg,
        borderRadius: radius.md,
        padding: spacing.lg,
    },
});
