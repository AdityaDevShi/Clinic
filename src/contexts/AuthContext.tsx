'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';
import { differenceInMinutes } from 'date-fns';

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Guard for server-side rendering
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Force logout for blocked admin
            if (firebaseUser && firebaseUser.email === 'a@gmail.com') {
                await signOut(auth);
                setFirebaseUser(null);
                setUser(null);
                setLoading(false);
                return;
            }

            setFirebaseUser(firebaseUser);

            if (firebaseUser && db) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        let role = userData.role as UserRole;

                        // Self-healing: Ensure care@arambh.net is always admin
                        if (firebaseUser.email === 'care@arambh.net' && role !== 'admin') {
                            console.log('Auto-promoting care@arambh.net to admin...');
                            await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }, { merge: true });
                            role = 'admin';
                        }

                        const resolvedUser: User = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: userData.name || '',
                            role: role,
                            createdAt: userData.createdAt?.toDate() || new Date(),
                            photoUrl: userData.photoUrl,
                        };
                        setUser(resolvedUser);
                    } else {
                        // User exists in Auth but not in Firestore (restore missing doc)
                        if (firebaseUser.email === 'care@arambh.net') {
                            console.log('Restoring missing admin user doc...');
                            const role = 'admin';
                            await setDoc(doc(db, 'users', firebaseUser.uid), {
                                email: firebaseUser.email,
                                role,
                                createdAt: serverTimestamp(),
                            });
                            setUser({
                                id: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: 'Administrator',
                                role,
                                createdAt: new Date()
                            });
                        } else {
                            setUser(null);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching user data:', err);
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
        if (!auth) {
            throw new Error('Authentication not available');
        }

        // Block old admin account
        if (email === 'a@gmail.com') {
            throw new Error('This account has been disabled. Please use the new admin email.');
        }

        setError(null);
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to login';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        if (!auth || !db) {
            throw new Error('Authentication not available');
        }
        setError(null);
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 1. Get the Firebase ID token
            const idToken = await firebaseUser.getIdToken();

            // 2. Call our secure backend to handle role assignment and Firestore document creation
            const response = await fetch('/api/auth/register-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Pass token for backend verification
                },
                body: JSON.stringify({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: name
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user profile securely');
            }


        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        if (!auth) {
            return;
        }
        setError(null);
        try {
            await signOut(auth);
            setUser(null);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
            setError(errorMessage);
            throw err;
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                error,
                login,
                signup,
                logout,
                clearError,
            }}
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
