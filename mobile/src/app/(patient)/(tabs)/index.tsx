import { ActivityIndicator, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTherapists } from '@/hooks/useTherapists';
import { TherapistCard } from '@/components/TherapistCard';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';

export default function TherapistsTab() {
    const { therapists, loading } = useTherapists();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: colors.warm50, paddingTop: insets.top }}>
            <FlatList
                data={therapists}
                keyExtractor={(t) => t.id}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
                ListHeaderComponent={
                    <View style={{ paddingVertical: spacing.lg }}>
                        <Heading>Our Therapists</Heading>
                        <Muted style={{ marginTop: spacing.xs }}>
                            Choose a therapist to view their profile and book a session
                        </Muted>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator color={colors.primary600} style={{ marginTop: spacing.xxl }} />
                    ) : (
                        <Body style={{ textAlign: 'center', marginTop: spacing.xxl }}>
                            No therapists available right now.
                        </Body>
                    )
                }
                renderItem={({ item }) => (
                    <TherapistCard
                        therapist={item}
                        onPress={() => router.push(`/(patient)/therapist/${item.id}`)}
                    />
                )}
            />
        </View>
    );
}
