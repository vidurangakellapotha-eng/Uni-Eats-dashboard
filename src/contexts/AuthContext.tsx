import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);
const googleProvider = new GoogleAuthProvider();

// Check if a user is an admin in Firestore
async function checkAdminRole(user: User): Promise<boolean> {
    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) return true;

        // First-ever login: auto-grant admin to your specific account
        // Remove this block after you've set up your admin account
        const OWNER_EMAIL = 'vidurangakellapotha@gmail.com';
        if (user.email === OWNER_EMAIL) {
            await setDoc(doc(db, 'admins', user.uid), {
                email: user.email,
                name: user.displayName || 'Admin',
                grantedAt: new Date().toISOString()
            });
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const adminStatus = await checkAdminRole(firebaseUser);
                setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            const code = err.code as string;
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                setError('Invalid email or password.');
            } else if (code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Login failed. Please try again.');
            }
            throw err;
        }
    };

    const loginWithGoogle = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Google sign-in failed. Please try again.');
            }
            throw err;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isAdmin,
            login,
            loginWithGoogle,
            logout,
            loading,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
