import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

/** Root gate: route by auth state and role. */
export default function Index() {
    const { user, firebaseUser, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warm50 }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </View>
        );
    }

    if (!firebaseUser || !user) {
        return <Redirect href="/(auth)/login" />;
    }
    if (user.role === 'therapist') {
        return <Redirect href="/(therapist)/(tabs)" />;
    }
    if (user.role === 'admin') {
        return <Redirect href="/admin-notice" />;
    }
    return <Redirect href="/(patient)/(tabs)" />;
}
