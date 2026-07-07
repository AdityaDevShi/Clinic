import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';

interface TurnstileSheetProps {
    visible: boolean;
    /**
     * Called exactly once per open:
     * - token string when the user passes the check
     * - null when Turnstile is disabled server-side (proceed without token)
     * - undefined when the user closes the sheet (abort the action)
     */
    onResult: (token: string | null | undefined) => void;
}

/**
 * Cloudflare Turnstile human-check in a bottom sheet.
 * Loads the host page on arambh.net, which posts the token back. When the
 * site has Turnstile disabled, the page posts `disabled` and we resolve
 * immediately with null — invisible to users until the keys are configured.
 */
export function TurnstileSheet({ visible, onResult }: TurnstileSheetProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onResult(undefined)}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Verification</Text>
                        <Pressable onPress={() => onResult(undefined)} hitSlop={8}>
                            <Ionicons name="close" size={22} color={colors.neutral500} />
                        </Pressable>
                    </View>
                    <WebView
                        source={{ uri: 'https://arambh.net/turnstile' }}
                        style={styles.webview}
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                if (data.type === 'token' && data.token) {
                                    onResult(data.token);
                                } else if (data.type === 'disabled') {
                                    onResult(null);
                                }
                                // 'error' / 'expired': keep the sheet open, Turnstile retries itself.
                            } catch {
                                // Ignore malformed messages.
                            }
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        height: 340,
        backgroundColor: colors.warm50,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral200,
    },
    title: { fontSize: 16, fontWeight: '600', color: colors.neutral800 },
    webview: { flex: 1, backgroundColor: colors.warm50 },
});
