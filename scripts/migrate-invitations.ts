import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';

/**
 * Migration script to convert legacy 8-character invitation codes to new 32-character tokens
 * 
 * Run this script ONCE before deploying the new invitation system:
 * 
 *   npx tsx scripts/migrate-invitations.ts
 * 
 * It will:
 * 1. Find all invitations with a 'code' field
 * 2. Generate a new 32-character 'token' field
 * 3. Remove the 'code' field
 * 4. Update the document structure to match StaffInvitation
 */

// Firebase config - update with your project details
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

// Generate a random 32-character token (same as StaffService)
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

async function migrateInvitations() {
    console.log('🔄 Starting invitation migration...\n');

    try {
        const invitationsRef = collection(db, 'invitations');
        const snapshot = await getDocs(invitationsRef);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // Check if invitation has legacy 'code' field
            if (data.code && !data.token) {
                console.log(`📝 Migrating invitation: ${docSnap.id}`);
                console.log(`   Email: ${data.email}`);
                console.log(`   Old code: ${data.code}`);

                try {
                    // Generate new token
                    const newToken = generateToken();
                    console.log(`   New token: ${newToken}`);

                    // Update document: add token, remove code
                    await updateDoc(doc(db, 'invitations', docSnap.id), {
                        token: newToken,
                        code: deleteField(),
                    });

                    console.log(`   ✅ Migrated successfully\n`);
                    migrated++;
                } catch (err: any) {
                    console.error(`   ❌ Error migrating: ${err.message}\n`);
                    errors++;
                }
            } else if (data.token) {
                console.log(`⏭️  Skipping ${docSnap.id} (already has token)\n`);
                skipped++;
            } else {
                console.log(`⚠️  Warning: ${docSnap.id} has neither code nor token\n`);
                skipped++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   Total invitations: ${snapshot.size}`);
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);

        if (errors === 0) {
            console.log('\n🎉 Migration completed successfully!');
        } else {
            console.log('\n⚠️  Migration completed with errors. Please review above.');
        }
    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateInvitations()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n💥 Fatal error:', err);
        process.exit(1);
    });
