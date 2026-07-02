import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

/** Guards all therapist routes: must be signed in with the therapist role. */
export default function TherapistLayout() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Redirect href="/(auth)/login" />;
    if (user.role !== 'therapist') return <Redirect href="/" />;

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.warm50 },
            }}
        />
    );
}
