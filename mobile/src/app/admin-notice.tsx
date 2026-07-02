import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Body } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { spacing } from '@/constants/theme';

export default function AdminNotice() {
    const { logout } = useAuth();

    return (
        <Screen scroll={false} style={styles.center}>
            <Heading style={styles.title}>Admin tools live on the website</Heading>
            <Body style={styles.text}>
                The mobile app is designed for clients and therapists. To manage the
                clinic, please use the admin dashboard on arambh.net.
            </Body>
            <View style={styles.actions}>
                <Button title="Open arambh.net" onPress={() => Linking.openURL('https://arambh.net/admin/dashboard')} />
                <Button
                    title="Sign out"
                    variant="outline"
                    onPress={async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }}
                />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    center: { justifyContent: 'center' },
    title: { textAlign: 'center', marginBottom: spacing.lg },
    text: { textAlign: 'center', marginBottom: spacing.xxl },
    actions: { gap: spacing.md },
});
