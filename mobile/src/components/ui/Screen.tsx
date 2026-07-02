import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
    children: ReactNode;
    scroll?: boolean;
    padded?: boolean;
    style?: ViewStyle;
}

/** Base screen wrapper: warm background, safe-area aware, optional scroll. */
export function Screen({ children, scroll = true, padded = true, style }: ScreenProps) {
    const insets = useSafeAreaInsets();
    const inner = [
        padded && styles.padded,
        { paddingBottom: insets.bottom + spacing.xl },
        style,
    ];

    if (!scroll) {
        return <View style={[styles.root, ...inner]}>{children}</View>;
    }
    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={inner}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.warm50 },
    padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});
