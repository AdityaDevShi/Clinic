'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/types';
import { format } from 'date-fns';
import {
    ArrowLeft,
    User,
    Calendar,
    Clock,
    FileText,
    Search,
    Loader2,
    XCircle,
    Trash2,
    Plus,
    X,
    Mail,
    Phone,
    UserPlus
} from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

interface Patient {
    id: string;
    name: string;
    email: string;
    phone?: string;
    totalSessions: number;
    lastSession: Date | null;
    upcomingSessions: number;
    isManual?: boolean; // true if manually added by therapist (pre-existing patient)
}

export default function TherapistPatientsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [removingPatientId, setRemovingPatientId] = useState<string | null>(null);

    // Add Patient Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', phone: '' });
    const [addingPatient, setAddingPatient] = useState(false);
    const [addError, setAddError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'therapist' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchPatients() {
            if (!user) return;

            try {
                // 1. Fetch patients from bookings (existing flow)
                const patientMap = new Map<string, Patient>();

                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('therapistId', '==', user.id)
                );
                const bookingsDocs = await getDocs(bookingsQuery);

                bookingsDocs.docs.forEach((bookingDoc) => {
                    const booking = bookingDoc.data() as Booking;
                    const existing = patientMap.get(booking.clientId);

                    const sessionTime = booking.sessionTime instanceof Date
                        ? booking.sessionTime
                        : new Date((booking.sessionTime as { seconds: number }).seconds * 1000);

                    if (existing) {
                        existing.totalSessions++;
                        if (booking.status === 'completed' && (!existing.lastSession || sessionTime > existing.lastSession)) {
                            existing.lastSession = sessionTime;
                        }
                        if (sessionTime > new Date() && booking.status !== 'cancelled') {
                            existing.upcomingSessions++;
                        }
                    } else {
                        patientMap.set(booking.clientId, {
                            id: booking.clientId,
                            name: booking.clientName,
                            email: booking.clientEmail,
                            totalSessions: 1,
                            lastSession: booking.status === 'completed' ? sessionTime : null,
                            upcomingSessions: sessionTime > new Date() && booking.status !== 'cancelled' ? 1 : 0,
                            isManual: false,
                        });
                    }
                });

                // 2. Fetch manually added patients
                const manualQuery = query(
                    collection(db, 'manual_patients'),
                    where('therapistId', '==', user.id)
                );
                const manualDocs = await getDocs(manualQuery);

                manualDocs.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const manualId = `manual_${docSnap.id}`;

                    // Don't add if this email already exists from bookings
                    const alreadyExists = Array.from(patientMap.values()).some(
                        p => p.email && data.email && p.email.toLowerCase() === data.email.toLowerCase()
                    );

                    if (!alreadyExists) {
                        patientMap.set(manualId, {
                            id: manualId,
                            name: data.name || 'Unknown',
                            email: data.email || '',
                            phone: data.phone || '',
                            totalSessions: 0,
                            lastSession: null,
                            upcomingSessions: 0,
                            isManual: true,
                        });
                    }
                });

                setPatients(Array.from(patientMap.values()));
            } catch (error) {
                console.log('Error fetching patients:', error);
                setPatients([]);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchPatients();
        }
    }, [user, authLoading, router]);

    const filteredPatients = patients.filter((patient) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        const name = patient.name || '';
        const email = patient.email || '';
        const phone = patient.phone || '';

        return (
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term) ||
            phone.includes(term)
        );
    });

    const handleRemovePatient = async (patient: Patient) => {
        const confirmed = confirm(
            patient.isManual
                ? `Are you sure you want to remove ${patient.name}?\n\nThis will remove them from your patient list.\n\nThis action cannot be undone.`
                : `Are you sure you want to remove ${patient.name}?\n\nThis will:\n• Cancel all upcoming bookings\n• Delete session notes and attachments\n\nThis action cannot be undone.`
        );
        if (!confirmed || !user) return;

        setRemovingPatientId(patient.id);
        try {
            if (patient.isManual) {
                // Remove from manual_patients collection
                const firestoreId = patient.id.replace('manual_', '');
                await deleteDoc(doc(db, 'manual_patients', firestoreId));
            } else {
                // 1. Cancel all non-cancelled bookings for this patient with this therapist
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('therapistId', '==', user.id),
                    where('clientId', '==', patient.id)
                );
                const bookingsDocs = await getDocs(bookingsQuery);
                const cancelPromises = bookingsDocs.docs
                    .filter(d => d.data().status !== 'cancelled')
                    .map(d => updateDoc(doc(db, 'bookings', d.id), { status: 'cancelled' }));
                await Promise.all(cancelPromises);

                // 2. Delete patient notes
                const notesQuery = query(
                    collection(db, 'patient_notes'),
                    where('therapistId', '==', user.id),
                    where('clientId', '==', patient.id)
                );
                const notesDocs = await getDocs(notesQuery);
                await Promise.all(notesDocs.docs.map(d => deleteDoc(doc(db, 'patient_notes', d.id))));

                // 3. Delete patient attachments
                const attachQuery = query(
                    collection(db, 'patient_attachments'),
                    where('therapistId', '==', user.id),
                    where('clientId', '==', patient.id)
                );
                const attachDocs = await getDocs(attachQuery);
                await Promise.all(attachDocs.docs.map(d => deleteDoc(doc(db, 'patient_attachments', d.id))));
            }

            // Remove from local state
            setPatients(prev => prev.filter(p => p.id !== patient.id));
            alert(`${patient.name} has been removed.`);
        } catch (error: any) {
            console.error('Error removing patient:', error);
            alert('Failed to remove patient: ' + (error.message || 'Unknown error'));
        } finally {
            setRemovingPatientId(null);
        }
    };

    const handleAddPatient = async () => {
        setAddError('');

        if (!addForm.name.trim()) {
            setAddError('Patient name is required.');
            return;
        }

        if (!user) return;

        setAddingPatient(true);
        try {
            // Check if patient with same email already exists (if email provided)
            if (addForm.email.trim()) {
                const exists = patients.some(
                    p => p.email && p.email.toLowerCase() === addForm.email.trim().toLowerCase()
                );
                if (exists) {
                    setAddError('A patient with this email already exists in your list.');
                    setAddingPatient(false);
                    return;
                }
            }

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'manual_patients'), {
                therapistId: user.id,
                name: addForm.name.trim(),
                email: addForm.email.trim() || '',
                phone: addForm.phone.trim() || '',
                createdAt: Timestamp.now(),
            });

            // Add to local state
            const newPatient: Patient = {
                id: `manual_${docRef.id}`,
                name: addForm.name.trim(),
                email: addForm.email.trim(),
                phone: addForm.phone.trim(),
                totalSessions: 0,
                lastSession: null,
                upcomingSessions: 0,
                isManual: true,
            };
            setPatients(prev => [newPatient, ...prev]);

            // Reset form and close
            setAddForm({ name: '', email: '', phone: '' });
            setShowAddModal(false);
        } catch (error: any) {
            console.error('Error adding patient:', error);
            setAddError('Failed to add patient. Please try again.');
        } finally {
            setAddingPatient(false);
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
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/therapist/dashboard"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <h1 className="font-serif text-3xl text-[var(--primary-700)]">
                                My Patients
                            </h1>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input !pl-14 py-2 text-sm w-full sm:w-56"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn btn-primary py-2 px-4 text-sm flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Patient
                                </button>
                            </div>
                        </motion.div>

                        {/* Patients List */}
                        <div className="space-y-4">
                            {filteredPatients.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 bg-[var(--neutral-100)] rounded-full flex items-center justify-center">
                                            {searchTerm ? (
                                                <Search className="w-6 h-6 text-[var(--neutral-400)]" />
                                            ) : (
                                                <UserPlus className="w-6 h-6 text-[var(--neutral-400)]" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-[var(--primary-700)] mb-2">
                                        {searchTerm ? 'No patients found' : 'No patients yet'}
                                    </h3>
                                    <p className="text-[var(--neutral-500)] mb-6">
                                        {searchTerm
                                            ? `We couldn't find any patients matching "${searchTerm}"`
                                            : 'Add your pre-existing patients or they\'ll appear here when they book sessions.'
                                        }
                                    </p>
                                    {searchTerm ? (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="btn btn-secondary px-6"
                                        >
                                            Clear Search
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="btn btn-primary px-6 flex items-center gap-2 mx-auto"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Your First Patient
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${patient.isManual ? 'bg-amber-100' : 'bg-[var(--primary-100)]'}`}>
                                                    <User className={`w-6 h-6 ${patient.isManual ? 'text-amber-600' : 'text-[var(--primary-600)]'}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium text-[var(--primary-700)]">
                                                            {patient.name}
                                                        </h3>
                                                        {patient.isManual && (
                                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                                                Pre-existing
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-[var(--neutral-500)]">
                                                        {patient.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {patient.email}
                                                            </span>
                                                        )}
                                                        {patient.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {patient.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                {!patient.isManual && (
                                                    <>
                                                        <div className="flex items-center text-[var(--neutral-500)]">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            <span>{patient.totalSessions} sessions</span>
                                                        </div>
                                                        {patient.lastSession && (
                                                            <div className="flex items-center text-[var(--neutral-500)]">
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                <span>Last: {format(patient.lastSession, 'MMM d')}</span>
                                                            </div>
                                                        )}
                                                        {patient.upcomingSessions > 0 && (
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                                {patient.upcomingSessions} upcoming
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!patient.isManual && (
                                                    <Link
                                                        href={`/therapist/patients/${patient.id}`}
                                                        className="btn btn-secondary py-2 px-4 text-sm flex items-center"
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        View Notes
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleRemovePatient(patient)}
                                                    disabled={removingPatientId === patient.id}
                                                    className="py-2 px-3 text-sm flex items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    title="Remove patient"
                                                >
                                                    {removingPatientId === patient.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Add Patient Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowAddModal(false);
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 text-[var(--primary-600)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-serif font-semibold text-[var(--primary-800)]">Add Patient</h2>
                                        <p className="text-xs text-[var(--neutral-500)]">Add a pre-existing patient to your list</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowAddModal(false); setAddError(''); }}
                                    disabled={addingPatient}
                                    className="p-2 rounded-full hover:bg-[var(--neutral-200)] transition-colors disabled:opacity-50"
                                >
                                    <X className="w-5 h-5 text-[var(--neutral-500)]" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-4">
                                {addError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                        {addError}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="patient-name" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                                        Patient Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="patient-name"
                                        type="text"
                                        value={addForm.name}
                                        onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Full name"
                                        className="input bg-white"
                                        autoFocus
                                        disabled={addingPatient}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="patient-email" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                                        Email <span className="text-[var(--neutral-400)] text-xs font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        id="patient-email"
                                        type="email"
                                        value={addForm.email}
                                        onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="patient@example.com"
                                        className="input bg-white"
                                        disabled={addingPatient}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="patient-phone" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                                        Phone <span className="text-[var(--neutral-400)] text-xs font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        id="patient-phone"
                                        type="tel"
                                        value={addForm.phone}
                                        onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="input bg-white"
                                        disabled={addingPatient}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-[var(--neutral-200)] bg-[var(--neutral-50)] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => { setShowAddModal(false); setAddError(''); setAddForm({ name: '', email: '', phone: '' }); }}
                                    disabled={addingPatient}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--neutral-600)] hover:bg-[var(--neutral-200)] transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddPatient}
                                    disabled={addingPatient || !addForm.name.trim()}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    {addingPatient ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Add Patient
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
