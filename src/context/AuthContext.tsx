import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    type User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserService } from '../services/UserService';
import { InvitationService } from '../services/InvitationService';
import type { UserProfile } from '../types/auth';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string, invitationCode: string) => Promise<void>;
    signInWithGoogle: (invitationCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger le profil utilisateur depuis Firestore
    const loadUserProfile = async (firebaseUser: User) => {
        try {
            const profile = await UserService.getById(firebaseUser.uid);
            setUserProfile(profile);
        } catch (err) {
            console.error('Error loading user profile:', err);
        }
    };

    // Écouter les changements d'état d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await loadUserProfile(currentUser);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Connexion avec email/password
    const signInWithEmail = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            const errorMessage = getFirebaseErrorMessage(err.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Inscription avec email/password (code d'invitation optionnel)
    const signUpWithEmail = async (
        email: string,
        password: string,
        displayName: string,
        invitationCode: string = ''
    ) => {
        setLoading(true);
        setError(null);
        try {
            let invitation = null;

            // Si un code d'invitation est fourni, le valider
            if (invitationCode && invitationCode.trim()) {
                const validation = await InvitationService.validateCode(invitationCode);
                if (!validation.valid || !validation.invitation) {
                    throw new Error(validation.error || 'Code d\'invitation invalide');
                }

                // Vérifier que l'email correspond (si spécifié dans l'invitation)
                if (validation.invitation.email && validation.invitation.email !== email.toLowerCase()) {
                    throw new Error('Cet email ne correspond pas à l\'invitation');
                }

                invitation = validation.invitation;
            }

            // Créer le compte Firebase
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // Mettre à jour le profil Firebase
            await updateProfile(credential.user, { displayName });

            // Créer le profil utilisateur dans Firestore
            await UserService.create(credential.user.uid, email, displayName);

            // Marquer l'invitation comme utilisée (si fournie)
            if (invitation) {
                await InvitationService.markAsUsed(invitation.id);
            }

        } catch (err: any) {
            const errorMessage = err.message || getFirebaseErrorMessage(err.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Connexion avec Google
    const signInWithGoogle = async (invitationCode?: string) => {
        setLoading(true);
        setError(null);
        try {
            // Si un code est fourni, le valider d'abord
            let invitation = null;
            if (invitationCode) {
                const validation = await InvitationService.validateCode(invitationCode);
                if (!validation.valid || !validation.invitation) {
                    throw new Error(validation.error || 'Code d\'invitation invalide');
                }
                invitation = validation.invitation;
            }

            const result = await signInWithPopup(auth, googleProvider);
            const { user: googleUser } = result;

            // Vérifier si l'utilisateur existe déjà
            let profile = await UserService.getById(googleUser.uid);

            if (!profile) {
                // Nouvel utilisateur - créer le profil
                // Si une invitation est fournie, vérifier l'email
                if (invitation && invitation.email && invitation.email !== googleUser.email?.toLowerCase()) {
                    await signOut(auth);
                    throw new Error('Cet email ne correspond pas à l\'invitation');
                }

                // Créer le profil
                await UserService.create(
                    googleUser.uid,
                    googleUser.email || '',
                    googleUser.displayName || 'Utilisateur'
                );

                // Marquer l'invitation comme utilisée (si fournie)
                if (invitation) {
                    await InvitationService.markAsUsed(invitation.id);
                }
            }

        } catch (err: any) {
            const errorMessage = err.message || getFirebaseErrorMessage(err.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Déconnexion
    const logout = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
        } catch (err: any) {
            console.error('Error signing out:', err);
        }
    };

    // Réinitialisation du mot de passe
    const resetPassword = async (email: string) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            const errorMessage = getFirebaseErrorMessage(err.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Effacer l'erreur
    const clearError = () => setError(null);

    // Rafraîchir le profil
    const refreshUserProfile = async () => {
        if (user) {
            await loadUserProfile(user);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                error,
                signInWithEmail,
                signUpWithEmail,
                signInWithGoogle,
                logout,
                resetPassword,
                clearError,
                refreshUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper pour traduire les erreurs Firebase
function getFirebaseErrorMessage(code: string): string {
    const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé',
        'auth/invalid-email': 'Email invalide',
        'auth/operation-not-allowed': 'Opération non autorisée',
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
        'auth/user-disabled': 'Ce compte a été désactivé',
        'auth/user-not-found': 'Aucun compte trouvé avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-credential': 'Identifiants invalides',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
        'auth/popup-closed-by-user': 'Connexion annulée',
        'auth/popup-blocked': 'Popup bloquée par le navigateur',
    };
    return messages[code] || 'Une erreur est survenue';
}
