// Staff Service - Ladoum STD (Refactored for Farm-Scoped Invitations)
// Handles member invitations and staff management

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    collectionGroup,
    writeBatch,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StaffInvitation } from '../types/staff';

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
     * Creates invitation in farms/{farmId}/invitations subcollection
     */
    async inviteMember(params: {
        farmId: string;
        farmName: string;
        email: string;
        displayName: string;
        role: 'manager' | 'worker';
        permissions: {
            canAccessFinances: boolean;
            canManageAnimals: boolean;
            canManageTasks: boolean;
            canManageInventory: boolean;
            canManageStaff: boolean;
            canViewReports: boolean;
        };
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
            permissions: params.permissions,
            invitedBy: params.invitedBy,
            inviterName: params.inviterName,
            token,
            status: 'pending',
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString()
        };

        // Create invitation in farm-scoped subcollection
        const invitationsRef = collection(db, 'farms', params.farmId, 'invitations');
        const docRef = await addDoc(invitationsRef, invitation);
        const savedInvitation = { id: docRef.id, ...invitation };

        console.log(`[StaffService] Created invitation ${docRef.id} for ${params.email} in farm ${params.farmId}`);
        return savedInvitation;
    },

    /**
     * Get invitation by token (Collection Group Query)
     * PUBLIC - Used by unauthenticated users on /join page
     */
    async getByToken(token: string): Promise<StaffInvitation | null> {
        console.log('[StaffService.getByToken] Looking up invitation by token');

        if (!token) {
            console.log('[StaffService.getByToken] No token provided');
            return null;
        }

        const trimmedToken = token.trim();

        try {
            // Use collection group query to search across all farms
            const q = query(
                collectionGroup(db, 'invitations'),
                where('token', '==', trimmedToken),
                where('status', '==', 'pending')
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log('[StaffService.getByToken] No invitation found with token');
                return null;
            }

            // Get the first (should be only) matching invitation
            const docSnap = snapshot.docs[0];
            const invitation = { id: docSnap.id, ...docSnap.data() } as StaffInvitation;

            // Check if expired
            const expiryDate = new Date(invitation.expiresAt);
            const now = new Date();

            if (expiryDate < now) {
                console.log('[StaffService.getByToken] Invitation expired, marking as expired');

                // Mark as expired
                const invitationRef = doc(db, 'farms', invitation.farmId, 'invitations', invitation.id);
                await updateDoc(invitationRef, { status: 'expired' });

                return null;
            }

            console.log(`[StaffService.getByToken] Found valid invitation for ${invitation.email}`);
            return invitation;

        } catch (error: any) {
            console.error('[StaffService.getByToken] Error:', error);
            throw new Error(`Failed to lookup invitation: ${error.message}`);
        }
    },

    /**
     * Get all invitations for a farm
     * PRIVATE - Requires farm membership
     */
    async getFarmInvitations(farmId: string, statusFilter?: 'pending' | 'accepted' | 'expired' | 'cancelled'): Promise<StaffInvitation[]> {
        try {
            const invitationsRef = collection(db, 'farms', farmId, 'invitations');

            let q;
            if (statusFilter) {
                q = query(invitationsRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
            } else {
                q = query(invitationsRef, orderBy('createdAt', 'desc'));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StaffInvitation);

        } catch (error: any) {
            console.error('[StaffService.getFarmInvitations] Error:', error);
            throw new Error(`Failed to fetch invitations: ${error.message}`);
        }
    },

    /**
     * Get pending invitations for a farm
     * DEPRECATED - Use getFarmInvitations(farmId, 'pending') instead
     */
    async getPendingInvitations(farmId: string): Promise<StaffInvitation[]> {
        return this.getFarmInvitations(farmId, 'pending');
    },

    /**
     * Get all invitations for a farm (for stats)
     * DEPRECATED - Use getFarmInvitations(farmId) instead
     */
    async getAllInvitations(farmId: string): Promise<StaffInvitation[]> {
        return this.getFarmInvitations(farmId);
    },

    /**
     * Accept an invitation (Atomic Operation)
     * Creates farm member document and updates invitation status in a single transaction
     */
    async acceptInvitation(params: {
        farmId: string;
        invitationId: string;
        userId: string;
        displayName: string;
        email: string;
    }): Promise<void> {
        console.log(`[StaffService.acceptInvitation] Accepting invitation ${params.invitationId} for user ${params.userId}`);

        try {
            // Get the invitation first to get role and permissions
            const invitationRef = doc(db, 'farms', params.farmId, 'invitations', params.invitationId);
            const invitationSnap = await getDoc(invitationRef);

            if (!invitationSnap.exists()) {
                throw new Error('Invitation not found');
            }

            const invitation = { id: invitationSnap.id, ...invitationSnap.data() } as StaffInvitation;

            // Verify invitation is still pending
            if (invitation.status !== 'pending') {
                throw new Error(`Invitation already ${invitation.status}`);
            }

            // Verify email match
            if (invitation.email.toLowerCase() !== params.email.toLowerCase()) {
                throw new Error('Email does not match invitation');
            }

            // Create batch for atomic operation
            const batch = writeBatch(db);

            // 1. Update invitation status
            batch.update(invitationRef, {
                status: 'accepted',
                acceptedAt: new Date().toISOString(),
                acceptedBy: params.userId
            });

            // 2. Create farm member document
            const memberRef = doc(db, 'farms', params.farmId, 'members', params.userId);
            batch.set(memberRef, {
                id: params.userId,
                farmId: params.farmId,
                userId: params.userId,
                email: params.email.toLowerCase(),
                displayName: params.displayName,
                role: invitation.role,
                permissions: invitation.permissions,
                status: 'active',
                joinedAt: new Date().toISOString(),
                invitedBy: invitation.invitedBy,
                invitationId: params.invitationId
            });

            // 3. Update farm memberIds array
            const farmRef = doc(db, 'farms', params.farmId);
            // Note: Using arrayUnion to add userId to memberIds
            // This requires importing arrayUnion from firebase/firestore
            const { arrayUnion } = await import('firebase/firestore');
            batch.update(farmRef, {
                memberIds: arrayUnion(params.userId),
                updatedAt: new Date().toISOString()
            });

            // Commit atomic transaction
            await batch.commit();

            console.log(`[StaffService.acceptInvitation] Successfully accepted invitation and created member`);

        } catch (error: any) {
            console.error('[StaffService.acceptInvitation] Error:', error);
            throw new Error(`Failed to accept invitation: ${error.message}`);
        }
    },

    /**
     * Cancel an invitation
     * PRIVATE - Requires staff management permission
     */
    async cancelInvitation(farmId: string, invitationId: string): Promise<void> {
        try {
            const invitationRef = doc(db, 'farms', farmId, 'invitations', invitationId);
            await updateDoc(invitationRef, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            });

            console.log(`[StaffService] Cancelled invitation ${invitationId}`);

        } catch (error: any) {
            console.error('[StaffService.cancelInvitation] Error:', error);
            throw new Error(`Failed to cancel invitation: ${error.message}`);
        }
    },

    /**
     * Delete an invitation permanently
     * PRIVATE - Only farm owner
     */
    async deleteInvitation(farmId: string, invitationId: string): Promise<void> {
        try {
            const invitationRef = doc(db, 'farms', farmId, 'invitations', invitationId);
            await deleteDoc(invitationRef);

            console.log(`[StaffService] Deleted invitation ${invitationId}`);

        } catch (error: any) {
            console.error('[StaffService.deleteInvitation] Error:', error);
            throw new Error(`Failed to delete invitation: ${error.message}`);
        }
    },

    /**
     * Extend invitation expiration by 7 days
     * PRIVATE - Requires staff management permission
     */
    async extendInvitation(farmId: string, invitationId: string): Promise<void> {
        try {
            const invitationRef = doc(db, 'farms', farmId, 'invitations', invitationId);
            const invitationSnap = await getDoc(invitationRef);

            if (!invitationSnap.exists()) {
                throw new Error('Invitation not found');
            }

            const invitation = invitationSnap.data() as Omit<StaffInvitation, 'id'>;

            if (invitation.status !== 'pending') {
                throw new Error('Can only extend pending invitations');
            }

            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + 7);

            await updateDoc(invitationRef, {
                expiresAt: newExpiresAt.toISOString(),
                extendedAt: new Date().toISOString()
            });

            console.log(`[StaffService] Extended invitation ${invitationId}`);

        } catch (error: any) {
            console.error('[StaffService.extendInvitation] Error:', error);
            throw new Error(`Failed to extend invitation: ${error.message}`);
        }
    },

    /**
     * Get invitation by ID
     * PRIVATE - Requires farm membership
     */
    async getById(farmId: string, invitationId: string): Promise<StaffInvitation | null> {
        try {
            const invitationRef = doc(db, 'farms', farmId, 'invitations', invitationId);
            const snapshot = await getDoc(invitationRef);

            if (!snapshot.exists()) {
                return null;
            }

            return { id: snapshot.id, ...snapshot.data() } as StaffInvitation;

        } catch (error: any) {
            console.error('[StaffService.getById] Error:', error);
            return null;
        }
    },

    /**
     * Update invitation fields
     * PRIVATE - Requires staff management permission
     */
    async updateInvitation(farmId: string, invitationId: string, updates: Partial<StaffInvitation>): Promise<void> {
        try {
            const invitationRef = doc(db, 'farms', farmId, 'invitations', invitationId);
            await updateDoc(invitationRef, updates as any);

            console.log(`[StaffService] Updated invitation ${invitationId}`);

        } catch (error: any) {
            console.error('[StaffService.updateInvitation] Error:', error);
            throw new Error(`Failed to update invitation: ${error.message}`);
        }
    },

    // =========================================================================
    // LEGACY METHODS - Backward Compatibility
    // =========================================================================
    // These methods maintain compatibility with old root-level invitations
    // They will be removed after complete migration

    /**
     * Get invitation by email (LEGACY)
     * @deprecated Use getFarmInvitations with email filter instead
     */
    async getByEmail(email: string): Promise<StaffInvitation | null> {
        console.warn('[StaffService.getByEmail] DEPRECATED: This method uses legacy collection');

        try {
            // Try new structure first (collection group query)
            const q = query(
                collectionGroup(db, 'invitations'),
                where('email', '==', email.toLowerCase()),
                where('status', '==', 'pending')
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() } as StaffInvitation;
            }

            return null;

        } catch (error: any) {
            console.error('[StaffService.getByEmail] Error:', error);
            return null;
        }
    },

    /**
     * Update member permissions (LEGACY)
     * @deprecated Use FarmMemberService instead
     */
    async updateMemberPermissions(farmId: string, memberId: string, updates: {
        role?: 'manager' | 'worker';
        canAccessFinances?: boolean;
        status?: 'active' | 'inactive';
    }): Promise<void> {
        console.warn('[StaffService.updateMemberPermissions] DEPRECATED: Use FarmMemberService.updatePermissions');

        const memberRef = doc(db, 'farms', farmId, 'members', memberId);
        await updateDoc(memberRef, updates);
    },

    /**
     * Remove member from farm (LEGACY)
     * @deprecated Use FarmMemberService instead
     */
    async removeMember(farmId: string, memberId: string): Promise<void> {
        console.warn('[StaffService.removeMember] DEPRECATED: Use FarmMemberService.removeMember');

        await deleteDoc(doc(db, 'farms', farmId, 'members', memberId));
    }
};
