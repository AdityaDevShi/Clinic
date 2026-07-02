import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { TherapistService } from '@/services/therapistService';
import { useTherapistBookings } from '@/hooks/useTherapistBookings';
import { BookingCard } from '@/components/BookingCard';
import { Heading, Body } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

export default function ScheduleTab() {
    const { bookings, loading } = useTherapistBookings();
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [processing, setProcessing] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const now = new Date();
    const visible = useMemo(() => {
        const active = bookings.filter((b) => b.status !== 'pending_payment');
        if (tab === 'upcoming') {
            return active
                .filter((b) => b.sessionTime > now && b.status !== 'cancelled' && b.status !== 'completed')
                .sort((a, b) => a.sessionTime.getTime() - b.sessionTime.getTime());
        }
        return active
            .filter((b) => b.sessionTime <= now || b.status === 'cancelled' || b.status === 'completed')
            .sort((a, b) => b.sessionTime.getTime() - a.sessionTime.getTime());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookings, tab]);

    const handleMarkDone = (bookingId: string) => {
        Alert.alert('Mark as Completed', 'Mark this session as completed?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark Done',
                onPress: async () => {
                    setProcessing(bookingId);
                    try {
                        await TherapistService.markCompleted(bookingId);
                    } catch {
                        Alert.alert('Error', 'Failed to update the session.');
                    } finally {
                        setProcessing(null);
                    }
                },
            },
        ]);
    };

    const handleCancel = (bookingId: string) => {
        Alert.alert('Cancel Session', 'Cancel this session? Any applicable refund is processed automatically.', [
            { text: 'Keep', style: 'cancel' },
            {
                text: 'Cancel Session',
                style: 'destructive',
                onPress: async () => {
                    setProcessing(bookingId);
                    try {
                        const res = await api.cancelBooking(bookingId);
                        Alert.alert('Cancelled', res.message);
                    } catch (err: unknown) {
                        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to cancel.');
                    } finally {
                        setProcessing(null);
                    }
                },
            },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.warm50, paddingTop: insets.top }}>
            <View style={styles.header}>
                <Heading>Schedule</Heading>
                <View style={styles.tabs}>
                    {(['upcoming', 'past'] as const).map((t) => (
                        <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
                            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                                {t === 'upcoming' ? 'Upcoming' : 'Past'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {loading ? (
                    <ActivityIndicator color={colors.primary600} style={{ marginTop: spacing.xxl }} />
                ) : visible.length === 0 ? (
                    <Body style={{ textAlign: 'center', marginTop: spacing.xxl }}>
                        {tab === 'upcoming' ? 'No upcoming sessions.' : 'No past sessions.'}
                    </Body>
                ) : (
                    visible.map((booking) => (
                        <View key={booking.id} style={processing === booking.id ? { opacity: 0.5 } : undefined}>
                            <BookingCard
                                booking={booking}
                                perspective="therapist"
                                onMarkDone={tab === 'upcoming' ? () => handleMarkDone(booking.id) : undefined}
                                onCancel={tab === 'upcoming' ? () => handleCancel(booking.id) : undefined}
                            />
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.neutral100,
        borderRadius: radius.md,
        padding: 4,
        marginTop: spacing.md,
    },
    tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
    tabActive: { backgroundColor: colors.white },
    tabText: { fontSize: 14, color: colors.neutral500 },
    tabTextActive: { color: colors.primary700, fontWeight: '600' },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
