import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format, startOfToday } from 'date-fns';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { Booking, TimeSlot } from '@/lib/types';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { SlotPicker, slotKey } from '@/components/SlotPicker';
import { colors, radius, spacing } from '@/constants/theme';

/** Therapist-side reschedule — same flow as the patient one, therapist role guard. */
export default function TherapistRescheduleScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { slots, loading: slotsLoading } = useAvailableSlots(
        booking?.therapistId,
        selectedDate,
        bookingId
    );

    useEffect(() => {
        if (!bookingId) return;
        getDoc(doc(db, 'bookings', bookingId)).then((snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBooking({
                    id: snap.id,
                    ...data,
                    sessionTime: data.sessionTime?.toDate?.() || new Date(data.sessionTime),
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                } as Booking);
            }
        });
    }, [bookingId]);

    if (!booking) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        setSubmitting(true);
        try {
            const res = await api.rescheduleBooking(booking.id, selectedSlot.date.toISOString());
            Alert.alert('Rescheduled', res.message, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reschedule.');
            setSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Reschedule', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen>
                <Heading style={{ marginBottom: 2 }}>Reschedule Session</Heading>
                <Muted style={{ marginBottom: spacing.md }}>
                    with {booking.clientName} — currently {format(booking.sessionTime, 'EEE, MMM d · h:mm a')}
                </Muted>

                <SlotPicker
                    selectedDate={selectedDate}
                    onSelectDate={(d) => {
                        setSelectedDate(d);
                        setSelectedSlot(null);
                    }}
                    slots={slots}
                    slotsLoading={slotsLoading}
                    selectedSlotKeys={selectedSlot ? [slotKey(selectedSlot)] : []}
                    onToggleSlot={(slot) =>
                        setSelectedSlot(selectedSlot && slotKey(selectedSlot) === slotKey(slot) ? null : slot)
                    }
                />

                {selectedSlot ? (
                    <View style={styles.confirmBox}>
                        <Body style={{ textAlign: 'center' }}>
                            New time: {format(selectedSlot.date, 'EEE, MMM d · h:mm a')}
                        </Body>
                        <Button title="Confirm Reschedule" onPress={handleConfirm} loading={submitting} />
                    </View>
                ) : null}
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    confirmBox: {
        marginTop: spacing.xl,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        gap: spacing.md,
    },
});
