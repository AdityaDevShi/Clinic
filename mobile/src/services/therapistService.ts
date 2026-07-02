import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BusySlot, ManualPatient, PatientNote, PatientAttachment, Therapist } from '@/lib/types';
import { generateAvailabilityFromHours } from '@/lib/availability';

export const TherapistService = {
    /** Mark a session as completed. */
    async markCompleted(bookingId: string): Promise<void> {
        await updateDoc(doc(db, 'bookings', bookingId), {
            status: 'completed',
            updatedAt: Timestamp.now(),
        });
    },

    // ── Availability blocking ────────────────────────────────────────────
    subscribeToBusySlots(therapistId: string, callback: (slots: BusySlot[]) => void): () => void {
        const q = query(collection(db, 'busy_slots'), where('therapistId', '==', therapistId));
        return onSnapshot(q, (snapshot) => {
            callback(
                snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    startTime: d.data().startTime.toDate(),
                    endTime: d.data().endTime.toDate(),
                } as BusySlot))
            );
        });
    },

    async blockSlot(therapistId: string, start: Date, end: Date, reason = 'Therapist Blocked'): Promise<void> {
        await addDoc(collection(db, 'busy_slots'), {
            therapistId,
            startTime: Timestamp.fromDate(start),
            endTime: Timestamp.fromDate(end),
            reason,
            createdAt: Timestamp.now(),
        });
    },

    async unblockSlot(busySlotId: string): Promise<void> {
        await deleteDoc(doc(db, 'busy_slots', busySlotId));
    },

    // ── Manual patients ──────────────────────────────────────────────────
    async getManualPatients(therapistId: string): Promise<ManualPatient[]> {
        const snap = await getDocs(query(collection(db, 'manual_patients'), where('therapistId', '==', therapistId)));
        return snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || new Date(),
        } as ManualPatient));
    },

    async addManualPatient(therapistId: string, name: string, email?: string, phone?: string): Promise<void> {
        await addDoc(collection(db, 'manual_patients'), {
            therapistId,
            name,
            email: email || '',
            phone: phone || '',
            createdAt: Timestamp.now(),
        });
    },

    // ── Patient notes ────────────────────────────────────────────────────
    async getNotes(therapistId: string, clientId: string): Promise<PatientNote[]> {
        const snap = await getDocs(
            query(
                collection(db, 'patient_notes'),
                where('therapistId', '==', therapistId),
                where('clientId', '==', clientId)
            )
        );
        return snap.docs
            .map((d) => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            } as PatientNote))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async addNote(therapistId: string, clientId: string, content: string): Promise<void> {
        await addDoc(collection(db, 'patient_notes'), {
            therapistId,
            clientId,
            content,
            createdAt: Timestamp.now(),
        });
    },

    async deleteNote(noteId: string): Promise<void> {
        await deleteDoc(doc(db, 'patient_notes', noteId));
    },

    // ── Attachments (metadata; file upload lives in the screen) ───────────
    async getAttachments(therapistId: string, clientId: string): Promise<PatientAttachment[]> {
        const snap = await getDocs(
            query(
                collection(db, 'patient_attachments'),
                where('therapistId', '==', therapistId),
                where('clientId', '==', clientId)
            )
        );
        return snap.docs
            .map((d) => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            } as PatientAttachment))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async addAttachment(meta: Omit<PatientAttachment, 'id' | 'createdAt'>): Promise<void> {
        await addDoc(collection(db, 'patient_attachments'), {
            ...meta,
            createdAt: Timestamp.now(),
        });
    },

    // ── Session link (Google Meet), doc id `${therapistId}_${clientId}` ──
    async getSessionLink(therapistId: string, clientId: string): Promise<string> {
        const snap = await getDoc(doc(db, 'session_links', `${therapistId}_${clientId}`));
        return snap.exists() ? (snap.data().meetLink || '') : '';
    },

    async setSessionLink(therapistId: string, clientId: string, meetLink: string): Promise<void> {
        await setDoc(
            doc(db, 'session_links', `${therapistId}_${clientId}`),
            { therapistId, clientId, meetLink, updatedAt: Timestamp.now() },
            { merge: true }
        );
    },

    // ── Profile + availability regeneration ──────────────────────────────
    async saveProfile(therapistId: string, data: Partial<Therapist>): Promise<void> {
        await setDoc(doc(db, 'therapists', therapistId), { ...data, updatedAt: Timestamp.now() }, { merge: true });
    },

    /** Wipe and regenerate the therapist's weekly availability from working hours. */
    async regenerateAvailability(
        therapistId: string,
        workingHoursStart: string,
        workingHoursEnd: string,
        lunchBreakStart: string
    ): Promise<void> {
        const existing = await getDocs(query(collection(db, 'availability'), where('therapistId', '==', therapistId)));
        const batch = writeBatch(db);
        existing.forEach((d) => batch.delete(d.ref));

        const newSlots = generateAvailabilityFromHours(therapistId, workingHoursStart, workingHoursEnd, lunchBreakStart);
        newSlots.forEach((slot) => {
            batch.set(doc(db, 'availability', slot.id), slot);
        });
        await batch.commit();
    },
};
