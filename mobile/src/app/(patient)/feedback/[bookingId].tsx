import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { Booking } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/services/bookingService';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { StarRating } from '@/components/StarRating';
import { colors, radius, spacing } from '@/constants/theme';

export default function FeedbackScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const { user } = useAuth();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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

    if (!booking || !user) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating required', 'Please select a star rating.');
            return;
        }
        setSubmitting(true);
        try {
            await BookingService.submitFeedback({
                bookingId: booking.id,
                clientId: user.id,
                clientName: user.name || 'Anonymous',
                therapistId: booking.therapistId,
                rating,
                comment: comment.trim() || undefined,
                isPublic,
            });
            Alert.alert('Thank You!', 'Your feedback has been submitted.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit feedback.');
            setSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Rate Session', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen>
                <Heading style={{ marginBottom: 2 }}>How was your session?</Heading>
                <Muted style={{ marginBottom: spacing.xl }}>
                    with {booking.therapistName} on {format(booking.sessionTime, 'MMM d, yyyy')}
                </Muted>

                <View style={styles.ratingBox}>
                    <StarRating rating={rating} onChange={setRating} size={40} />
                </View>

                <Input
                    label="Comments (optional)"
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Share your experience..."
                    multiline
                    numberOfLines={4}
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                />

                <View style={styles.publicRow}>
                    <View style={{ flex: 1 }}>
                        <Body style={{ fontWeight: '600' }}>Show on therapist profile</Body>
                        <Muted>Public reviews help others choose a therapist.</Muted>
                    </View>
                    <Switch
                        value={isPublic}
                        onValueChange={setIsPublic}
                        trackColor={{ true: colors.primary400, false: colors.neutral300 }}
                        thumbColor={isPublic ? colors.primary600 : colors.neutral100}
                    />
                </View>

                <Button title="Submit Feedback" onPress={handleSubmit} loading={submitting} />
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    ratingBox: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        paddingVertical: spacing.xl,
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.xl,
    },
    publicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
});
