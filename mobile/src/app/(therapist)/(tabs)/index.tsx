import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isToday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTherapistBookings } from '@/hooks/useTherapistBookings';
import { BookingCard } from '@/components/BookingCard';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function DashboardTab() {
    const { user } = useAuth();
    const { bookings, loading } = useTherapistBookings();
    const insets = useSafeAreaInsets();

    const stats = useMemo(() => {
        const active = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'pending_payment');
        const today = active.filter((b) => isToday(b.sessionTime)).length;
        const patients = new Set(active.map((b) => b.clientId)).size;
        const now = new Date();
        const upcoming = active
            .filter((b) => b.sessionTime > now && b.status !== 'completed')
            .sort((a, b) => a.sessionTime.getTime() - b.sessionTime.getTime());
        return { today, patients, upcoming };
    }, [bookings]);

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
                        <Ionicons name="calendar-outline" size={22} color={colors.primary600} />
                        <Text style={styles.statNum}>{stats.upcoming.length}</Text>
                        <Muted>Upcoming</Muted>
                    </View>
                </View>

                <Subheading style={{ marginBottom: spacing.md }}>Upcoming Sessions</Subheading>
                {loading ? (
                    <ActivityIndicator color={colors.primary600} style={{ marginTop: spacing.xl }} />
                ) : stats.upcoming.length === 0 ? (
                    <Body style={{ marginTop: spacing.md }}>No upcoming sessions.</Body>
                ) : (
                    stats.upcoming.slice(0, 8).map((booking) => (
                        <BookingCard key={booking.id} booking={booking} perspective="therapist" />
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
    statNum: { fontFamily: fonts.serif, fontSize: 26, color: colors.primary700 },
});
