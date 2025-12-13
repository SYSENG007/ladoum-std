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
            farms: [],
            activeFarmId: '',
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
                farms: [],
                activeFarmId: '',
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
     * Ajouter une ferme à l'utilisateur
     */
    async addFarm(userId: string, farmId: string, setAsActive: boolean = true): Promise<void> {
        const profile = await this.getById(userId);
        if (!profile) throw new Error('User not found');

        const farms = [...profile.farms, farmId];
        const updates: Partial<UserProfile> = { farms };

        if (setAsActive || !profile.activeFarmId) {
            updates.activeFarmId = farmId;
        }

        await this.update(userId, updates);
    },

    /**
     * Changer la ferme active
     */
    async setActiveFarm(userId: string, farmId: string): Promise<void> {
        const profile = await this.getById(userId);
        if (!profile) throw new Error('User not found');

        if (!profile.farms.includes(farmId)) {
            throw new Error('User is not a member of this farm');
        }

        await this.update(userId, { activeFarmId: farmId });
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
