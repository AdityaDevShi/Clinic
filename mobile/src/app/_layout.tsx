import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
    useFonts,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        PlayfairDisplay_600SemiBold,
        PlayfairDisplay_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warm50 }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </View>
        );
    }

    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.warm50 },
                }}
            />
        </AuthProvider>
    );
}
