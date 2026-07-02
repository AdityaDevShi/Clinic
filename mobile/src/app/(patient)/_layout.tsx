import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

/** Guards all patient routes: must be signed in with the client role. */
export default function PatientLayout() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Redirect href="/(auth)/login" />;
    if (user.role !== 'client') return <Redirect href="/" />;

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.warm50 },
            }}
        />
    );
}
