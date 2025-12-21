import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    writeBatch,
    arrayUnion,
    arrayRemove,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FarmMember, FarmPermissions } from '../types/farm';

const FARMS_COLLECTION = 'farms';
const MEMBERS_SUBCOLLECTION = 'members';

/**
 * Service pour gérer les membres des fermes (sous-collection)
 * Structure: farms/{farmId}/members/{userId}
 */
export const FarmMemberService = {
    /**
     * Ajouter un membre à une ferme
     * Crée le document dans la sous-collection ET met à jour memberIds
     */
    async addMember(
        farmId: string,
        memberData: Omit<FarmMember, 'id'>
    ): Promise<void> {
        const batch = writeBatch(db);

        // 1. Créer document dans sous-collection
        const memberRef = doc(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION, memberData.userId);
        batch.set(memberRef, {
            id: memberData.userId,
            ...memberData,
            joinedAt: memberData.joinedAt || new Date().toISOString()
        });

        // 2. Ajouter userId dans farm.memberIds (atomic)
        const farmRef = doc(db, FARMS_COLLECTION, farmId);
        batch.update(farmRef, {
            memberIds: arrayUnion(memberData.userId),
            updatedAt: new Date().toISOString()
        });

        await batch.commit();
        console.log(`[FarmMemberService] Added member ${memberData.userId} to farm ${farmId}`);
    },

    /**
     * Récupérer tous les membres d'une ferme
     */
    async getMembers(farmId: string): Promise<FarmMember[]> {
        const membersRef = collection(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION);
        const snapshot = await getDocs(membersRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FarmMember[];
    },

    /**
     * Récupérer un membre spécifique
     */
    async getMember(farmId: string, userId: string): Promise<FarmMember | null> {
        const memberRef = doc(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION, userId);
        const snapshot = await getDoc(memberRef);

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        } as FarmMember;
    },

    /**
     * Mettre à jour les permissions d'un membre
     */
    async updatePermissions(
        farmId: string,
        userId: string,
        permissions: Partial<FarmPermissions>
    ): Promise<void> {
        const memberRef = doc(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION, userId);

        await updateDoc(memberRef, {
            permissions: permissions
        });

        console.log(`[FarmMemberService] Updated permissions for ${userId} in farm ${farmId}`);
    },

    /**
     * Mettre à jour le rôle d'un membre
     */
    async updateRole(
        farmId: string,
        userId: string,
        role: 'owner' | 'manager' | 'worker'
    ): Promise<void> {
        const memberRef = doc(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION, userId);

        await updateDoc(memberRef, {
            role: role
        });

        console.log(`[FarmMemberService] Updated role for ${userId} to ${role}`);
    },

    /**
     * Supprimer un membre d'une ferme
     * Supprime le document ET retire de memberIds
     */
    async removeMember(farmId: string, userId: string): Promise<void> {
        const batch = writeBatch(db);

        // 1. Supprimer document de la sous-collection
        const memberRef = doc(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION, userId);
        batch.delete(memberRef);

        // 2. Retirer userId de farm.memberIds
        const farmRef = doc(db, FARMS_COLLECTION, farmId);
        batch.update(farmRef, {
            memberIds: arrayRemove(userId),
            updatedAt: new Date().toISOString()
        });

        await batch.commit();
        console.log(`[FarmMemberService] Removed member ${userId} from farm ${farmId}`);
    },

    /**
     * Vérifier si un utilisateur est membre d'une ferme
     */
    async isMember(farmId: string, userId: string): Promise<boolean> {
        const member = await this.getMember(farmId, userId);
        return member !== null && member.status === 'active';
    },

    /**
     * Obtenir tous les membres avec un rôle spécifique
     */
    async getMembersByRole(
        farmId: string,
        role: 'owner' | 'manager' | 'worker'
    ): Promise<FarmMember[]> {
        const membersRef = collection(db, FARMS_COLLECTION, farmId, MEMBERS_SUBCOLLECTION);
        const q = query(membersRef, where('role', '==', role));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FarmMember[];
    },

    /**
     * Permissions par défaut selon le rôle
     */
    getDefaultPermissions(role: 'owner' | 'manager' | 'worker'): FarmPermissions {
        switch (role) {
            case 'owner':
                return {
                    canAccessFinances: true,
                    canManageAnimals: true,
                    canManageTasks: true,
                    canManageInventory: true,
                    canManageStaff: true,
                    canViewReports: true
                };
            case 'manager':
                return {
                    canAccessFinances: false,  // Configurable
                    canManageAnimals: true,
                    canManageTasks: true,
                    canManageInventory: true,
                    canManageStaff: false,
                    canViewReports: true
                };
            case 'worker':
                return {
                    canAccessFinances: false,
                    canManageAnimals: false,
                    canManageTasks: true,
                    canManageInventory: false,
                    canManageStaff: false,
                    canViewReports: false
                };
        }
    }
};
