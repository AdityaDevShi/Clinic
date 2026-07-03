import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { htmlToPlainText, youtubeVideoId, fetchYoutubeMeta, VideoMeta } from '@/lib/format';
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
 * Discord-style embed card: provider label + author + title header, then the
 * real video thumbnail with a play overlay. Metadata comes from YouTube's
 * oEmbed endpoint so it works for any YouTube URL form; degrades gracefully
 * to a plain thumbnail card if the fetch fails. Tap opens the video.
 */
function VideoCard({ url, width }: { url: string; width: number }) {
    const [meta, setMeta] = useState<VideoMeta | null>(null);
    const ytId = youtubeVideoId(url);
    const thumbWidth = width - 2; // inside the card border
    const thumbHeight = thumbWidth * 0.5625; // 16:9
    const thumbnail = meta?.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

    useEffect(() => {
        let cancelled = false;
        fetchYoutubeMeta(url).then((m) => {
            if (!cancelled && m) setMeta(m);
        });
        return () => {
            cancelled = true;
        };
    }, [url]);

    return (
        <Pressable
            style={({ pressed }) => [styles.embedCard, { width }, pressed && { opacity: 0.92 }]}
            onPress={() => Linking.openURL(url)}
        >
            <View style={styles.embedHeader}>
                <View style={styles.embedProviderRow}>
                    <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                    <Text style={styles.embedProvider}>YouTube</Text>
                    {meta?.author ? <Text style={styles.embedAuthor} numberOfLines={1}> · {meta.author}</Text> : null}
                </View>
                <Text style={styles.embedTitle} numberOfLines={2}>
                    {meta?.title || 'Watch on YouTube'}
                </Text>
            </View>

            <View>
                {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={{ width: thumbWidth, height: thumbHeight }} />
                ) : (
                    <View style={[styles.videoFallback, { width: thumbWidth, height: thumbHeight }]} />
                )}
                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={26} color={colors.white} />
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    body: { fontSize: 16, lineHeight: 26 },
    embedCard: {
        marginBottom: spacing.xl,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.neutral200,
        borderLeftWidth: 4,
        borderLeftColor: '#FF0000',
    },
    embedHeader: { padding: spacing.md, gap: 4 },
    embedProviderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    embedProvider: { fontSize: 12, color: colors.neutral500, fontWeight: '600' },
    embedAuthor: { fontSize: 12, color: colors.neutral500, flexShrink: 1 },
    embedTitle: { fontSize: 15, fontWeight: '700', color: colors.primary700, lineHeight: 20 },
    videoFallback: { backgroundColor: colors.neutral800 },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(220,38,38,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 4,
    },
});
