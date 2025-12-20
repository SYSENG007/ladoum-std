import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

/**
 * Script pour supprimer la collection legacy staff_invitations de Firestore
 * 
 * ATTENTION: Ce script supprime DÉFINITIVEMENT tous les documents de staff_invitations
 * 
 * Usage:
 *   npx tsx scripts/delete-staff-invitations.ts
 */

// Firebase config - utilise les variables d'environnement
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteStaffInvitations() {
    console.log('🔍 Recherche de la collection staff_invitations...\n');

    try {
        const collectionRef = collection(db, 'staff_invitations');
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
            console.log('✅ La collection staff_invitations est déjà vide ou n\'existe pas.\n');
            return;
        }

        console.log(`📊 Trouvé ${snapshot.size} document(s) dans staff_invitations\n`);

        // Afficher les documents avant suppression
        console.log('Documents à supprimer:');
        snapshot.docs.forEach((docSnap, index) => {
            const data = docSnap.data();
            console.log(`  ${index + 1}. ${docSnap.id} - ${data.email || 'N/A'} (${data.status || 'N/A'})`);
        });

        // Demander confirmation (dans un vrai script, vous pourriez ajouter readline)
        console.log('\n⚠️  ATTENTION: Ces documents vont être SUPPRIMÉS DÉFINITIVEMENT!\n');

        // Suppression par batch (max 500 opérations par batch)
        const batchSize = 500;
        let deletedCount = 0;

        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const docsToDelete = snapshot.docs.slice(i, i + batchSize);

            docsToDelete.forEach((docSnap) => {
                batch.delete(doc(db, 'staff_invitations', docSnap.id));
            });

            await batch.commit();
            deletedCount += docsToDelete.length;
            console.log(`🗑️  Supprimé ${deletedCount}/${snapshot.size} documents...`);
        }

        console.log(`\n✅ Suppression terminée! ${deletedCount} document(s) supprimé(s).\n`);
        console.log('🎉 La collection staff_invitations a été nettoyée.\n');

    } catch (error: any) {
        console.error('\n❌ Erreur lors de la suppression:', error.message);
        process.exit(1);
    }
}

// Exécuter le script
console.log('═══════════════════════════════════════════════════════');
console.log('  Script de suppression: staff_invitations (LEGACY)');
console.log('═══════════════════════════════════════════════════════\n');

deleteStaffInvitations()
    .then(() => {
        console.log('✨ Script terminé avec succès!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Erreur fatale:', err);
        process.exit(1);
    });
