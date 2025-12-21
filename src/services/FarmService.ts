import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    arrayUnion,
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

        // Create farm document with memberIds
        const farm: Omit<Farm, 'id'> = {
            name,
            location,
            ownerId,
            memberIds: [ownerId],
            members: [],  // Keep empty for now, will be deprecated later
            settings,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = doc(collection(db, COLLECTION_NAME));
        await setDoc(docRef, farm);

        // Add owner to members subcollection using FarmMemberService
        const { FarmMemberService } = await import('./FarmMemberService');
        await FarmMemberService.addMember(docRef.id, {
            userId: ownerId,
            displayName: ownerName,
            email: ownerEmail,
            role: 'owner',
            permissions: {
                canAccessFinances: true,
                canManageAnimals: true,
                canManageTasks: true,
                canManageInventory: true,
                canManageStaff: true,
                canViewReports: true
            },
            status: 'active',
            joinedAt: now
        });

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
     * Maintenant filtre par memberIds au lieu de members array
     */
    async getByUserId(userId: string): Promise<Farm[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Farm))
            .filter(farm => farm.memberIds && farm.memberIds.includes(userId));
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
        const newMember: FarmMember = {
            id: member.userId,
            ...member,
            joinedAt: member.joinedAt || new Date().toISOString(),
        };

        const docRef = doc(db, COLLECTION_NAME, farmId);

        // Use arrayUnion to add member without reading farm first
        // This avoids permission error when user doesn't have read access yet
        await updateDoc(docRef, {
            members: arrayUnion(newMember),
            memberIds: arrayUnion(member.userId), // Update memberIds for permissions
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
