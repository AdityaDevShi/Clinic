import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useClientBookings } from '@/hooks/useClientBookings';
import { BookingCard } from '@/components/BookingCard';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

export default function BookingsTab() {
    const { user } = useAuth();
    const { bookings, loading } = useClientBookings();
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [meetLinks, setMeetLinks] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    // Session links per therapist (doc id `${therapistId}_${clientId}`)
    useEffect(() => {
        if (!user) return;
        getDocs(query(collection(db, 'session_links'), where('clientId', '==', user.id)))
            .then((snap) => {
                const links: Record<string, string> = {};
                snap.docs.forEach((d) => {
                    const data = d.data();
                    if (data.therapistId && data.meetLink) links[data.therapistId] = data.meetLink;
                });
                setMeetLinks(links);
            })
            .catch(() => { /* links are optional */ });
    }, [user]);

    const now = new Date();
    const visible = useMemo(() => {
        const relevant = bookings.filter((b) => b.status !== 'pending_payment');
        if (tab === 'upcoming') {
            return relevant
                .filter((b) => b.sessionTime > now && b.status !== 'cancelled' && b.status !== 'completed')
                .sort((a, b) => a.sessionTime.getTime() - b.sessionTime.getTime());
        }
        return relevant.filter((b) => b.sessionTime <= now || b.status === 'cancelled' || b.status === 'completed');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookings, tab]);

    const handleCancel = (bookingId: string) => {
        Alert.alert(
            'Cancel Session',
            'Are you sure? If you cancel at least 24 hours before the session, your refund will be processed automatically. Late cancellations are not refunded.',
            [
                { text: 'Keep Session', style: 'cancel' },
                {
                    text: 'Cancel Session',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(bookingId);
                        try {
                            const res = await api.cancelBooking(bookingId);
                            Alert.alert('Session Cancelled', res.message);
                        } catch (err: unknown) {
                            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to cancel.');
                        } finally {
                            setProcessing(null);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.warm50, paddingTop: insets.top }}>
            <View style={styles.header}>
                <Heading>My Bookings</Heading>
                <View style={styles.tabs}>
                    {(['upcoming', 'past'] as const).map((t) => (
                        <Pressable
                            key={t}
                            onPress={() => setTab(t)}
                            style={[styles.tab, tab === t && styles.tabActive]}
                        >
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
                    <View style={styles.empty}>
                        <Body style={{ textAlign: 'center' }}>
                            {tab === 'upcoming' ? 'No upcoming sessions.' : 'No past sessions yet.'}
                        </Body>
                        {tab === 'upcoming' ? (
                            <Muted
                                style={styles.browseLink}
                                onPress={() => router.push('/(patient)/(tabs)')}
                            >
                                Browse therapists →
                            </Muted>
                        ) : null}
                    </View>
                ) : (
                    visible.map((booking) => (
                        <View key={booking.id} style={processing === booking.id ? { opacity: 0.5 } : undefined}>
                            <BookingCard
                                booking={booking}
                                perspective="client"
                                meetLink={meetLinks[booking.therapistId]}
                                onCancel={() => handleCancel(booking.id)}
                                onReschedule={() => router.push(`/(patient)/reschedule/${booking.id}`)}
                                onRate={
                                    tab === 'past' && booking.status === 'completed' && !booking.isRated
                                        ? () => router.push(`/(patient)/feedback/${booking.id}`)
                                        : undefined
                                }
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
    empty: { marginTop: spacing.xxl, alignItems: 'center', gap: spacing.md },
    browseLink: { color: colors.primary600, fontWeight: '600', fontSize: 15 },
});
