import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist } from '@/lib/types';

/** Live list of enabled therapists, sorted like the website (displayOrder, then name). */
export function useTherapists() {
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'therapists'), where('isEnabled', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Therapist));
            list.sort((a, b) => {
                const orderA = a.displayOrder ?? 9999;
                const orderB = b.displayOrder ?? 9999;
                if (orderA !== orderB) return orderA - orderB;
                return (a.name || '').localeCompare(b.name || '');
            });
            setTherapists(list);
            setLoading(false);
        }, (error) => {
            console.error('Error loading therapists:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { therapists, loading };
}
