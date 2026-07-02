import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing } from '@/constants/theme';

export default function ProfileTab() {
    const { user, logout } = useAuth();

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
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Body style={styles.name}>{user?.name || 'Client'}</Body>
                <Muted>{user?.email}</Muted>
            </View>

            <Button
                title="Sign Out"
                variant="outline"
                onPress={async () => {
                    await logout();
                    router.replace('/(auth)/login');
                }}
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
    avatarText: { fontSize: 24, fontWeight: '600', color: colors.primary700 },
    name: { fontSize: 18, fontWeight: '600', color: colors.neutral800 },
});
