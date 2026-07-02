import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TextInput
                placeholderTextColor={colors.neutral400}
                style={[styles.input, error ? styles.inputError : null, style]}
                {...rest}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: spacing.lg },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.neutral700,
        marginBottom: spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.neutral800,
        backgroundColor: colors.white,
    },
    inputError: { borderColor: colors.error },
    error: { color: colors.error, fontSize: 13, marginTop: spacing.xs },
});
