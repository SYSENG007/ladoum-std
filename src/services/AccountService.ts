import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    writeBatch,
    query,
    where
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

/**
 * Service pour la gestion du compte utilisateur
 * Inclut la suppression complète du compte et de toutes les données associées
 */
export const AccountService = {
    /**
     * Supprime complètement le compte utilisateur et toutes ses données
     * 
     * Ordre de suppression:
     * 1. Animaux de toutes les fermes de l'utilisateur
     * 2. Tâches de toutes les fermes
     * 3. Inventaire de toutes les fermes
     * 4. Transactions de toutes les fermes
     * 5. Listings créés par l'utilisateur
     * 6. Fermes (si owner)
     * 7. Invitations créées par l'utilisateur
     * 8. Profil utilisateur
     * 9. Compte Firebase Auth
     */
    async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Get user's farms
            const userDoc = await getDocs(
                query(collection(db, 'users'), where('__name__', '==', userId))
            );

            if (userDoc.empty) {
                throw new Error('Utilisateur non trouvé');
            }

            const userData = userDoc.docs[0].data();
            const farmIds = userData.farms || [];

            // Delete data from each farm
            for (const farmId of farmIds) {
                await this.deleteFarmData(farmId, userId);
            }

            // Delete listings created by user
            await this.deleteUserListings(userId);

            // Delete invitations created by user
            await this.deleteUserInvitations(userId);

            // Delete user profile
            await deleteDoc(doc(db, 'users', userId));

            // Delete Firebase Auth account
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid === userId) {
                await deleteUser(currentUser);
            }

            return {
                success: true,
                message: 'Compte supprimé avec succès'
            };
        } catch (error: any) {
            console.error('Error deleting account:', error);
            return {
                success: false,
                message: error.message || 'Erreur lors de la suppression du compte'
            };
        }
    },

    /**
     * Supprime toutes les données d'une ferme
     */
    async deleteFarmData(farmId: string, userId: string): Promise<void> {
        const batch = writeBatch(db);
        const collectionsToDelete = ['animals', 'tasks', 'inventory', 'transactions'];

        for (const collectionName of collectionsToDelete) {
            const q = query(
                collection(db, collectionName),
                where('farmId', '==', farmId)
            );
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(docSnap => {
                batch.delete(doc(db, collectionName, docSnap.id));
            });
        }

        // Check if user owns the farm
        const farmDoc = await getDocs(
            query(collection(db, 'farms'), where('__name__', '==', farmId))
        );

        if (!farmDoc.empty) {
            const farmData = farmDoc.docs[0].data();
            if (farmData.ownerId === userId) {
                batch.delete(doc(db, 'farms', farmId));
            }
        }

        await batch.commit();
    },

    /**
     * Supprime les listings créés par l'utilisateur
     */
    async deleteUserListings(userId: string): Promise<void> {
        const q = query(
            collection(db, 'listings'),
            where('createdBy', '==', userId)
        );
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => {
            batch.delete(doc(db, 'listings', docSnap.id));
        });
        await batch.commit();
    },

    /**
     * Supprime les invitations créées par l'utilisateur
     */
    async deleteUserInvitations(userId: string): Promise<void> {
        const q = query(
            collection(db, 'invitations'),
            where('invitedBy', '==', userId)
        );
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => {
            batch.delete(doc(db, 'invitations', docSnap.id));
        });
        await batch.commit();
    }
};
