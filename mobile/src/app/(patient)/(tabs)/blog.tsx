import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { BlogService } from '@/services/blogService';
import { BlogPost } from '@/lib/types';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

export default function BlogTab() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            BlogService.getPosts().then((list) => {
                setPosts(list);
                setLoading(false);
            });
        }, [])
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.warm50, paddingTop: insets.top }}>
            <FlatList
                data={posts}
                keyExtractor={(p) => p.id}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
                ListHeaderComponent={
                    <View style={{ paddingVertical: spacing.lg }}>
                        <Heading>Blog</Heading>
                        <Muted style={{ marginTop: spacing.xs }}>Insights from our therapists</Muted>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator color={colors.primary600} style={{ marginTop: spacing.xxl }} />
                    ) : (
                        <Body style={{ textAlign: 'center', marginTop: spacing.xxl }}>No posts yet.</Body>
                    )
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
                        onPress={() => router.push(`/(patient)/blog/${item.id}`)}
                    >
                        {item.imageUrls?.[0] ? (
                            <Image source={{ uri: item.imageUrls[0] }} style={styles.image} />
                        ) : null}
                        <View style={styles.cardBody}>
                            <Subheading numberOfLines={2}>{item.title}</Subheading>
                            {item.excerpt ? (
                                <Body numberOfLines={2} style={{ marginTop: spacing.xs }}>
                                    {item.excerpt}
                                </Body>
                            ) : null}
                            <Muted style={{ marginTop: spacing.sm }}>
                                {item.authorName} · {format(item.createdAt, 'MMM d, yyyy')}
                            </Muted>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.neutral200,
        overflow: 'hidden',
    },
    image: { width: '100%', height: 160 },
    cardBody: { padding: spacing.lg },
});
