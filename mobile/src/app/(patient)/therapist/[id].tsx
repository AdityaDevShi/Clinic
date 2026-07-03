import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { htmlToPlainText } from '@/lib/format';
import { Therapist, Feedback } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { StarRating } from '@/components/StarRating';
import { effectivePrice } from '@/components/TherapistCard';
import { colors, radius, spacing } from '@/constants/theme';

export default function TherapistDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [reviews, setReviews] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = onSnapshot(doc(db, 'therapists', id), (snap) => {
            setTherapist(snap.exists() ? ({ id: snap.id, ...snap.data() } as Therapist) : null);
            setLoading(false);
        });

        // Public reviews (query by therapistId, filter isPublic client-side — same as web)
        getDocs(query(collection(db, 'feedback'), where('therapistId', '==', id)))
            .then((snap) => {
                const list = snap.docs
                    .map((d) => {
                        const data = d.data();
                        return {
                            id: d.id,
                            ...data,
                            createdAt: data.createdAt?.toDate?.() || new Date(),
                        } as Feedback;
                    })
                    .filter((f) => f.isPublic !== false)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setReviews(list);
            })
            .catch((err) => console.error('Error loading reviews:', err));

        return () => unsubscribe();
    }, [id]);

    if (loading) {
        return (
            <Screen scroll={false} style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    if (!therapist) {
        return (
            <Screen scroll={false} style={styles.center}>
                <Body>Therapist not found.</Body>
                <Button title="Go Back" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
            </Screen>
        );
    }

    const { price, original } = effectivePrice(therapist);
    const initials = (therapist.name || '?').split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: '', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen padded={false}>
                <View style={styles.hero}>
                    {therapist.photoUrl ? (
                        <Image source={{ uri: therapist.photoUrl }} style={styles.photo} />
                    ) : (
                        <View style={[styles.photo, styles.initialsBox]}>
                            <Text style={styles.initials}>{initials}</Text>
                        </View>
                    )}
                    <Heading style={styles.name}>{therapist.name}</Heading>
                    <Muted>{therapist.specialization}</Muted>
                    {therapist.rating && therapist.reviewCount ? (
                        <View style={styles.ratingRow}>
                            <StarRating rating={Math.round(therapist.rating)} size={16} />
                            <Muted>
                                {therapist.rating} · {therapist.reviewCount} review{therapist.reviewCount !== 1 ? 's' : ''}
                            </Muted>
                        </View>
                    ) : null}
                </View>

                <View style={styles.content}>
                    <View style={styles.priceCard}>
                        <View>
                            <Muted>Session fee</Muted>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                {original ? <Text style={styles.strike}>₹{original}</Text> : null}
                                <Text style={styles.price}>₹{price}</Text>
                                <Muted>/ {therapist.sessionDuration || '50-60 minutes'}</Muted>
                            </View>
                        </View>
                        <Button title="Book Session" onPress={() => router.push(`/(patient)/book/${therapist.id}`)} />
                    </View>

                    {therapist.bio || therapist.about ? (
                        <View style={styles.section}>
                            <Subheading style={styles.sectionTitle}>About</Subheading>
                            <Body>{htmlToPlainText(therapist.about || therapist.bio || '')}</Body>
                        </View>
                    ) : null}

                    {therapist.qualifications?.length ? (
                        <View style={styles.section}>
                            <Subheading style={styles.sectionTitle}>Qualifications</Subheading>
                            {therapist.qualifications.map((qual, i) => (
                                <Body key={i}>• {qual}</Body>
                            ))}
                        </View>
                    ) : null}

                    {therapist.languages?.length ? (
                        <View style={styles.section}>
                            <Subheading style={styles.sectionTitle}>Languages</Subheading>
                            <Body>{therapist.languages.join(', ')}</Body>
                        </View>
                    ) : null}

                    {therapist.recommendedFor?.length ? (
                        <View style={styles.section}>
                            <Subheading style={styles.sectionTitle}>Can help with</Subheading>
                            <View style={styles.chips}>
                                {therapist.recommendedFor.map((item, i) => (
                                    <View key={i} style={styles.chip}>
                                        <Text style={styles.chipText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {reviews.length > 0 ? (
                        <View style={styles.section}>
                            <Subheading style={styles.sectionTitle}>Reviews</Subheading>
                            {reviews.slice(0, 10).map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewAuthor}>{review.clientName || 'Anonymous'}</Text>
                                        <StarRating rating={review.rating} size={14} />
                                    </View>
                                    {review.comment ? <Body style={{ marginTop: 4 }}>{review.comment}</Body> : null}
                                    <Muted style={{ marginTop: 4 }}>{format(review.createdAt, 'MMM yyyy')}</Muted>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center' },
    hero: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.warm100 },
    photo: { width: 96, height: 96, borderRadius: radius.full, marginBottom: spacing.md },
    initialsBox: { backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 32, fontWeight: '600', color: colors.primary700 },
    name: { marginBottom: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    priceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.xl,
    },
    strike: { fontSize: 14, color: colors.neutral400, textDecorationLine: 'line-through' },
    price: { fontSize: 24, fontWeight: '700', color: colors.primary600 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { marginBottom: spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        backgroundColor: colors.primary50,
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.primary200,
    },
    chipText: { fontSize: 13, color: colors.primary700 },
    reviewCard: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewAuthor: { fontSize: 14, fontWeight: '600', color: colors.neutral800 },
});
