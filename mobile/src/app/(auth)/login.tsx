import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { GoogleButton } from '@/components/GoogleButton';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleSignInCancelled } from '@/lib/googleAuth';
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
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, signInWithGoogle } = useAuth();

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

    const handleGoogle = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
            router.replace('/');
        } catch (err: unknown) {
            if (!(err instanceof GoogleSignInCancelled)) {
                setError('Unable to sign in with Google. Please try again.');
            }
            setGoogleLoading(false);
        }
    };

    return (
        <Screen style={styles.container}>
            {/* Soft sage blobs — subtle, brand-toned backdrop */}
            <View style={styles.blobTopRight} pointerEvents="none" />
            <View style={styles.blobBottomLeft} pointerEvents="none" />

            <View style={styles.header}>
                <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                <Heading style={styles.title}>Welcome Back</Heading>
                <Body style={styles.subtitle}>Sign in to continue your journey</Body>
            </View>

            <View style={styles.card}>
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

            <Button title="Sign In" onPress={handleLogin} loading={submitting} disabled={googleLoading} />

            <View style={styles.divider}>
                <View style={styles.line} />
                <Muted style={styles.dividerText}>OR</Muted>
                <View style={styles.line} />
            </View>

                <GoogleButton label="Sign in with Google" onPress={handleGoogle} loading={googleLoading} disabled={submitting} />
            </View>

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
    container: { paddingTop: 48 },
    blobTopRight: {
        position: 'absolute',
        top: -90,
        right: -90,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: colors.primary100,
        opacity: 0.7,
    },
    blobBottomLeft: {
        position: 'absolute',
        bottom: -110,
        left: -110,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.warm200,
        opacity: 0.8,
    },
    header: { alignItems: 'center', marginBottom: spacing.xl },
    logo: { width: 72, height: 96, marginBottom: spacing.md },
    title: { marginBottom: spacing.xs, textAlign: 'center' },
    subtitle: { textAlign: 'center' },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.neutral200,
        shadowColor: colors.primary900,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
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
    divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
    line: { flex: 1, height: 1, backgroundColor: colors.neutral200 },
    dividerText: { color: colors.neutral400 },
    footer: { alignItems: 'center', marginTop: spacing.xl },
    link: { color: colors.primary600, fontWeight: '600' },
});
