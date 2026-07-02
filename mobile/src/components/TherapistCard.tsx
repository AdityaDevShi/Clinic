import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Therapist } from '@/lib/types';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface TherapistCardProps {
    therapist: Therapist;
    onPress: () => void;
}

export function effectivePrice(t: Therapist): { price: number; original?: number } {
    const base = t.hourlyRate || 0;
    if (t.discountEnabled && t.discountedRate && t.discountedRate > 0 && t.discountedRate < base) {
        return { price: t.discountedRate, original: base };
    }
    return { price: base };
}

export function TherapistCard({ therapist, onPress }: TherapistCardProps) {
    const initials = (therapist.name || '?')
        .split(' ')
        .map(p => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    const { price, original } = effectivePrice(therapist);

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.row}>
                {therapist.photoUrl ? (
                    <Image source={{ uri: therapist.photoUrl }} style={styles.photo} />
                ) : (
                    <View style={[styles.photo, styles.initialsBox]}>
                        <Text style={styles.initials}>{initials}</Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={styles.name}>{therapist.name}</Text>
                    <Text style={styles.specialization} numberOfLines={1}>
                        {therapist.specialization}
                    </Text>
                    <View style={styles.metaRow}>
                        {therapist.rating && therapist.reviewCount ? (
                            <View style={styles.rating}>
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text style={styles.ratingText}>
                                    {therapist.rating} ({therapist.reviewCount})
                                </Text>
                            </View>
                        ) : null}
                        <View style={styles.priceRow}>
                            {original ? <Text style={styles.strike}>₹{original}</Text> : null}
                            <Text style={styles.price}>₹{price}</Text>
                            <Text style={styles.perSession}>/session</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.neutral400} />
            </View>
        </Pressable>
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
    pressed: { opacity: 0.9 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    photo: { width: 64, height: 64, borderRadius: radius.full },
    initialsBox: {
        backgroundColor: colors.primary100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: { fontSize: 20, fontWeight: '600', color: colors.primary700 },
    info: { flex: 1 },
    name: { fontFamily: fonts.serif, fontSize: 18, color: colors.primary700 },
    specialization: { fontSize: 13, color: colors.neutral500, marginTop: 2 },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 13, color: colors.neutral600 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    strike: { fontSize: 12, color: colors.neutral400, textDecorationLine: 'line-through' },
    price: { fontSize: 16, fontWeight: '700', color: colors.primary600 },
    perSession: { fontSize: 11, color: colors.neutral400 },
});
