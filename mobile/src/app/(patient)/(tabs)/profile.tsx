import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing } from '@/constants/theme';

const SUPPORT_PHONE = '+91 7075829856';
const SUPPORT_EMAIL = 'care@arambh.net';

export default function ProfileTab() {
    const { user, firebaseUser, logout } = useAuth();

    const photo = user?.photoUrl || firebaseUser?.photoURL || null;
    const initials = (user?.name || user?.email || '?')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <Screen>
            <Heading style={{ marginBottom: spacing.xl }}>Profile</Heading>

            <View style={styles.card}>
                {photo ? (
                    <Image source={{ uri: photo }} style={styles.avatarImg} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                )}
                <Body style={styles.name}>{user?.name || 'Client'}</Body>
                <Muted>{user?.email}</Muted>
            </View>

            {/* Manage sessions */}
            <Subheading style={styles.sectionTitle}>Your Sessions</Subheading>
            <Pressable style={styles.row} onPress={() => router.push('/(patient)/(tabs)/bookings')}>
                <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary600} />
                <View style={{ flex: 1 }}>
                    <Body style={styles.rowTitle}>Reschedule or cancel a session</Body>
                    <Muted>Manage upcoming bookings — refunds are automatic when eligible.</Muted>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral400} />
            </Pressable>
            <Pressable style={styles.row} onPress={() => router.push('/(patient)/(tabs)/therapists')}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary600} />
                <View style={{ flex: 1 }}>
                    <Body style={styles.rowTitle}>Book a new session</Body>
                    <Muted>Browse therapists and available slots.</Muted>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral400} />
            </Pressable>

            {/* Support */}
            <Subheading style={styles.sectionTitle}>Contact Support</Subheading>
            <Pressable style={styles.row} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`)}>
                <Ionicons name="call-outline" size={20} color={colors.primary600} />
                <View style={{ flex: 1 }}>
                    <Body style={styles.rowTitle}>Call us</Body>
                    <Muted>{SUPPORT_PHONE}</Muted>
                </View>
            </Pressable>
            <Pressable style={styles.row} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
                <Ionicons name="mail-outline" size={20} color={colors.primary600} />
                <View style={{ flex: 1 }}>
                    <Body style={styles.rowTitle}>Email us</Body>
                    <Muted>{SUPPORT_EMAIL}</Muted>
                </View>
            </Pressable>
            <Pressable style={styles.row} onPress={() => Linking.openURL('https://arambh.net/refund-cancellation-policy')}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary600} />
                <View style={{ flex: 1 }}>
                    <Body style={styles.rowTitle}>Refund & cancellation policy</Body>
                    <Muted>Cancellations 24h+ before a session are refundable.</Muted>
                </View>
            </Pressable>

            <Button
                title="Sign Out"
                variant="outline"
                onPress={async () => {
                    await logout();
                    router.replace('/(auth)/login');
                }}
                style={{ marginTop: spacing.xl }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: radius.full,
        backgroundColor: colors.primary100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarImg: { width: 72, height: 72, borderRadius: radius.full, marginBottom: spacing.md },
    avatarText: { fontSize: 24, fontWeight: '600', color: colors.primary700 },
    name: { fontSize: 18, fontWeight: '600', color: colors.neutral800 },
    sectionTitle: { marginBottom: spacing.md, marginTop: spacing.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    rowTitle: { fontWeight: '600', color: colors.neutral800 },
});
