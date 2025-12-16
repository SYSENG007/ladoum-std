import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Farm, FarmMember, FarmSettings } from '../types/farm';
import { defaultFarmSettings } from '../types/farm';

const COLLECTION_NAME = 'farms';

export const FarmService = {
    /**
     * Créer une nouvelle ferme
     */
    async create(
        name: string,
        ownerId: string,
        ownerName: string,
        ownerEmail: string,
        location?: string,
        settings: FarmSettings = defaultFarmSettings
    ): Promise<Farm> {
        const now = new Date().toISOString();

        const owner: FarmMember = {
            userId: ownerId,
            displayName: ownerName,
            email: ownerEmail,
            role: 'owner',
            canAccessFinances: true,
            status: 'active',
            joinedAt: now,
        };

        const farm: Omit<Farm, 'id'> = {
            name,
            location,
            ownerId,
            members: [owner],
            settings,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = doc(collection(db, COLLECTION_NAME));
        await setDoc(docRef, farm);

        return { id: docRef.id, ...farm };
    },

    /**
     * Récupérer une ferme par ID
     */
    async getById(farmId: string): Promise<Farm | null> {
        const docRef = doc(db, COLLECTION_NAME, farmId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Farm;
    },

    /**
     * Récupérer toutes les fermes d'un utilisateur
     */
    async getByUserId(userId: string): Promise<Farm[]> {
        // Récupérer toutes les fermes et filtrer côté client
        // En production, on utiliserait une sous-collection ou un index
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Farm))
            .filter(farm => farm.members.some(m => m.userId === userId));
    },

    /**
     * Mettre à jour une ferme
     */
    async update(farmId: string, updates: Partial<Farm>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, farmId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    },

    async addMember(
        farmId: string,
        member: Omit<FarmMember, 'id'>
    ): Promise<void> {
        const farm = await this.getById(farmId);
        if (!farm) throw new Error('Farm not found');

        // Vérifier si l'utilisateur est déjà membre
        if (farm.members.some(m => m.userId === member.userId)) {
            throw new Error('User is already a member of this farm');
        }

        const newMember: FarmMember = {
            ...member,
            joinedAt: member.joinedAt || new Date().toISOString(),
        };

        const docRef = doc(db, COLLECTION_NAME, farmId);
        await updateDoc(docRef, {
            members: [...farm.members, newMember],
            updatedAt: new Date().toISOString(),
        });
    },

    /**
     * Mettre à jour les paramètres de la ferme
     */
    async updateSettings(farmId: string, settings: Partial<FarmSettings>): Promise<void> {
        const farm = await this.getById(farmId);
        if (!farm) throw new Error('Farm not found');

        await this.update(farmId, {
            settings: { ...farm.settings, ...settings },
        });
    },

    /**
     * Vérifier si un utilisateur est propriétaire
     */
    async isOwner(farmId: string, userId: string): Promise<boolean> {
        const farm = await this.getById(farmId);
        if (!farm) return false;
        return farm.ownerId === userId;
    },

    /**
     * Obtenir le rôle d'un utilisateur dans une ferme
     */
    async getUserRole(farmId: string, userId: string): Promise<'owner' | 'manager' | 'worker' | null> {
        const farm = await this.getById(farmId);
        if (!farm) return null;
        const member = farm.members.find(m => m.userId === userId);
        return member?.role || null;
    },
};
