import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { RAZORPAY_KEY_ID } from '@/lib/config';
import { generateConsentPdfBase64, CONSENT_SECTIONS } from '@/lib/consentPdf';
import { Therapist } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/services/bookingService';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { effectivePrice } from '@/components/TherapistCard';
import { colors, radius, spacing } from '@/constants/theme';

export default function Checkout() {
    const { therapistId, slots: slotsParam } = useLocalSearchParams<{ therapistId: string; slots: string }>();
    const { user } = useAuth();
    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState('');

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

    if (!therapist || !user) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    const { price } = effectivePrice(therapist);
    const total = price * sessionTimes.length;

    const handlePay = async () => {
        if (!agreed) {
            Alert.alert('Consent Required', 'Please read and agree to the consent form to continue.');
            return;
        }
        // Razorpay is a native module — require lazily so non-dev-build sessions
        // don't crash on import.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const RazorpayCheckout = require('react-native-razorpay').default;

        setProcessing(true);
        let bookingIds: string[] = [];
        try {
            // 1. Save consent (bound to the authenticated user server-side)
            setStatus('Saving consent…');
            const pdfBase64 = await generateConsentPdfBase64(user.name || 'Client', therapist.name);
            await api.saveConsent({
                clientId: user.id,
                clientName: user.name || 'Client',
                therapistName: therapist.name,
                pdfBase64,
                agreedAt: new Date().toISOString(),
            });

            // 2. Create pending bookings
            setStatus('Reserving your slots…');
            bookingIds = await Promise.all(
                sessionTimes.map((time) =>
                    BookingService.createBooking({
                        therapistId: therapist.id,
                        therapistName: therapist.name,
                        clientId: user.id,
                        clientName: user.name || 'Client',
                        clientEmail: user.email || '',
                        sessionTime: time,
                        duration: 60,
                        amount: price,
                        status: 'pending_payment',
                        paymentStatus: 'pending',
                    })
                )
            );

            // 3. Create the Razorpay order (server computes the amount)
            setStatus('Starting payment…');
            const order = await api.createOrder({
                therapistId: therapist.id,
                sessionsCount: sessionTimes.length,
                uId: user.id,
                bookingIds,
            });

            // 4. Open the native checkout sheet
            const paymentResult = await RazorpayCheckout.open({
                key: RAZORPAY_KEY_ID,
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                name: 'Arambh Clinic',
                description: `Therapy Sessions: ${sessionTimes.length}x`,
                prefill: { name: user.name || '', email: user.email || '' },
                theme: { color: '#5d7052' },
            });

            // 5. Verify the payment server-side (marks bookings confirmed)
            setStatus('Confirming your booking…');
            await api.verifyPayment({
                razorpay_payment_id: paymentResult.razorpay_payment_id,
                razorpay_order_id: paymentResult.razorpay_order_id,
                razorpay_signature: paymentResult.razorpay_signature,
                bookingIds,
            });

            Alert.alert(
                'Booking Confirmed!',
                `Your ${sessionTimes.length > 1 ? sessionTimes.length + ' sessions are' : 'session is'} booked.`,
                [{ text: 'View Bookings', onPress: () => router.replace('/(patient)/(tabs)/bookings') }]
            );
        } catch (err: unknown) {
            // Razorpay throws { code, description } on cancel/failure.
            const description = (err as { description?: string })?.description;
            const message = description || (err instanceof Error ? err.message : 'Payment could not be completed.');
            const cancelled = (err as { code?: number })?.code === 0 || /cancel/i.test(message);
            Alert.alert(cancelled ? 'Payment Cancelled' : 'Payment Failed', cancelled ? 'You can try again anytime.' : message);
        } finally {
            setProcessing(false);
            setStatus('');
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Checkout', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen>
                <Heading style={{ marginBottom: spacing.lg }}>Confirm & Pay</Heading>

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

                <Subheading style={{ marginBottom: spacing.sm }}>Informed Consent</Subheading>
                <ScrollView style={styles.consentBox} nestedScrollEnabled>
                    {CONSENT_SECTIONS.map((s) => (
                        <View key={s.title} style={{ marginBottom: spacing.md }}>
                            <Text style={styles.consentTitle}>{s.title}</Text>
                            <Text style={styles.consentText}>{s.content}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.agreeRow}>
                    <Switch
                        value={agreed}
                        onValueChange={setAgreed}
                        trackColor={{ true: colors.primary400, false: colors.neutral300 }}
                        thumbColor={agreed ? colors.primary600 : colors.neutral100}
                    />
                    <Body style={{ flex: 1 }}>I have read and agree to the consent form above.</Body>
                </View>

                {processing && status ? <Muted style={styles.status}>{status}</Muted> : null}

                <Button
                    title={`Pay ₹${total}`}
                    onPress={handlePay}
                    loading={processing}
                    disabled={!agreed || sessionTimes.length === 0}
                />
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
        marginBottom: spacing.xl,
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
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md },
    total: { fontSize: 22, fontWeight: '700', color: colors.primary600 },
    consentBox: {
        maxHeight: 200,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.lg,
    },
    consentTitle: { fontSize: 13, fontWeight: '700', color: colors.primary700, marginBottom: 2 },
    consentText: { fontSize: 12, lineHeight: 18, color: colors.neutral600 },
    agreeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    status: { textAlign: 'center', marginBottom: spacing.sm, color: colors.primary600 },
});
