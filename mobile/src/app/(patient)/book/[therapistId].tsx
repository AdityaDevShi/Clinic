import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { startOfToday } from 'date-fns';
import { db } from '@/lib/firebase';
import { Therapist, TimeSlot } from '@/lib/types';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { SlotPicker, slotKey } from '@/components/SlotPicker';
import { effectivePrice } from '@/components/TherapistCard';
import { colors, radius, spacing } from '@/constants/theme';

const MAX_SESSIONS = 5;

export default function BookScreen() {
    const { therapistId } = useLocalSearchParams<{ therapistId: string }>();
    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
    const { slots, loading: slotsLoading } = useAvailableSlots(therapistId, selectedDate);

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
    const selectedKeys = selectedSlots.map(slotKey);
    const total = price * selectedSlots.length;

    const toggleSlot = (slot: TimeSlot) => {
        const key = slotKey(slot);
        if (selectedKeys.includes(key)) {
            setSelectedSlots(selectedSlots.filter((s) => slotKey(s) !== key));
            return;
        }
        if (selectedSlots.length >= MAX_SESSIONS) {
            alert(`You can book up to ${MAX_SESSIONS} sessions at once.`);
            return;
        }
        // One-session-per-day rule (server enforces too; fail fast in UI)
        const sameDay = selectedSlots.some(
            (s) => s.date.toDateString() === slot.date.toDateString()
        );
        if (sameDay) {
            alert('You can only book one session per day. Pick a different day for your next session.');
            return;
        }
        setSelectedSlots([...selectedSlots, slot]);
    };

    const proceed = () => {
        router.push({
            pathname: '/(patient)/checkout',
            params: {
                therapistId: therapist.id,
                slots: JSON.stringify(selectedSlots.map((s) => s.date.toISOString())),
            },
        });
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Book a Session', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen>
                <Heading style={{ marginBottom: 2 }}>{therapist.name}</Heading>
                <Muted style={{ marginBottom: spacing.md }}>
                    ₹{price} per session · {therapist.sessionDuration || '50-60 minutes'}
                </Muted>

                <Subheading style={{ marginBottom: spacing.xs }}>Pick your slots</Subheading>
                <Muted>Select up to {MAX_SESSIONS} sessions — one per day.</Muted>

                <SlotPicker
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    slots={slots}
                    slotsLoading={slotsLoading}
                    selectedSlotKeys={selectedKeys}
                    onToggleSlot={toggleSlot}
                />

                {selectedSlots.length > 0 ? (
                    <View style={styles.summary}>
                        <View style={styles.summaryRow}>
                            <Body>
                                {selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''} selected
                            </Body>
                            <Text style={styles.total}>₹{total}</Text>
                        </View>
                        <Button title="Continue" onPress={proceed} />
                    </View>
                ) : null}
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    summary: {
        marginTop: spacing.xl,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        gap: spacing.md,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    total: { fontSize: 20, fontWeight: '700', color: colors.primary600 },
});
