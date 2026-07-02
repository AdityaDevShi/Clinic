import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Body } from '@/components/ui/Typography';
import { api } from '@/lib/api';
import { colors, radius, spacing } from '@/constants/theme';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await api.forgotPassword(email.trim());
            setSent(true);
        } catch {
            setError('Failed to send the reset link. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <Heading style={styles.title}>Reset Password</Heading>
                <Body style={{ textAlign: 'center' }}>
                    {sent
                        ? 'If an account exists with this email, a reset link has been sent. Check your inbox.'
                        : "Enter your email and we'll send you a reset link."}
                </Body>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {!sent ? (
                <>
                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!submitting}
                    />
                    <Button title="Send Reset Link" onPress={handleSubmit} loading={submitting} />
                </>
            ) : null}

            <Button
                title="Back to Sign In"
                variant="outline"
                onPress={() => router.back()}
                style={{ marginTop: spacing.md }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { paddingTop: 80 },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    title: { marginBottom: spacing.sm },
    errorBox: {
        backgroundColor: colors.errorBg,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        borderRadius: radius.md,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    errorText: { color: colors.error, fontSize: 14 },
});
