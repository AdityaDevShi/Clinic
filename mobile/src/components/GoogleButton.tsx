import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';

interface GoogleButtonProps {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export function GoogleButton({ label, onPress, loading, disabled }: GoogleButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [styles.button, (disabled || loading) && styles.disabled, pressed && styles.pressed]}
        >
            {loading ? (
                <ActivityIndicator color={colors.neutral600} />
            ) : (
                <>
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Text style={styles.label}>{label}</Text>
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.neutral300,
        backgroundColor: colors.white,
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
    label: { fontSize: 16, fontWeight: '600', color: colors.neutral700 },
});
