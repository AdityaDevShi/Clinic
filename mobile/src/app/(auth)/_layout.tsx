import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function AuthLayout() {
    const { user, loading } = useAuth();

    // Already signed in → bounce to the role gate.
    if (!loading && user) {
        return <Redirect href="/" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.warm50 },
            }}
        />
    );
}
