'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
    collection, query, getDocs, getDoc, doc, deleteDoc, addDoc, orderBy, serverTimestamp, where, setDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import {
    ArrowLeft, Loader2, User, Calendar, Trash2, Send, MessageCircle, ExternalLink, Instagram, BookOpen,
    Heart, ChevronLeft, ChevronRight, Video
} from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    instagramUrl?: string;
    videoUrl?: string;
    authorPhotoUrl?: string;
    images: string[];
    createdAt: Date;
}

interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: Date;
}

// Image Carousel
function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
    const [current, setCurrent] = useState(0);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full bg-black/5 aspect-square overflow-hidden rounded-xl">
            <img
                src={images[current]}
                alt={`${alt} - Image ${current + 1}`}
                className="w-full h-full object-cover"
            />
            {images.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrent(c => c === 0 ? images.length - 1 : c - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-neutral-800" />
                    </button>
                    <button
                        onClick={() => setCurrent(c => c === images.length - 1 ? 0 : c + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-neutral-800" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/60'}`}
                            />
                        ))}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {current + 1}/{images.length}
                    </div>
                </>
            )}
        </div>
    );
}

// Video Embed Component
function VideoEmbed({ url }: { url: string }) {
    const getEmbedUrl = (rawUrl: string): { type: 'youtube' | 'vimeo' | 'direct'; src: string } | null => {
        const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
        const vimeoMatch = rawUrl.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
        if (rawUrl.match(/\.(mp4|webm|ogg)$/i)) return { type: 'direct', src: rawUrl };
        return null;
    };
    const embed = getEmbedUrl(url);
    if (!embed) return null;
    return (
        <div className="relative w-full rounded-xl overflow-hidden bg-black/5 border border-[var(--neutral-100)]">
            {embed.type === 'direct' ? (
                <video src={embed.src} controls preload="metadata" className="w-full max-h-96 object-contain bg-black" />
            ) : (
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe src={embed.src} title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full border-0" />
                </div>
            )}
        </div>
    );
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [post, setPost] = useState<BlogPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [postDocId, setPostDocId] = useState<string>('');
    const [likeCount, setLikeCount] = useState(0);
    const [likedByMe, setLikedByMe] = useState(false);

    useEffect(() => {
        async function fetchPost() {
            try {
                const slug = resolvedParams.slug;
                const q = query(collection(db, 'blog_posts'), where('slug', '==', slug));
                const snap = await getDocs(q);

                let postDoc: any = null;
                let postId = '';

                if (!snap.empty) {
                    postDoc = snap.docs[0];
                    postId = postDoc.id;
                } else {
                    const directDoc = await getDoc(doc(db, 'blog_posts', slug));
                    if (directDoc.exists()) {
                        postDoc = directDoc;
                        postId = directDoc.id;
                    }
                }

                if (!postDoc) {
                    setLoading(false);
                    return;
                }

                const data = postDoc.data ? (typeof postDoc.data === 'function' ? postDoc.data() : postDoc.data) : {};
                setPostDocId(postId);

                let images: string[] = data.images || [];
                if (images.length === 0 && data.imageUrl) {
                    images = [data.imageUrl];
                }

                // If no authorPhotoUrl stored, fetch from therapists collection
                let authorPhotoUrl = data.authorPhotoUrl || undefined;
                if (!authorPhotoUrl && data.authorId && data.authorId !== 'arambh-clinic') {
                    try {
                        const therapistDoc = await getDoc(doc(db, 'therapists', data.authorId));
                        if (therapistDoc.exists()) {
                            authorPhotoUrl = therapistDoc.data().photoUrl || undefined;
                        }
                    } catch { }
                }

                setPost({
                    id: postId,
                    title: data.title || '',
                    slug: data.slug || postId,
                    content: data.content || '',
                    authorId: data.authorId || '',
                    authorName: data.authorName || 'Unknown',
                    authorRole: data.authorRole || 'therapist',
                    instagramUrl: data.instagramUrl || undefined,
                    videoUrl: data.videoUrl || undefined,
                    authorPhotoUrl,
                    images,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });

                // Fetch comments
                const commentsQuery = query(
                    collection(db, 'blog_posts', postId, 'blog_comments'),
                    orderBy('createdAt', 'asc')
                );
                const commentsSnap = await getDocs(commentsQuery);
                setComments(commentsSnap.docs.map(d => ({
                    id: d.id,
                    text: d.data().text || '',
                    authorId: d.data().authorId || '',
                    authorName: d.data().authorName || 'Anonymous',
                    createdAt: d.data().createdAt?.toDate() || new Date(),
                })));

                // Fetch likes
                const likesSnap = await getDocs(collection(db, 'blog_posts', postId, 'blog_likes'));
                setLikeCount(likesSnap.size);
                if (user) {
                    setLikedByMe(likesSnap.docs.some(d => d.id === user.id));
                }
            } catch (error) {
                console.error('Error fetching post:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [resolvedParams.slug, user]);

    const handleLike = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        const likeRef = doc(db, 'blog_posts', postDocId, 'blog_likes', user.id);
        try {
            if (likedByMe) {
                await deleteDoc(likeRef);
                setLikedByMe(false);
                setLikeCount(c => c - 1);
            } else {
                await setDoc(likeRef, { userId: user.id, createdAt: serverTimestamp() });
                setLikedByMe(true);
                setLikeCount(c => c + 1);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !postDocId) return;
        setSendingComment(true);
        try {
            const docRef = await addDoc(collection(db, 'blog_posts', postDocId, 'blog_comments'), {
                text: commentText.trim(),
                authorId: user.id,
                authorName: user.name || 'User',
                createdAt: serverTimestamp(),
            });
            setComments(prev => [...prev, {
                id: docRef.id,
                text: commentText.trim(),
                authorId: user.id,
                authorName: user.name || 'User',
                createdAt: new Date(),
            }]);
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment.');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await deleteDoc(doc(db, 'blog_posts', postDocId, 'blog_comments', commentId));
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'blog_posts', postDocId));
            router.push('/blog');
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--warm-50)] px-4">
                <BookOpen className="w-12 h-12 text-[var(--neutral-300)] mb-4" />
                <h2 className="text-xl font-serif text-[var(--primary-700)] mb-2">Post Not Found</h2>
                <Link href="/blog" className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium text-sm">← Back to Blog</Link>
            </div>
        );
    }

    const isAdmin = user?.role === 'admin';
    const canDelete = isAdmin || (user && user.id === post.authorId);

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

                        {/* Back */}
                        <div className="flex items-center justify-between mb-4">
                            <Link href="/blog" className="flex items-center gap-2 text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Link>
                            {canDelete && (
                                <button
                                    onClick={handleDeletePost}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            )}
                        </div>

                        {/* Post Card */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[var(--neutral-100)]">
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                {post.authorPhotoUrl ? (
                                    <img src={post.authorPhotoUrl} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${post.authorRole === 'admin'
                                        ? 'bg-gradient-to-br from-purple-400 to-pink-400'
                                        : 'bg-[var(--primary-100)]'
                                        }`}>
                                        {post.authorRole === 'admin' ? (
                                            <span className="text-white text-sm font-bold">A</span>
                                        ) : (
                                            <User className="w-5 h-5 text-[var(--primary-600)]" />
                                        )}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--neutral-900)]">{post.authorName}</p>
                                    <p className="text-xs text-[var(--neutral-400)]">{format(post.createdAt, 'MMMM d, yyyy')}</p>
                                </div>
                                {post.instagramUrl && (
                                    <a
                                        href={post.instagramUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full hover:opacity-90"
                                    >
                                        <Instagram className="w-3.5 h-3.5" /> Instagram
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            {/* Images */}
                            {post.images.length > 0 && (
                                <ImageCarousel images={post.images} alt={post.title} />
                            )}

                            {/* Embedded Video */}
                            {post.videoUrl && (
                                <div className="px-4 pt-3">
                                    <VideoEmbed url={post.videoUrl} />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="px-4 pt-3">
                                <div className="flex items-center gap-4 mb-2">
                                    <button onClick={handleLike} className="group">
                                        <Heart className={`w-7 h-7 transition-all ${likedByMe
                                            ? 'text-red-500 fill-red-500 scale-110'
                                            : 'text-[var(--neutral-700)] group-hover:text-red-400'
                                            }`} />
                                    </button>
                                    <MessageCircle className="w-7 h-7 text-[var(--neutral-700)]" />
                                </div>

                                {likeCount > 0 && (
                                    <p className="text-sm font-semibold text-[var(--neutral-900)] mb-2">
                                        {likeCount} like{likeCount !== 1 ? 's' : ''}
                                    </p>
                                )}

                                {/* Title + Content */}
                                {post.title && post.title !== 'Untitled Post' && (
                                    <h1 className="text-lg font-bold text-[var(--neutral-900)] mb-1">{post.title}</h1>
                                )}
                                {post.content && (
                                    <p className="text-sm text-[var(--neutral-700)] whitespace-pre-wrap mb-3">
                                        <span className="font-semibold text-[var(--neutral-900)]">{post.authorName}</span>{' '}
                                        {post.content}
                                    </p>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="px-4 pb-4 pt-2 border-t border-[var(--neutral-50)]">
                                <p className="text-sm font-semibold text-[var(--neutral-700)] mb-3">
                                    Comments ({comments.length})
                                </p>

                                {/* Comment List */}
                                <div className="space-y-3 mb-4">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-[var(--neutral-400)]">No comments yet. Be the first!</p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="flex gap-2.5 group">
                                                <div className="w-7 h-7 rounded-full bg-[var(--neutral-100)] flex items-center justify-center shrink-0 mt-0.5">
                                                    <User className="w-3.5 h-3.5 text-[var(--neutral-500)]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm">
                                                        <span className="font-semibold text-[var(--neutral-900)]">{comment.authorName}</span>{' '}
                                                        <span className="text-[var(--neutral-700)]">{comment.text}</span>
                                                    </p>
                                                    <p className="text-xs text-[var(--neutral-400)] mt-0.5">
                                                        {format(comment.createdAt, 'MMM d · h:mm a')}
                                                    </p>
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Comment */}
                                {user ? (
                                    <div className="flex items-center gap-2 pt-3 border-t border-[var(--neutral-100)]">
                                        <div className="w-7 h-7 rounded-full bg-[var(--primary-100)] flex items-center justify-center shrink-0">
                                            <User className="w-3.5 h-3.5 text-[var(--primary-600)]" />
                                        </div>
                                        <input
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                            placeholder="Add a comment..."
                                            className="flex-1 text-sm py-2 px-0 border-0 focus:outline-none bg-transparent placeholder:text-[var(--neutral-300)]"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim() || sendingComment}
                                            className="text-[var(--primary-600)] hover:text-[var(--primary-700)] disabled:opacity-30 font-semibold text-sm transition-colors"
                                        >
                                            {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-3 border-t border-[var(--neutral-100)]">
                                        <Link href="/login" className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium">
                                            Sign in to comment
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                </div>
            </main>
        </div>
    );
}
