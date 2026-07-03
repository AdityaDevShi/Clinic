import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isToday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTherapistBookings } from '@/hooks/useTherapistBookings';
import { BookingCard } from '@/components/BookingCard';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function DashboardTab() {
    const { user } = useAuth();
    const { bookings, loading } = useTherapistBookings();
    const [processing, setProcessing] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const stats = useMemo(() => {
        const active = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'pending_payment');
        const today = active.filter((b) => isToday(b.sessionTime)).length;
        const patients = new Set(active.map((b) => b.clientId)).size;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const earnings = bookings
            .filter(
                (b) =>
                    b.paymentStatus === 'paid' &&
                    b.status !== 'cancelled' &&
                    b.sessionTime.getMonth() === thisMonth &&
                    b.sessionTime.getFullYear() === thisYear
            )
            .reduce((sum, b) => sum + (b.amount || 0), 0);
        const upcoming = active
            .filter((b) => b.sessionTime > now && b.status !== 'completed')
            .sort((a, b) => a.sessionTime.getTime() - b.sessionTime.getTime());
        return { today, patients, earnings, upcoming };
    }, [bookings]);

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
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
                <Heading style={{ marginBottom: spacing.lg }}>
                    Welcome, {user?.name?.split(' ')[0] || 'Doctor'}
                </Heading>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="today-outline" size={22} color={colors.primary600} />
                        <Text style={styles.statNum}>{stats.today}</Text>
                        <Muted>Today</Muted>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="people-outline" size={22} color={colors.primary600} />
                        <Text style={styles.statNum}>{stats.patients}</Text>
                        <Muted>Patients</Muted>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="wallet-outline" size={22} color={colors.primary600} />
                        <Text style={styles.statNum}>₹{stats.earnings >= 1000 ? `${(stats.earnings / 1000).toFixed(1)}k` : stats.earnings}</Text>
                        <Muted>This month</Muted>
                    </View>
                </View>

                <Subheading style={{ marginBottom: spacing.md }}>Upcoming Sessions</Subheading>
                {loading ? (
                    <ActivityIndicator color={colors.primary600} style={{ marginTop: spacing.xl }} />
                ) : stats.upcoming.length === 0 ? (
                    <Body style={{ marginTop: spacing.md }}>No upcoming sessions.</Body>
                ) : (
                    stats.upcoming.slice(0, 8).map((booking) => (
                        <View key={booking.id} style={processing === booking.id ? { opacity: 0.5 } : undefined}>
                            <BookingCard
                                booking={booking}
                                perspective="therapist"
                                onReschedule={() => router.push(`/(therapist)/reschedule/${booking.id}`)}
                                onCancel={() => handleCancel(booking.id)}
                            />
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    statCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    statNum: { fontFamily: fonts.serif, fontSize: 22, color: colors.primary700 },
});
