import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { BlogPost } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

/** Strip HTML tags from rich-text content for plain-text display. */
function htmlToPlainText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#0?39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

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
                    <Muted style={{ marginBottom: spacing.xl }}>
                        {post.authorName} · {format(post.createdAt, 'MMMM d, yyyy')}
                    </Muted>
                    <Body style={styles.body}>{htmlToPlainText(post.content || '')}</Body>
                </View>
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    body: { fontSize: 16, lineHeight: 26 },
});
