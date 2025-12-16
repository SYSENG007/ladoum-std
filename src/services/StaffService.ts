// Staff Service - Ladoum STD
// Handles member invitations and staff management

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StaffInvitation } from '../types/staff';

const INVITATIONS_COLLECTION = 'staff_invitations';

/**
 * Generate a unique token for invitation links
 */
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export const StaffService = {
    /**
     * Invite a new member to the farm
     * Creates invitation record and triggers email via Firebase Extension
     */
    async inviteMember(params: {
        farmId: string;
        farmName: string;
        email: string;
        displayName: string;
        role: 'manager' | 'worker';
        canAccessFinances: boolean;
        invitedBy: string;
        inviterName: string;
    }): Promise<StaffInvitation> {
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

        const invitation: Omit<StaffInvitation, 'id'> = {
            farmId: params.farmId,
            farmName: params.farmName,
            email: params.email.toLowerCase(),
            displayName: params.displayName,
            role: params.role,
            canAccessFinances: params.canAccessFinances,
            invitedBy: params.invitedBy,
            inviterName: params.inviterName,
            token,
            status: 'pending',
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString()
        };

        // Create invitation record
        const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitation);
        const savedInvitation = { id: docRef.id, ...invitation };

        return savedInvitation;
    },

    /**
     * Get pending invitation by email
     */
    async getByEmail(email: string): Promise<StaffInvitation | null> {
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('email', '==', email.toLowerCase()),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docData = snapshot.docs[0];
        const invitation = { id: docData.id, ...docData.data() } as StaffInvitation;

        // Check if expired
        if (new Date(invitation.expiresAt) < new Date()) {
            await updateDoc(doc(db, INVITATIONS_COLLECTION, invitation.id), { status: 'expired' });
            return null;
        }

        return invitation;
    },

    /**
     * Get invitation by token
     */
    async getByToken(token: string): Promise<StaffInvitation | null> {
        console.log('[StaffService.getByToken] Searching for token:', token);
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('token', '==', token),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        console.log('[StaffService.getByToken] Found docs:', snapshot.size);

        if (snapshot.empty) {
            console.log('[StaffService.getByToken] No invitation found for token:', token);
            return null;
        }

        const docData = snapshot.docs[0];
        const invitation = { id: docData.id, ...docData.data() } as StaffInvitation;

        console.log('[StaffService.getByToken] Found invitation:', invitation);

        // Check if expired
        if (new Date(invitation.expiresAt) < new Date()) {
            console.log('[StaffService.getByToken] Invitation expired:', invitation.expiresAt);
            await updateDoc(doc(db, INVITATIONS_COLLECTION, invitation.id), { status: 'expired' });
            return null;
        }

        return invitation;
    },

    /**
     * Accept an invitation
     */
    async acceptInvitation(invitationId: string, _userId: string): Promise<void> {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'accepted',
            acceptedAt: new Date().toISOString()
        });
    },

    /**
     * Get pending invitations for a farm
     */
    async getPendingInvitations(farmId: string): Promise<StaffInvitation[]> {
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('farmId', '==', farmId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StaffInvitation);
    },

    /**
     * Cancel an invitation
     */
    async cancelInvitation(invitationId: string): Promise<void> {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'cancelled'
        });
    },

    /**
     * Extend invitation expiration
     */
    async extendInvitation(invitationId: string): Promise<void> {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 7);
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            expiresAt: newExpiry.toISOString()
        });
    },

    /**
     * Update member permissions
     */
    async updateMemberPermissions(farmId: string, memberId: string, updates: {
        role?: 'manager' | 'worker';
        canAccessFinances?: boolean;
        status?: 'active' | 'inactive';
    }): Promise<void> {
        // This would update the member document in the farm's members subcollection
        const memberRef = doc(db, 'farms', farmId, 'members', memberId);
        await updateDoc(memberRef, updates);
    },

    /**
     * Remove member from farm
     */
    async removeMember(farmId: string, memberId: string): Promise<void> {
        await deleteDoc(doc(db, 'farms', farmId, 'members', memberId));
    }
};
