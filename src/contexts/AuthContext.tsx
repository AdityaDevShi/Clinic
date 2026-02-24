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

// Track active presence interval to avoid duplicates
let heartbeatInterval: NodeJS.Timeout | null = null;
let currentTherapistId: string | null = null;

const handleBeforeUnload = () => {
    if (currentTherapistId) {
        try {
            // Explicitly mark this as an unload event so the serverless function handles it immediately
            const data = JSON.stringify({ therapistId: currentTherapistId, isUnload: true });
            navigator.sendBeacon('/api/presence/offline', data);
        } catch (e) {
            console.error('sendBeacon failed:', e);
        }
    }
};

/**
 * Starts a periodic heartbeat to the server API to maintain online presence.
 */
function startHeartbeat(therapistId: string) {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    currentTherapistId = therapistId;

    // Send immediately on login
    sendHeartbeat(therapistId);

    // Ping every 15 seconds to ensure we stay well under the 35s server death threshold
    heartbeatInterval = setInterval(() => {
        if (currentTherapistId === therapistId) {
            sendHeartbeat(therapistId);
        }
    }, 15000);

    // Only trigger immediate offline when the user actually closes the tab or refreshes.
    // 'beforeunload' works most consistently across desktop and mobile production environments.
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    currentTherapistId = null;
    window.removeEventListener('beforeunload', handleBeforeUnload);
}

function sendHeartbeat(therapistId: string) {
    fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapistId }),
        keepalive: true
    }).catch((e) => console.error('Heartbeat failed:', e));
}

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
                stopHeartbeat();
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

                        // Start sending heartbeats to API
                        if (role === 'therapist') {
                            startHeartbeat(firebaseUser.uid);
                        }
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

            // Fetch user role to determine if we need to update therapist status
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists() && userDoc.data().role === 'therapist') {
                // Set online status immediately on login (heartbeat will maintain it)

                // Set online status
                const therapistRef = doc(db, 'therapists', firebaseUser.uid);
                await setDoc(therapistRef, {
                    isOnline: true,
                    lastOnline: serverTimestamp(),
                    currentSessionStart: serverTimestamp()
                }, { merge: true });
            }
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
            let role: UserRole = 'client';

            // Auto-promote specific email to admin
            if (email === 'care@arambh.net') {
                role = 'admin';
            } else {
                // Check for pre-existing therapist invite
                const therapistsRef = collection(db, 'therapists');
                const q = query(therapistsRef, where('email', '==', email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const inviteDoc = querySnapshot.docs[0];
                    const inviteData = inviteDoc.data();

                    console.log('Found therapist invite, linking account...');
                    role = 'therapist';

                    // Migrate pre-filled data to the new Auth UID document
                    await setDoc(doc(db, 'therapists', firebaseUser.uid), {
                        ...inviteData,
                        id: firebaseUser.uid, // IMPORTANT: The doc ID must match Auth UID
                        updatedAt: serverTimestamp()
                    });

                    // Delete the temporary admin-created document
                    await deleteDoc(inviteDoc.ref);
                }
            }

            // Create user document in Firestore
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                name,
                role,
                createdAt: serverTimestamp(),
            });
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
            // Set offline before signing out (if user is currently logged in as therapist)
            // We can check the local 'user' state
            if (user && user.role === 'therapist') {
                try {
                    const therapistRef = doc(db, 'therapists', user.id);

                    // Fetch to get session start for logging work
                    const currentDoc = await getDoc(therapistRef);
                    if (currentDoc.exists()) {
                        const data = currentDoc.data();
                        // Only if currently online
                        if (data.isOnline) {
                            const sessionStart = data.currentSessionStart;
                            if (sessionStart) {
                                const startTime = sessionStart.toDate();
                                const endTime = new Date();
                                const duration = differenceInMinutes(endTime, startTime);

                                if (duration > 0) {
                                    await addDoc(collection(db, 'work_logs'), {
                                        therapistId: user.id,
                                        startTime: sessionStart,
                                        endTime: Timestamp.fromDate(endTime),
                                        durationMinutes: duration,
                                        createdAt: serverTimestamp()
                                    });
                                }
                            }
                        }
                    }

                    await setDoc(therapistRef, {
                        isOnline: false,
                        lastOnline: serverTimestamp(),
                        currentSessionStart: null
                    }, { merge: true });
                } catch (e) {
                    console.error("Failed to update offline status", e);
                }
            }

            await signOut(auth);
            stopHeartbeat();
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
