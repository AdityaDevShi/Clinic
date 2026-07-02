import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { User, UserRole } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(fbUser: FirebaseUser): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: data.name || '',
        role: (data.role as UserRole) || 'client',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        photoUrl: data.photoUrl,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                try {
                    setUser(await fetchUserProfile(fbUser));
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Populate profile immediately so the role gate can route without
        // waiting for the auth listener round-trip.
        setUser(await fetchUserProfile(cred.user));
    };

    const signup = async (email: string, password: string, name: string) => {
        setError(null);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // users collection is server-create-only — same secure endpoint as web.
        await api.registerProfile({ uid: cred.user.uid, email: cred.user.email, name });
        setUser(await fetchUserProfile(cred.user));
    };

    const logout = async () => {
        setError(null);
        await signOut(auth);
        setUser(null);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{ user, firebaseUser, loading, error, login, signup, logout, clearError }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
