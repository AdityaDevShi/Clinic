'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Paperclip, Plus, Save, Clock, Calendar, Trash2, Loader2, AlertTriangle, Video, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';


type Tab = 'notes' | 'attachments';

interface Note {
    id: string;
    content: string;
    createdAt: Date;
    therapistId: string;
    clientId: string;
}

interface Attachment {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: Date;
    url: string;
    storagePath?: string;
    therapistId: string;
    clientId: string;
}

interface Patient {
    id: string;
    name: string;
    email: string;
}

export default function PatientDetailsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;

    const [activeTab, setActiveTab] = useState<Tab>('notes');
    const [notes, setNotes] = useState<Note[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeletingPatient, setIsDeletingPatient] = useState(false);
    const [meetLink, setMeetLink] = useState('');
    const [savedMeetLink, setSavedMeetLink] = useState('');
    const [savingMeetLink, setSavingMeetLink] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'therapist' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchData() {
            if (!user || !patientId) return;

            try {
                // 1. Fetch Patient Details
                // Try fetching from users collection first
                const userDoc = await getDoc(doc(db, 'users', patientId));
                if (userDoc.exists()) {
                    setPatient({
                        id: userDoc.id,
                        name: userDoc.data().name || 'Unknown Patient',
                        email: userDoc.data().email || '',
                    });
                } else {
                    // Fallback: Try to find name from bookings if user doc doesn't exist (unlikely but safe)
                    setPatient({ id: patientId, name: 'Patient', email: '' });
                }

                // 2. Fetch Notes
                const notesQuery = query(
                    collection(db, 'patient_notes'),
                    where('clientId', '==', patientId),
                    where('therapistId', '==', user.id)
                );
                const notesSnap = await getDocs(notesQuery);
                const fetchedNotes = notesSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as Note[];

                // Sort client-side
                fetchedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setNotes(fetchedNotes);

                // 3. Fetch Attachments
                const attachmentsQuery = query(
                    collection(db, 'patient_attachments'),
                    where('clientId', '==', patientId),
                    where('therapistId', '==', user.id)
                );
                const attachSnap = await getDocs(attachmentsQuery);
                const fetchedAttachments = attachSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
                })) as Attachment[];

                // Sort client-side
                fetchedAttachments.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
                setAttachments(fetchedAttachments);

                // 4. Fetch session link for this patient-therapist pair
                const linkDocId = `${user.id}_${patientId}`;
                const linkDoc = await getDoc(doc(db, 'session_links', linkDocId));
                if (linkDoc.exists()) {
                    const link = linkDoc.data().meetLink || '';
                    setMeetLink(link);
                    setSavedMeetLink(link);
                }

            } catch (error) {
                console.error("Error fetching patient data:", error);
            } finally {
                setIsLoadingData(false);
            }
        }

        if (user) {
            fetchData();
        }
    }, [user, authLoading, router, patientId]);

    const handleSaveNote = async () => {
        if (!newNote.trim() || !user) return;

        setIsSaving(true);
        try {
            const noteData = {
                content: newNote,
                therapistId: user.id,
                clientId: patientId,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'patient_notes'), noteData);

            const newNoteObj: Note = {
                id: docRef.id,
                content: newNote,
                therapistId: user.id,
                clientId: patientId,
                createdAt: new Date(),
            };

            setNotes([newNoteObj, ...notes]);
            setNewNote('');
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Failed to save note");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await deleteDoc(doc(db, 'patient_notes', id));
            setNotes(notes.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error deleting note:", error);
            alert("Failed to delete note");
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!user) return;

        setIsUploading(true);
        try {
            // 1. Upload to Firebase Storage
            const storagePath = `therapist_uploads/${user.id}/${patientId}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Save metadata to Firestore
            const attachmentData = {
                name: file.name,
                type: file.type,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                url: downloadURL,
                storagePath: storagePath,
                therapistId: user.id,
                clientId: patientId,
                uploadedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'patient_attachments'), attachmentData);

            const newAttachment: Attachment = {
                id: docRef.id,
                ...attachmentData,
                uploadedAt: new Date(),
            } as Attachment;

            setAttachments([newAttachment, ...attachments]);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachment: Attachment) => {
        if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return;

        try {
            // 1. Delete from Storage
            if (attachment.storagePath) {
                const fileRef = ref(storage, attachment.storagePath);
                await deleteObject(fileRef).catch(err => console.log("File likely already deleted", err));
            }

            // 2. Delete from Firestore
            await deleteDoc(doc(db, 'patient_attachments', attachment.id));
            setAttachments(attachments.filter(a => a.id !== attachment.id));
        } catch (error) {
            console.error("Error deleting attachment:", error);
            alert("Failed to delete attachment");
        }
    };

    const handleDeletePatientHistory = async () => {
        if (!user) return;

        const confirmMsg = "Active Patient Removal Protocol:\\n\\nAre you sure you want to remove this patient's history?\\nThis will PERMANENTLY DELETE all sessions notes and uploaded files for this patient.\\n\\nType 'DELETE' to confirm.";
        const response = prompt(confirmMsg);

        if (response !== 'DELETE') {
            if (response !== null) alert("Deletion cancelled. You must type 'DELETE' exactly.");
            return;
        }

        setIsDeletingPatient(true);

        try {
            // 1. Delete all attachments (Storage + Firestore)
            for (const att of attachments) {
                if (att.storagePath) {
                    const fileRef = ref(storage, att.storagePath);
                    await deleteObject(fileRef).catch(e => console.warn("Skipping storage delete:", e));
                }
                await deleteDoc(doc(db, 'patient_attachments', att.id));
            }

            // 2. Delete all notes
            for (const note of notes) {
                await deleteDoc(doc(db, 'patient_notes', note.id));
            }

            alert("Patient history effectively wiped.");
            router.push('/therapist/patients');
        } catch (error) {
            console.error("Error deleting patient history:", error);
            alert("An error occurred during deletion. Some data may remain.");
        } finally {
            setIsDeletingPatient(false);
        }
    };

    const handleUpdateMeetLink = async () => {
        if (!user) return;
        const link = meetLink.trim();
        setSavingMeetLink(true);
        try {
            const linkDocId = `${user.id}_${patientId}`;
            const linkRef = doc(db, 'session_links', linkDocId);
            await setDoc(linkRef, {
                therapistId: user.id,
                clientId: patientId,
                meetLink: link,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            setSavedMeetLink(link);
        } catch (error) {
            console.error('Error updating meet link:', error);
            alert('Failed to save link. Please try again.');
        } finally {
            setSavingMeetLink(false);
        }
    };

    if (authLoading || isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--neutral-50)] flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-[var(--neutral-200)] px-4 sm:px-8 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/therapist/patients" className="p-2 hover:bg-[var(--neutral-100)] rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[var(--neutral-600)]" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-serif text-[var(--primary-700)] flex items-center gap-2">
                                {patient?.name || 'Patient'}
                                <span className="text-xs font-sans font-normal bg-[var(--primary-100)] text-[var(--primary-700)] px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            </h1>
                            <p className="text-xs text-[var(--neutral-500)]">ID: {patient?.id || patientId}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleDeletePatientHistory}
                        disabled={isDeletingPatient}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                    >
                        {isDeletingPatient ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <AlertTriangle className="w-3 h-3" />
                        )}
                        Delete Patient History
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8">
                {/* Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-white p-1 rounded-xl border border-[var(--neutral-200)] w-fit">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes'
                            ? 'bg-[var(--primary-100)] text-[var(--primary-700)]'
                            : 'text-[var(--neutral-500)] hover:text-[var(--neutral-700)]'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Session Notes
                    </button>
                    <button
                        onClick={() => setActiveTab('attachments')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'attachments'
                            ? 'bg-[var(--primary-100)] text-[var(--primary-700)]'
                            : 'text-[var(--neutral-500)] hover:text-[var(--neutral-700)]'
                            }`}
                    >
                        <Paperclip className="w-4 h-4" />
                        Attachments
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Column - PRIMARY CONTENT (Notes List) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* NOTES TAB CONTENT */}
                        {activeTab === 'notes' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-serif text-[var(--primary-800)]">Patient History</h3>

                                {/* Notes List - Now the main focus */}
                                <div className="space-y-6">
                                    {notes.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-[var(--neutral-200)]">
                                            <p className="text-[var(--neutral-400)]">No notes yet. Add one from the sidebar.</p>
                                        </div>
                                    ) : (
                                        notes.map((note) => (
                                            <div key={note.id} className="bg-white p-6 rounded-xl border border-[var(--neutral-100)] shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--neutral-50)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--primary-50)] flex items-center justify-center text-[var(--primary-600)]">
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-[var(--neutral-700)]">
                                                            {format(note.createdAt, 'MMMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 text-xs text-[var(--neutral-400)]">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{format(note.createdAt, 'h:mm a')}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Delete Note"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[var(--neutral-700)] leading-relaxed whitespace-pre-wrap text-base">
                                                    {note.content}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ATTACHMENTS TAB CONTENT */}
                        {activeTab === 'attachments' && (
                            <div className="space-y-6">
                                <label className="block cursor-pointer">
                                    <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-[var(--neutral-200)] hover:border-[var(--primary-300)] p-12 text-center transition-colors">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf,.docx,.doc"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file);
                                            }}
                                            disabled={isUploading}
                                        />
                                        <div className="w-16 h-16 bg-[var(--primary-50)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--primary-600)]">
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                            ) : (
                                                <Plus className="w-8 h-8" />
                                            )}
                                        </div>
                                        <h3 className="text-lg font-medium text-[var(--neutral-900)]">
                                            {isUploading ? 'Uploading...' : 'Upload a file or image'}
                                        </h3>
                                        <p className="text-sm text-[var(--neutral-500)] mt-2">
                                            Click to browse (Images, PDF, DOCX)
                                        </p>
                                    </div>
                                </label>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-[var(--neutral-500)] uppercase tracking-wider">Attached Files</h3>
                                    {attachments.length === 0 ? (
                                        <p className="text-sm text-[var(--neutral-400)] italic">No attachments yet.</p>
                                    ) : (
                                        attachments.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-[var(--neutral-100)] shadow-sm group">
                                                <div className="flex items-center gap-4">
                                                    {file.type.startsWith('image/') ? (
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--neutral-100)] border border-[var(--neutral-200)]">
                                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 bg-[var(--primary-50)] rounded-lg flex items-center justify-center text-[var(--primary-600)]">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-[var(--neutral-900)]">{file.name}</p>
                                                        <p className="text-xs text-[var(--neutral-500)] mt-0.5">
                                                            {file.size} • {format(file.uploadedAt, 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => window.open(file.url, '_blank')}
                                                        className="text-[var(--primary-600)] hover:text-[var(--primary-800)] text-sm font-medium px-3 py-1 hover:bg-[var(--primary-50)] rounded-md transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAttachment(file)}
                                                        className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete File"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - SECONDARY (Actions & Add Note) */}
                    <div className="space-y-6">
                        {/* Quick Add Note Widget */}
                        {activeTab === 'notes' && (
                            <div className="bg-white rounded-xl shadow-sm border border-[var(--neutral-200)] p-5 sticky top-24">
                                <h3 className="text-sm font-medium text-[var(--neutral-900)] mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[var(--primary-600)]" />
                                    Add Session Note
                                </h3>
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Type note here..."
                                    className="w-full h-40 p-3 text-sm border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] resize-none mb-3 bg-[var(--neutral-50)]"
                                />
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!newNote.trim() || isSaving}
                                    className="w-full btn btn-primary text-sm flex items-center justify-center"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save to History'}
                                </button>
                            </div>
                        )}

                        {/* Session Link */}
                        <div className="bg-white rounded-xl shadow-sm border border-[var(--neutral-200)] p-5">
                            <h3 className="text-sm font-medium text-[var(--neutral-900)] mb-3 flex items-center gap-2">
                                <Video className="w-4 h-4 text-[var(--primary-600)]" />
                                Session Link
                            </h3>
                            <p className="text-xs text-[var(--neutral-500)] mb-3">
                                Add a Google Meet link for sessions with this patient. They&apos;ll see it on their bookings page.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="Paste Google Meet link..."
                                    value={meetLink}
                                    onChange={e => setMeetLink(e.target.value)}
                                    className="flex-1 text-sm px-3 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-400)] bg-[var(--neutral-50)]"
                                />
                                <button
                                    onClick={handleUpdateMeetLink}
                                    disabled={savingMeetLink || meetLink.trim() === savedMeetLink}
                                    className="px-3 py-2 bg-[var(--primary-100)] text-[var(--primary-700)] rounded-lg hover:bg-[var(--primary-200)] transition-colors disabled:opacity-50 text-sm font-medium"
                                    title="Save link"
                                >
                                    {savingMeetLink ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : savedMeetLink ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                            {savedMeetLink && (
                                <a
                                    href={savedMeetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-[var(--secondary-600)] hover:text-[var(--secondary-700)] mt-2"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Open current link
                                </a>
                            )}
                        </div>

                        {/* Other Actions - Pushed down */}
                        <div className="bg-white rounded-xl shadow-sm border border-[var(--neutral-200)] p-5">
                            <h3 className="text-sm font-medium text-[var(--neutral-900)] mb-4">Quick Actions</h3>
                            <button className="w-full btn btn-secondary text-sm justify-start mb-2">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Session
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
