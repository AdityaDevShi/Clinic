'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';


import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    ArrowLeft,
    Megaphone,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface WorkshopSettings {
    isEnabled: boolean;
    message: string;
    link: string;
}

export default function WorkshopSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [settings, setSettings] = useState<WorkshopSettings>({
        isEnabled: false,
        message: '',
        link: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchSettings() {
            try {
                const docRef = doc(db, 'settings', 'workshop');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setSettings(docSnap.data() as WorkshopSettings);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchSettings();
        }
    }, [user, authLoading, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveStatus('idle');

        try {
            await setDoc(doc(db, 'settings', 'workshop'), {
                ...settings,
                updatedAt: serverTimestamp()
            });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">


            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-3xl mx-auto">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>

                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                                <Megaphone className="w-6 h-6 text-[var(--primary-600)]" />
                            </div>
                            <div>
                                <h1 className="font-serif text-2xl text-[var(--primary-700)]">
                                    Workshop Settings
                                </h1>
                                <p className="text-[var(--neutral-500)]">
                                    Manage the global workshop announcement banner
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Toggle */}
                            <div className="flex items-center justify-between p-4 bg-[var(--warm-50)] rounded-xl">
                                <div>
                                    <h3 className="font-medium text-[var(--neutral-700)]">Enable Banner</h3>
                                    <p className="text-sm text-[var(--neutral-500)]">
                                        Show the banner on all pages
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.isEnabled}
                                        onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-600)]"></div>
                                </label>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                    Announcement Message (Scrolling)
                                </label>
                                <textarea
                                    value={settings.message}
                                    onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                                    className="input min-h-[100px]"
                                    placeholder="e.g., Join our upcoming workshop on Stress Management this Sunday at 10 AM!"
                                    required={settings.isEnabled}
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                    Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={settings.link}
                                    onChange={(e) => setSettings({ ...settings, link: e.target.value })}
                                    className="input"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-[var(--neutral-500)] mt-1">
                                    Users will be redirected here when clicking the message.
                                </p>
                            </div>

                            {/* Status Message */}
                            {saveStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center text-green-600 text-sm bg-green-50 p-3 rounded-lg"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Settings saved successfully!
                                </motion.div>
                            )}

                            {saveStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg"
                                >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Failed to save settings. Please try again.
                                </motion.div>
                            )}

                            {/* Save Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full btn btn-primary py-3 flex items-center justify-center disabled:opacity-70"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-5 h-5 mr-2" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>


        </div>
    );
}
