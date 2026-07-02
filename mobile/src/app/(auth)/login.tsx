import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing } from '@/constants/theme';

function friendlyAuthError(message: string): string {
    if (message.includes('invalid-credential') || message.includes('wrong-password') || message.includes('user-not-found')) {
        return 'Invalid email or password.';
    }
    if (message.includes('invalid-email')) return 'Please enter a valid email address.';
    if (message.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
    if (message.includes('network')) return 'Network error. Check your connection and try again.';
    return 'Unable to sign in. Please try again.';
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            router.replace('/');
        } catch (err: unknown) {
            setError(friendlyAuthError(err instanceof Error ? err.message : ''));
            setSubmitting(false);
        }
    };

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <Heading style={styles.title}>Welcome Back</Heading>
                <Body>Sign in to continue your journey</Body>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!submitting}
            />
            <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                editable={!submitting}
            />

            <Link href="/(auth)/forgot-password" style={styles.forgot}>
                <Muted style={styles.forgotText}>Forgot password?</Muted>
            </Link>

            <Button title="Sign In" onPress={handleLogin} loading={submitting} />

            <View style={styles.footer}>
                <Muted>
                    Don&apos;t have an account?{' '}
                    <Link href="/(auth)/register">
                        <Text style={styles.link}>Sign up</Text>
                    </Link>
                </Muted>
            </View>
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
    forgot: { alignSelf: 'flex-end', marginBottom: spacing.xl },
    forgotText: { color: colors.primary600, fontWeight: '500' },
    footer: { alignItems: 'center', marginTop: spacing.xl },
    link: { color: colors.primary600, fontWeight: '600' },
});
