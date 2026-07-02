import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '@/lib/types';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface BookingCardProps {
    booking: Booking;
    perspective: 'client' | 'therapist';
    meetLink?: string;
    onCancel?: () => void;
    onReschedule?: () => void;
    onRate?: () => void;
    onMarkDone?: () => void;
}

const STATUS_STYLES: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
    confirmed: { label: 'Confirmed', bg: colors.successBg, fg: colors.success },
    completed: { label: 'Completed', bg: colors.primary100, fg: colors.primary700 },
    cancelled: { label: 'Cancelled', bg: colors.errorBg, fg: colors.error },
    pending: { label: 'Pending', bg: colors.warningBg, fg: colors.warning },
    pending_payment: { label: 'Payment Pending', bg: colors.warningBg, fg: colors.warning },
};

export function BookingCard({
    booking,
    perspective,
    meetLink,
    onCancel,
    onReschedule,
    onRate,
    onMarkDone,
}: BookingCardProps) {
    const status = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
    const otherPartyName = perspective === 'client' ? booking.therapistName : booking.clientName;
    const isUpcoming = booking.sessionTime > new Date() &&
        (booking.status === 'confirmed' || booking.status === 'pending');
    const joinUrl = meetLink || booking.meetLink;
    const hasActions =
        (isUpcoming && (joinUrl || onMarkDone || onReschedule || onCancel)) || !!onRate;

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.name}>{otherPartyName}</Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.neutral500} />
                <Text style={styles.metaText}>{format(booking.sessionTime, 'EEE, MMM d, yyyy')}</Text>
                <Ionicons name="time-outline" size={15} color={colors.neutral500} style={{ marginLeft: spacing.md }} />
                <Text style={styles.metaText}>{format(booking.sessionTime, 'h:mm a')}</Text>
            </View>

            {hasActions ? (
                <View style={styles.actions}>
                    {isUpcoming && joinUrl ? (
                        <Pressable style={[styles.action, styles.actionPrimary]} onPress={() => Linking.openURL(joinUrl)}>
                            <Ionicons name="videocam-outline" size={16} color={colors.white} />
                            <Text style={styles.actionPrimaryText}>Join</Text>
                        </Pressable>
                    ) : null}
                    {isUpcoming && onMarkDone ? (
                        <Pressable style={[styles.action, styles.actionPrimary]} onPress={onMarkDone}>
                            <Ionicons name="checkmark-outline" size={16} color={colors.white} />
                            <Text style={styles.actionPrimaryText}>Mark Done</Text>
                        </Pressable>
                    ) : null}
                    {isUpcoming && onReschedule ? (
                        <Pressable style={styles.action} onPress={onReschedule}>
                            <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary700} />
                            <Text style={styles.actionText}>Reschedule</Text>
                        </Pressable>
                    ) : null}
                    {isUpcoming && onCancel ? (
                        <Pressable style={styles.action} onPress={onCancel}>
                            <Ionicons name="close-outline" size={16} color={colors.error} />
                            <Text style={[styles.actionText, { color: colors.error }]}>Cancel</Text>
                        </Pressable>
                    ) : null}
                    {onRate ? (
                        <Pressable style={styles.action} onPress={onRate}>
                            <Ionicons name="star-outline" size={16} color={colors.warning} />
                            <Text style={[styles.actionText, { color: colors.warning }]}>Rate Session</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontFamily: fonts.serif, fontSize: 17, color: colors.primary700, flex: 1 },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
    badgeText: { fontSize: 11, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
    metaText: { fontSize: 13, color: colors.neutral600 },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.neutral100,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.neutral200,
        backgroundColor: colors.white,
    },
    actionPrimary: { backgroundColor: colors.primary600, borderColor: colors.primary600 },
    actionPrimaryText: { color: colors.white, fontSize: 13, fontWeight: '600' },
    actionText: { color: colors.primary700, fontSize: 13, fontWeight: '500' },
});
