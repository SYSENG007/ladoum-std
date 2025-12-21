/**
 * Quick Fix Script: Migrate Existing Farm to Subcollections
 * 
 * This will migrate your existing farm "Al Fouliyou" to the new architecture
 * by creating the owner in the members subcollection.
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixFarm() {
    console.log('🔧 Fixing existing farm...\n');

    try {
        // Get all farms
        const farmsSnapshot = await getDocs(collection(db, 'farms'));

        if (farmsSnapshot.empty) {
            console.log('❌ No farms found');
            return;
        }

        for (const farmDoc of farmsSnapshot.docs) {
            const farmData = farmDoc.data();
            console.log(`\n📦 Found farm: ${farmData.name} (${farmDoc.id})`);

            // Check if already migrated
            if (farmData.migratedAt) {
                console.log('  ⏩ Already migrated, skipping');
                continue;
            }

            const members = farmData.members || [];
            console.log(`  👥 Found ${members.length} members in old array`);

            if (members.length === 0) {
                console.log('  ⚠️  No members to migrate');
                continue;
            }

            const memberIds: string[] = [];

            // Migrate each member
            for (const member of members) {
                const permissions = {
                    canAccessFinances: member.role === 'owner' ? true : (member.canAccessFinances || false),
                    canManageAnimals: member.role === 'owner' || member.role === 'manager',
                    canManageTasks: true,
                    canManageInventory: member.role === 'owner' || member.role === 'manager',
                    canManageStaff: member.role === 'owner',
                    canViewReports: true
                };

                const newMember = {
                    id: member.userId,
                    userId: member.userId,
                    displayName: member.displayName || member.name || 'Member',
                    email: member.email,
                    role: member.role,
                    permissions,
                    status: member.status || 'active',
                    joinedAt: member.joinedAt,
                    phone: member.phone,
                    photoUrl: member.photoUrl
                };

                // Create in subcollection
                const memberRef = doc(db, `farms/${farmDoc.id}/members`, member.userId);
                await setDoc(memberRef, newMember);

                memberIds.push(member.userId);
                console.log(`  ✓ Migrated: ${newMember.displayName} (${newMember.role})`);
            }

            // Update farm with memberIds
            await updateDoc(doc(db, 'farms', farmDoc.id), {
                memberIds,
                migratedAt: new Date().toISOString()
            });

            console.log(`  ✓ Updated farm with ${memberIds.length} memberIds`);
            console.log(`  ✨ Farm "${farmData.name}" migrated successfully!`);
        }

        console.log('\n✅ Migration complete!\n');
        console.log('🔄 Refresh your browser to see the changes.');

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

fixFarm()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
