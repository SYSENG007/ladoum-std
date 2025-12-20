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
import { StaffService } from '../services/StaffService';
import { FarmService } from '../services/FarmService';
import type { UserProfile } from '../types/auth';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string, staffToken?: string) => Promise<void>;
    signInWithGoogle: (staffToken?: string) => Promise<void>;
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

    // Inscription avec email/password (staff token optionnel)
    const signUpWithEmail = async (
        email: string,
        password: string,
        displayName: string,
        staffToken: string = ''
    ) => {
        setLoading(true);
        setError(null);
        try {
            let staffInv = null;

            // Valider le token staff si fourni
            if (staffToken && staffToken.trim()) {
                const inv = await StaffService.getByToken(staffToken);
                if (!inv) {
                    throw new Error('Lien d\'invitation invalide ou expiré');
                }
                if (inv.email.toLowerCase() !== email.toLowerCase()) {
                    throw new Error('Cet email ne correspond pas à l\'invitation');
                }
                staffInv = inv;
            }

            // Créer le compte Firebase
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // Mettre à jour le profil Firebase
            await updateProfile(credential.user, { displayName });

            // Créer le profil utilisateur dans Firestore
            const userId = credential.user.uid;

            if (staffInv) {
                // Flow Staff: Rejoindre directement la ferme et passer l'onboarding
                await UserService.create(userId, email, displayName);

                // Ajouter à la ferme
                await FarmService.addMember(staffInv.farmId, {
                    userId,
                    displayName,
                    email: staffInv.email,
                    role: staffInv.role,
                    canAccessFinances: staffInv.canAccessFinances,
                    status: 'active',
                    joinedAt: new Date().toISOString()
                });

                // Marquer l'invitation comme acceptée
                await StaffService.acceptInvitation(staffInv.id, userId);

                // Configurer la ferme de l'utilisateur et marquer l'onboarding terminé
                await UserService.setFarm(userId, staffInv.farmId, staffInv.role);
                await UserService.completeOnboarding(userId);
            } else {
                // Flow Normal / Owner - créer profil sans ferme
                await UserService.create(userId, email, displayName);
            }

            // Rafraîchir le profil
            await loadUserProfile(credential.user);

        } catch (err: any) {
            const errorMessage = err.message || getFirebaseErrorMessage(err.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Connexion avec Google
    const signInWithGoogle = async (staffToken?: string) => {
        setLoading(true);
        setError(null);
        try {
            // Valider le token staff si fourni
            let staffInv = null;

            if (staffToken) {
                const inv = await StaffService.getByToken(staffToken);
                if (!inv) {
                    throw new Error('Lien d\'invitation invalide ou expiré');
                }
                staffInv = inv;
            }

            const result = await signInWithPopup(auth, googleProvider);
            const { user: googleUser } = result;

            // 2. Vérifier si l'utilisateur existe déjà
            let profile = await UserService.getById(googleUser.uid);

            if (!profile) {
                // Nouvel utilisateur - créer le profil
                const email = googleUser.email?.toLowerCase() || '';
                const displayName = googleUser.displayName || 'Utilisateur';

                // Si une invitation staff est fournie, vérifier l'email
                if (staffInv && staffInv.email.toLowerCase() !== email) {
                    await signOut(auth);
                    throw new Error('Cet email ne correspond pas à l\'invitation');
                }

                if (staffInv) {
                    // Flow Staff direct
                    await UserService.create(googleUser.uid, email, displayName);
                    await FarmService.addMember(staffInv.farmId, {
                        userId: googleUser.uid,
                        displayName,
                        email,
                        role: staffInv.role,
                        canAccessFinances: staffInv.canAccessFinances,
                        status: 'active',
                        joinedAt: new Date().toISOString()
                    });
                    await StaffService.acceptInvitation(staffInv.id, googleUser.uid);
                    await UserService.setFarm(googleUser.uid, staffInv.farmId, staffInv.role);
                    await UserService.completeOnboarding(googleUser.uid);
                } else {
                    // Créer le profil normal sans invitation
                    await UserService.create(googleUser.uid, email, displayName);
                }
            } else if (staffInv) {
                // Utilisateur existant rejoignant une ferme via token
                const userId = googleUser.uid;

                // Vérifier s'il est déjà membre (doublon possible si on ne check pas)
                const farm = await FarmService.getById(staffInv.farmId);
                const alreadyMember = farm?.members.some(m => m.userId === userId);

                if (!alreadyMember) {
                    await FarmService.addMember(staffInv.farmId, {
                        userId,
                        displayName: profile.displayName,
                        email: profile.email,
                        role: staffInv.role,
                        canAccessFinances: staffInv.canAccessFinances,
                        status: 'active',
                        joinedAt: new Date().toISOString()
                    });
                    await StaffService.acceptInvitation(staffInv.id, userId);

                    // Si l'utilisateur n'avait pas de ferme, lui mettre celle-ci
                    if (!profile.farmId) {
                        await UserService.setFarm(userId, staffInv.farmId, staffInv.role);
                        await UserService.completeOnboarding(userId);
                    }
                }
            }

            // Recharger le profil
            await loadUserProfile(googleUser);

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
