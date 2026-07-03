import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { htmlToPlainText, youtubeVideoId } from '@/lib/format';
import { BlogPost } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

export default function BlogPostScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const { width } = useWindowDimensions();

    useEffect(() => {
        if (!id) return;
        getDoc(doc(db, 'blog_posts', id)).then((snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setPost({
                    id: snap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                } as BlogPost);
            }
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    if (!post) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Body>Post not found.</Body>
            </Screen>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: '', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen padded={false}>
                {post.imageUrls?.[0] ? (
                    <Image source={{ uri: post.imageUrls[0] }} style={{ width, height: width * 0.6 }} />
                ) : null}
                <View style={styles.content}>
                    <Heading style={{ marginBottom: spacing.sm }}>{post.title}</Heading>
                    <Muted style={{ marginBottom: spacing.lg }}>
                        {post.authorName} · {format(post.createdAt, 'MMMM d, yyyy')}
                    </Muted>

                    {post.videoUrl ? (
                        <VideoCard url={post.videoUrl} width={width - spacing.lg * 2} />
                    ) : null}

                    <Body style={styles.body}>{htmlToPlainText(post.content || '')}</Body>
                </View>
            </Screen>
        </>
    );
}

/**
 * Tappable video card: YouTube gets a real thumbnail + play overlay; other
 * providers get a generic watch card. Opens in the YouTube app / browser.
 */
function VideoCard({ url, width }: { url: string; width: number }) {
    const ytId = youtubeVideoId(url);
    const height = width * 0.5625; // 16:9

    return (
        <Pressable style={[styles.videoCard, { width, height }]} onPress={() => Linking.openURL(url)}>
            {ytId ? (
                <Image
                    source={{ uri: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` }}
                    style={{ width, height, borderRadius: radius.lg }}
                />
            ) : (
                <View style={[styles.videoFallback, { width, height }]} />
            )}
            <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                    <Ionicons name="play" size={28} color={colors.white} />
                </View>
                <Text style={styles.playLabel}>Watch video</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    body: { fontSize: 16, lineHeight: 26 },
    videoCard: { marginBottom: spacing.xl, borderRadius: radius.lg, overflow: 'hidden' },
    videoFallback: { backgroundColor: colors.neutral800, borderRadius: radius.lg },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
        gap: spacing.sm,
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(220,38,38,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 4,
    },
    playLabel: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
