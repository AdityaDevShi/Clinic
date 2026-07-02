import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
    const isDisabled = disabled || loading;
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                styles[variant],
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? colors.primary600 : colors.white} />
            ) : (
                <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    primary: { backgroundColor: colors.primary600 },
    secondary: { backgroundColor: colors.secondary600 },
    danger: { backgroundColor: colors.error },
    outline: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primary300,
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
    label: { color: colors.white, fontSize: 16, fontWeight: '600' },
    labelOutline: { color: colors.primary700 },
});
