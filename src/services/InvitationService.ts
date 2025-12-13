import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Invitation } from '../types/auth';

const COLLECTION_NAME = 'invitations';

// Générer un code d'invitation aléatoire
const generateCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const InvitationService = {
    /**
     * Créer une nouvelle invitation
     */
    async create(email: string, invitedBy: string, farmId?: string, role?: 'owner' | 'manager' | 'worker'): Promise<Invitation> {
        const code = generateCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        const invitation: Omit<Invitation, 'id'> = {
            email: email.toLowerCase(),
            code,
            invitedBy,
            farmId,
            role,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        };

        const docRef = doc(collection(db, COLLECTION_NAME));
        await setDoc(docRef, invitation);

        return { id: docRef.id, ...invitation };
    },

    /**
     * Valider un code d'invitation
     */
    async validateCode(code: string): Promise<{ valid: boolean; invitation?: Invitation; error?: string }> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('code', '==', code.toUpperCase())
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { valid: false, error: 'Code d\'invitation invalide' };
        }

        const doc = snapshot.docs[0];
        const invitation = { id: doc.id, ...doc.data() } as Invitation;

        // Vérifier si déjà utilisé
        if (invitation.usedAt) {
            return { valid: false, error: 'Ce code a déjà été utilisé' };
        }

        // Vérifier expiration
        if (new Date(invitation.expiresAt) < new Date()) {
            return { valid: false, error: 'Ce code a expiré' };
        }

        return { valid: true, invitation };
    },

    /**
     * Marquer une invitation comme utilisée
     */
    async markAsUsed(invitationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, invitationId);
        await updateDoc(docRef, {
            usedAt: new Date().toISOString(),
        });
    },

    /**
     * Récupérer les invitations créées par un utilisateur
     */
    async getByInviter(userId: string): Promise<Invitation[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('invitedBy', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
    },

    /**
     * Récupérer une invitation par son ID
     */
    async getById(id: string): Promise<Invitation | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Invitation;
    },
};
