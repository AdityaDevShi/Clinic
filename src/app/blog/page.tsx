'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import {
    collection, query, getDocs, orderBy, addDoc, serverTimestamp, Timestamp, doc, setDoc, deleteDoc, getDoc
} from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import {
    BookOpen, Plus, Loader2, X, User, Calendar, MessageCircle, Instagram,
    Heart, ChevronLeft, ChevronRight, ImagePlus, Send, Video
} from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    authorName: string;
    authorRole: string;
    authorId: string;
    authorPhotoUrl?: string;
    instagramUrl?: string;
    videoUrl?: string;
    images: string[];
    createdAt: Date;
    commentCount: number;
    likeCount: number;
    likedByMe: boolean;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
}

// Image Carousel Component
function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
    const [current, setCurrent] = useState(0);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full bg-black/5 aspect-square overflow-hidden">
            <img
                src={images[current]}
                alt={`${alt} - Image ${current + 1}`}
                className="w-full h-full object-cover"
            />
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(c => c === 0 ? images.length - 1 : c - 1); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-neutral-800" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(c => c === images.length - 1 ? 0 : c + 1); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-neutral-800" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/60'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Video Embed Component — Discord-style mini-player
function VideoEmbed({ url }: { url: string }) {
    const getEmbedUrl = (rawUrl: string): { type: 'youtube' | 'vimeo' | 'direct'; src: string } | null => {
        // YouTube
        const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}` };

        // Vimeo
        const vimeoMatch = rawUrl.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

        // Direct video file
        if (rawUrl.match(/\.(mp4|webm|ogg)$/i)) return { type: 'direct', src: rawUrl };

        return null;
    };

    const embed = getEmbedUrl(url);
    if (!embed) return null;

    return (
        <div className="relative w-full rounded-xl overflow-hidden bg-black/5 border border-[var(--neutral-100)]">
            {embed.type === 'direct' ? (
                <video
                    src={embed.src}
                    controls
                    preload="metadata"
                    className="w-full max-h-80 object-contain bg-black"
                />
            ) : (
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                        src={embed.src}
                        title="Embedded video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                    />
                </div>
            )}
        </div>
    );
}

export default function BlogPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formImages, setFormImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [formVideoUrl, setFormVideoUrl] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    useEffect(() => {
        async function fetchPosts() {
            try {
                const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                const fetched: BlogPost[] = [];

                for (const d of snap.docs) {
                    const data = d.data();
                    let commentCount = 0;
                    let likeCount = 0;
                    let likedByMe = false;

                    try {
                        const commentsSnap = await getDocs(collection(db, 'blog_posts', d.id, 'blog_comments'));
                        commentCount = commentsSnap.size;
                    } catch { }

                    try {
                        const likesSnap = await getDocs(collection(db, 'blog_posts', d.id, 'blog_likes'));
                        likeCount = likesSnap.size;
                        if (user) {
                            likedByMe = likesSnap.docs.some(ld => ld.id === user.id);
                        }
                    } catch { }

                    // Support both old single imageUrl and new images array
                    let images: string[] = data.images || [];
                    if (images.length === 0 && data.imageUrl) {
                        images = [data.imageUrl];
                    }

                    // If no authorPhotoUrl stored, try to fetch from therapists collection
                    let authorPhotoUrl = data.authorPhotoUrl || undefined;
                    if (!authorPhotoUrl && data.authorId && data.authorId !== 'arambh-clinic') {
                        try {
                            const therapistDoc = await getDoc(doc(db, 'therapists', data.authorId));
                            if (therapistDoc.exists()) {
                                authorPhotoUrl = therapistDoc.data().photoUrl || undefined;
                            }
                        } catch { }
                    }

                    fetched.push({
                        id: d.id,
                        title: data.title || '',
                        slug: data.slug || d.id,
                        content: data.content || '',
                        authorName: data.authorName || 'Unknown',
                        authorRole: data.authorRole || 'therapist',
                        authorId: data.authorId || '',
                        authorPhotoUrl,
                        instagramUrl: data.instagramUrl || undefined,
                        videoUrl: data.videoUrl || undefined,
                        images,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        commentCount,
                        likeCount,
                        likedByMe,
                    });
                }

                setPosts(fetched);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [user]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + formImages.length > 10) {
            alert('Maximum 10 images per post.');
            return;
        }
        setFormImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreviews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setFormImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePost = async () => {
        if (!formContent.trim() && formImages.length === 0) {
            alert('Please add some content or images.');
            return;
        }
        if (!user) return;

        setSaving(true);
        try {
            // Upload images to Firebase Storage
            const imageUrls: string[] = [];
            if (formImages.length > 0) {
                setUploadProgress('Uploading images...');
                for (let i = 0; i < formImages.length; i++) {
                    setUploadProgress(`Uploading image ${i + 1}/${formImages.length}...`);
                    const file = formImages[i];
                    const storageRef = ref(storage, `blog_images/${user.id}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    imageUrls.push(url);
                }
            }

            setUploadProgress('Publishing post...');
            const title = formTitle.trim() || 'Untitled Post';
            const slug = generateSlug(title);

            // Fetch the therapist's photo from the therapists collection (where it's actually stored)
            let authorPhotoUrl: string | null = null;
            try {
                const therapistDoc = await getDoc(doc(db, 'therapists', user.id));
                if (therapistDoc.exists()) {
                    authorPhotoUrl = therapistDoc.data().photoUrl || null;
                }
            } catch { }

            const postData: any = {
                title,
                slug,
                content: formContent.trim(),
                authorId: user.id,
                authorName: user.name || 'Therapist',
                authorRole: user.role || 'therapist',
                images: imageUrls,
                authorPhotoUrl,
                createdAt: serverTimestamp(),
            };
            if (formVideoUrl.trim()) {
                postData.videoUrl = formVideoUrl.trim();
            }

            const docRef = await addDoc(collection(db, 'blog_posts'), postData);
            const newPost: BlogPost = {
                id: docRef.id,
                title,
                slug,
                content: formContent.trim(),
                authorName: user.name || 'Therapist',
                authorRole: user.role || 'therapist',
                authorId: user.id,
                authorPhotoUrl: authorPhotoUrl || undefined,
                images: imageUrls,
                videoUrl: formVideoUrl.trim() || undefined,
                createdAt: new Date(),
                commentCount: 0,
                likeCount: 0,
                likedByMe: false,
            };

            setPosts(prev => [newPost, ...prev]);
            setFormTitle('');
            setFormContent('');
            setFormImages([]);
            setImagePreviews([]);
            setFormVideoUrl('');
            setUploadProgress('');
            setShowForm(false);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post.');
        } finally {
            setSaving(false);
            setUploadProgress('');
        }
    };

    const handleLike = async (postId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            return;
        }

        const likeRef = doc(db, 'blog_posts', postId, 'blog_likes', user.id);
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        try {
            if (post.likedByMe) {
                await deleteDoc(likeRef);
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: false, likeCount: p.likeCount - 1 } : p));
            } else {
                await setDoc(likeRef, { userId: user.id, createdAt: serverTimestamp() });
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: true, likeCount: p.likeCount + 1 } : p));
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const canPost = user && (user.role === 'therapist' || user.role === 'admin');

    const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this post? This cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'blog_posts', postId));
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    >
                        {/* Header */}
                        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="font-serif text-3xl text-[var(--primary-700)] flex items-center gap-3">
                                    <BookOpen className="w-7 h-7" />
                                    Blog & News
                                </h1>
                                <p className="text-sm text-[var(--neutral-500)] mt-1">Updates and insights from our team</p>
                            </div>
                            {canPost && (
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-600)] text-white rounded-xl hover:bg-[var(--primary-700)] transition-colors text-sm font-medium shadow-sm"
                                >
                                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showForm ? 'Cancel' : 'Create Post'}
                                </button>
                            )}
                        </motion.div>

                        {/* Create Post Form — Instagram style */}
                        <AnimatePresence>
                            {showForm && canPost && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white rounded-2xl shadow-sm border border-[var(--neutral-200)] mb-8 overflow-hidden"
                                >
                                    {/* Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="relative aspect-square bg-neutral-100">
                                            <ImageCarousel images={imagePreviews} alt="Preview" />
                                            {/* Remove buttons overlay */}
                                            <div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end">
                                                {imagePreviews.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => removeImage(i)}
                                                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                                                <User className="w-4 h-4 text-[var(--primary-600)]" />
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--neutral-800)]">{user?.name}</span>
                                        </div>

                                        <input
                                            type="text"
                                            value={formTitle}
                                            onChange={e => setFormTitle(e.target.value)}
                                            placeholder="Title (optional)"
                                            className="w-full px-0 py-2 border-0 border-b border-[var(--neutral-100)] focus:outline-none focus:border-[var(--primary-400)] text-base font-medium bg-transparent placeholder:text-[var(--neutral-300)]"
                                        />

                                        <textarea
                                            value={formContent}
                                            onChange={e => setFormContent(e.target.value)}
                                            placeholder="Write a caption..."
                                            rows={4}
                                            className="w-full px-0 py-3 border-0 focus:outline-none text-sm bg-transparent resize-none placeholder:text-[var(--neutral-300)]"
                                        />

                                        <div className="flex items-center gap-2 px-0 py-2 border-b border-[var(--neutral-100)]">
                                            <Video className="w-4 h-4 text-[var(--neutral-400)] shrink-0" />
                                            <input
                                                type="url"
                                                value={formVideoUrl}
                                                onChange={e => setFormVideoUrl(e.target.value)}
                                                placeholder="Video link (YouTube, Vimeo, or .mp4) — optional"
                                                className="w-full px-0 py-1 border-0 focus:outline-none text-sm bg-transparent placeholder:text-[var(--neutral-300)]"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-[var(--neutral-100)]">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--neutral-600)] hover:bg-[var(--neutral-50)] rounded-lg transition-colors"
                                                >
                                                    <ImagePlus className="w-5 h-5 text-[var(--primary-500)]" />
                                                    <span>Add Photos</span>
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleImageSelect}
                                                />
                                                {formImages.length > 0 && (
                                                    <span className="text-xs text-[var(--neutral-400)]">{formImages.length} photo{formImages.length !== 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleCreatePost}
                                                disabled={saving || (!formContent.trim() && formImages.length === 0)}
                                                className="flex items-center gap-2 px-5 py-2 bg-[var(--primary-600)] text-white rounded-full hover:bg-[var(--primary-700)] disabled:opacity-50 transition-colors text-sm font-semibold"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {uploadProgress || 'Publishing...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Post
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Loading */}
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
                            </div>
                        ) : posts.length === 0 ? (
                            <motion.div variants={fadeInUp} className="text-center py-16 bg-white rounded-2xl border border-dashed border-[var(--neutral-200)]">
                                <BookOpen className="w-12 h-12 mx-auto text-[var(--neutral-300)] mb-3" />
                                <p className="text-[var(--neutral-500)]">No posts yet.</p>
                                {canPost && <p className="text-sm text-[var(--neutral-400)] mt-1">Be the first to share something!</p>}
                            </motion.div>
                        ) : (
                            /* Post Feed — Instagram style cards */
                            <motion.div variants={fadeInUp} className="space-y-6">
                                {posts.map((post) => (
                                    <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[var(--neutral-100)]">
                                        {/* Post Header */}
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            {post.authorPhotoUrl ? (
                                                <img src={post.authorPhotoUrl} alt={post.authorName} className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${post.authorRole === 'admin'
                                                    ? 'bg-gradient-to-br from-purple-400 to-pink-400'
                                                    : 'bg-[var(--primary-100)]'
                                                    }`}>
                                                    {post.authorRole === 'admin' ? (
                                                        <span className="text-white text-xs font-bold">A</span>
                                                    ) : (
                                                        <User className="w-4 h-4 text-[var(--primary-600)]" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--neutral-900)] truncate">{post.authorName}</p>
                                                <p className="text-xs text-[var(--neutral-400)]">{format(post.createdAt, 'MMM d, yyyy')}</p>
                                            </div>
                                            {post.instagramUrl && (
                                                <a
                                                    href={post.instagramUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full hover:opacity-90"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <Instagram className="w-3 h-3" />
                                                    View
                                                </a>
                                            )}
                                            {(user?.role === 'admin' || user?.id === post.authorId) && (
                                                <button
                                                    onClick={(e) => handleDeletePost(post.id, e)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete post"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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

                                        {/* Actions — Like, Comment */}
                                        <div className="px-4 pt-3">
                                            <div className="flex items-center gap-4 mb-2">
                                                <button
                                                    onClick={(e) => handleLike(post.id, e)}
                                                    className="flex items-center gap-1.5 group"
                                                >
                                                    <Heart className={`w-6 h-6 transition-all ${post.likedByMe
                                                        ? 'text-red-500 fill-red-500 scale-110'
                                                        : 'text-[var(--neutral-700)] group-hover:text-red-400'
                                                        }`} />
                                                </button>
                                                <Link href={`/blog/${post.slug}`} className="flex items-center gap-1.5 group">
                                                    <MessageCircle className="w-6 h-6 text-[var(--neutral-700)] group-hover:text-[var(--primary-500)]" />
                                                </Link>
                                            </div>

                                            {/* Like count */}
                                            {post.likeCount > 0 && (
                                                <p className="text-sm font-semibold text-[var(--neutral-900)] mb-1">
                                                    {post.likeCount} like{post.likeCount !== 1 ? 's' : ''}
                                                </p>
                                            )}

                                            {/* Content / Caption */}
                                            <div className="mb-2">
                                                {post.title && post.title !== 'Untitled Post' && (
                                                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                                                        <span className="text-sm font-semibold text-[var(--neutral-900)]">{post.title}</span>
                                                    </Link>
                                                )}
                                                {post.content && (
                                                    <p className="text-sm text-[var(--neutral-700)] mt-1">
                                                        <span className="font-semibold text-[var(--neutral-900)]">{post.authorName}</span>{' '}
                                                        {post.content.length > 150 ? (
                                                            <>
                                                                {post.content.slice(0, 150)}...
                                                                <Link href={`/blog/${post.slug}`} className="text-[var(--neutral-400)] ml-1">more</Link>
                                                            </>
                                                        ) : post.content}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Comment preview */}
                                            {post.commentCount > 0 && (
                                                <Link href={`/blog/${post.slug}`} className="text-sm text-[var(--neutral-400)] hover:text-[var(--neutral-500)] block mb-1">
                                                    View all {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
                                                </Link>
                                            )}
                                        </div>

                                        <div className="h-3" />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
