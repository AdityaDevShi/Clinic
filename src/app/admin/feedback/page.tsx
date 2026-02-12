'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Feedback } from '@/types';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Star,
    Search,
    Filter,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    MessageCircle,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminFeedbackPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/admin/feedback');
            return;
        }
        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchFeedback() {
            try {
                const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                // @ts-ignore
                const feedbackData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as Feedback[];
                setFeedback(feedbackData);
            } catch (error) {
                console.error("Error fetching feedback:", error);

            } finally {
                setLoading(false);
            }
        }

        if (user) fetchFeedback();
    }, [user, authLoading, router]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await deleteDoc(doc(db, 'feedback', id));
            setFeedback(prev => prev.filter(f => f.id !== id));
            toast.success('Feedback deleted');
        } catch (error) {
            console.error("Error deleting feedback:", error);
            toast.error("Failed to delete feedback");
        }
    };

    const toggleVisibility = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, 'feedback', id), { isPublic: !currentStatus });
            setFeedback(prev => prev.map(f =>
                f.id === id ? { ...f, isPublic: !currentStatus } : f
            ));
            toast.success(currentStatus ? 'Feedback hidden' : 'Feedback visible');
        } catch (error) {
            console.error("Error updating visibility:", error);
            toast.error("Failed to update visibility");
        }
    };

    const filteredFeedback = feedback.filter(f => {
        const matchesSearch =
            (f.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.therapistId || '').toLowerCase().includes(searchTerm.toLowerCase());

        let matchesRating = true;
        if (filterRating !== 'all') {
            matchesRating = f.rating === filterRating;
        }
        return matchesSearch && matchesRating;
    });

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8]">
            <Header />
            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link href="/admin/dashboard" className="text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] flex items-center gap-1 mb-2 transition-colors w-fit">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="font-serif text-3xl text-[var(--primary-800)] mb-2">Feedback Management</h1>
                        <p className="text-[var(--neutral-600)]">View and manage all client testimonials and ratings.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--neutral-200)] mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neutral-400)]" />
                        <input
                            type="text"
                            placeholder="Search by client, comment, or therapist ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--neutral-300)] focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary-500)] outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-[var(--neutral-500)]" />
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-4 py-2 rounded-lg border border-[var(--neutral-300)] focus:ring-2 focus:ring-[var(--primary-200)] outline-none cursor-pointer"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="space-y-4">
                    {filteredFeedback.length === 0 ? (
                        <div className="text-center py-16 bg-[var(--warm-50)] rounded-xl border border-dashed border-[var(--neutral-300)]">
                            <MessageCircle className="w-12 h-12 text-[var(--neutral-400)] mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-[var(--neutral-700)]">No feedback found</h3>
                            <p className="text-[var(--neutral-500)]">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        filteredFeedback.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-xl shadow-sm border border-[var(--neutral-200)] hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center flex-wrap gap-3">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-[var(--neutral-900)]">
                                                {item.rating}.0
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.isPublic ? 'Public' : 'Hidden'}
                                            </span>
                                            <span className="text-xs text-[var(--neutral-400)] ml-auto md:ml-0">
                                                {item.createdAt && format(new Date(item.createdAt), 'PP p')}
                                            </span>
                                        </div>

                                        <p className="text-[var(--neutral-700)] text-lg italic leading-relaxed">
                                            "{item.comment}"
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--neutral-500)] pt-2 border-t border-[var(--neutral-100)]">
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                <span className="font-medium text-[var(--neutral-700)]">{item.clientName || 'Anonymous'}</span>
                                            </div>
                                            <span className="text-[var(--neutral-300)]">|</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[var(--neutral-500)]">Therapist ID:</span>
                                                <span className="font-mono bg-[var(--neutral-100)] px-1 rounded">{item.therapistId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-[var(--neutral-100)] pt-4 md:pt-0 md:pl-6 justify-end">
                                        <button
                                            onClick={(e) => toggleVisibility(item.id!, item.isPublic || false, e)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium w-full md:w-auto justify-center ${item.isPublic
                                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        >
                                            {item.isPublic ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Show</>}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id!)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium w-full md:w-auto justify-center"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
