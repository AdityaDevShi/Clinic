import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { colors, radius, spacing } from '@/constants/theme';

function friendlySignupError(message: string): string {
    if (message.includes('email-already-in-use')) return 'An account with this email already exists.';
    if (message.includes('invalid-email')) return 'Please enter a valid email address.';
    if (message.includes('weak-password')) return 'Password is too weak.';
    if (message.includes('network')) return 'Network error. Check your connection and try again.';
    return message || 'Unable to create account. Please try again.';
}

export default function Register() {
    // Step 1: details, Step 2: OTP — mirrors the web signup flow.
    const [step, setStep] = useState<1 | 2>(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { signup } = useAuth();

    const passwordProblems = (): string | null => {
        if (password.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
        if (!/[0-9]/.test(password)) return 'Password must contain a number.';
        if (password !== confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSendOtp = async () => {
        if (!name.trim() || !email.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        const problem = passwordProblems();
        if (problem) {
            setError(problem);
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await api.sendOtp(email.trim());
            setStep(2);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send verification code.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyAndSignup = async () => {
        if (otp.length !== 6) {
            setError('Please enter the 6-digit code.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await api.verifyOtp(email.trim(), otp);
            await signup(email.trim(), password, name.trim());
            router.replace('/');
        } catch (err: unknown) {
            setError(friendlySignupError(err instanceof Error ? err.message : ''));
            setSubmitting(false);
        }
    };

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <Heading style={styles.title}>
                    {step === 1 ? 'Begin Your Journey' : 'Verify Email'}
                </Heading>
                <Body style={{ textAlign: 'center' }}>
                    {step === 1
                        ? 'Create an account to book appointments'
                        : `Enter the code sent to ${email}`}
                </Body>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {step === 1 ? (
                <>
                    <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" editable={!submitting} />
                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!submitting}
                    />
                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        secureTextEntry
                        editable={!submitting}
                    />
                    <Input
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        editable={!submitting}
                    />
                    <Button title="Continue" onPress={handleSendOtp} loading={submitting} />
                </>
            ) : (
                <>
                    <Input
                        label="Verification Code"
                        value={otp}
                        onChangeText={(v) => setOtp(v.replace(/\D/g, '').substring(0, 6))}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={styles.otpInput}
                        editable={!submitting}
                    />
                    <Button title="Verify & Create Account" onPress={handleVerifyAndSignup} loading={submitting} />
                    <Button title="Back" variant="outline" onPress={() => setStep(1)} disabled={submitting} style={{ marginTop: spacing.md }} />
                </>
            )}

            <View style={styles.footer}>
                <Muted>
                    Already have an account?{' '}
                    <Link href="/(auth)/login">
                        <Text style={styles.link}>Sign in</Text>
                    </Link>
                </Muted>
                <Muted style={styles.terms}>
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                </Muted>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { paddingTop: 60 },
    header: { alignItems: 'center', marginBottom: spacing.xl },
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
    otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8 },
    footer: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.md },
    link: { color: colors.primary600, fontWeight: '600' },
    terms: { textAlign: 'center', paddingHorizontal: spacing.lg },
});
