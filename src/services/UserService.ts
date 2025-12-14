import {
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, UserSettings } from '../types/auth';
import { defaultUserSettings } from '../types/auth';

const COLLECTION_NAME = 'users';

export const UserService = {
    /**
     * Créer un nouveau profil utilisateur
     */
    async create(
        userId: string,
        email: string,
        displayName: string,
        settings: UserSettings = defaultUserSettings
    ): Promise<UserProfile> {
        const now = new Date().toISOString();

        const userProfile: UserProfile = {
            id: userId,
            email,
            displayName,
            farmId: '',
            onboardingCompleted: false,
            settings,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = doc(db, COLLECTION_NAME, userId);
        await setDoc(docRef, userProfile);

        return userProfile;
    },

    /**
     * Récupérer un profil utilisateur par ID
     */
    async getById(userId: string): Promise<UserProfile | null> {
        const docRef = doc(db, COLLECTION_NAME, userId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return snapshot.data() as UserProfile;
    },

    /**
     * Mettre à jour un profil utilisateur (crée le document s'il n'existe pas)
     */
    async update(userId: string, updates: Partial<UserProfile>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, userId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            // Le document n'existe pas, le créer avec les updates
            const now = new Date().toISOString();
            await setDoc(docRef, {
                id: userId,
                email: updates.email || '',
                displayName: updates.displayName || '',
                farmId: '',
                onboardingCompleted: false,
                settings: defaultUserSettings,
                createdAt: now,
                updatedAt: now,
                ...updates,
            });
        } else {
            // Le document existe, le mettre à jour
            await setDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }
    },

    /**
     * Marquer l'onboarding comme terminé
     */
    async completeOnboarding(userId: string): Promise<void> {
        await this.update(userId, { onboardingCompleted: true });
    },

    /**
     * Définir la bergerie de l'utilisateur (mono-bergerie)
     */
    async setFarm(userId: string, farmId: string, role: 'owner' | 'manager' | 'worker' = 'owner'): Promise<void> {
        await this.update(userId, { farmId, role });
    },

    /**
     * Mettre à jour les préférences
     */
    async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
        const profile = await this.getById(userId);
        if (!profile) throw new Error('User not found');

        await this.update(userId, {
            settings: { ...profile.settings, ...settings },
        });
    },
};
