/**
 * Migration Script: Farm Members to Subcollections
 * 
 * This script migrates existing farm members from the `members` array
 * in farm documents to the new `farms/{farmId}/members` subcollection.
 * 
 * Usage:
 *   npm run migrate-farms
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    arrayUnion
} from 'firebase/firestore';

// Firebase config - UPDATE WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface OldFarmMember {
    userId: string;
    displayName: string;
    email: string;
    role: 'owner' | 'manager' | 'worker';
    canAccessFinances?: boolean;
    status: 'active' | 'inactive' | 'pending';
    joinedAt: string;
    phone?: string;
    photoUrl?: string;
}

interface NewFarmMember {
    id: string;
    userId: string;
    displayName: string;
    email: string;
    role: 'owner' | 'manager' | 'worker';
    permissions: {
        canAccessFinances: boolean;
        canManageAnimals: boolean;
        canManageTasks: boolean;
        canManageInventory: boolean;
        canManageStaff: boolean;
        canViewReports: boolean;
    };
    status: 'active' | 'inactive' | 'pending';
    joinedAt: string;
    phone?: string;
    photoUrl?: string;
    invitedBy?: string;
}

/**
 * Convert old member format to new format with permissions
 */
function convertMemberFormat(oldMember: OldFarmMember): NewFarmMember {
    // Default permissions based on role
    let permissions = {
        canAccessFinances: false,
        canManageAnimals: false,
        canManageTasks: false,
        canManageInventory: false,
        canManageStaff: false,
        canViewReports: false
    };

    switch (oldMember.role) {
        case 'owner':
            permissions = {
                canAccessFinances: true,
                canManageAnimals: true,
                canManageTasks: true,
                canManageInventory: true,
                canManageStaff: true,
                canViewReports: true
            };
            break;
        case 'manager':
            permissions = {
                canAccessFinances: oldMember.canAccessFinances ?? false,
                canManageAnimals: true,
                canManageTasks: true,
                canManageInventory: true,
                canManageStaff: false,
                canViewReports: true
            };
            break;
        case 'worker':
            permissions = {
                canAccessFinances: false,
                canManageAnimals: false,
                canManageTasks: true,
                canManageInventory: false,
                canManageStaff: false,
                canViewReports: false
            };
            break;
    }

    return {
        id: oldMember.userId,
        userId: oldMember.userId,
        displayName: oldMember.displayName,
        email: oldMember.email,
        role: oldMember.role,
        permissions,
        status: oldMember.status,
        joinedAt: oldMember.joinedAt,
        phone: oldMember.phone,
        photoUrl: oldMember.photoUrl
    };
}

/**
 * Migrate a single farm
 */
async function migrateFarm(farmId: string, farmData: any): Promise<void> {
    console.log(`\n📦 Migrating farm: ${farmData.name} (${farmId})`);

    const members: OldFarmMember[] = farmData.members || [];
    const memberIds: string[] = [];

    if (members.length === 0) {
        console.log('  ⚠️  No members to migrate');
        return;
    }

    console.log(`  👥 Found ${members.length} members`);

    // Migrate each member to subcollection
    for (const oldMember of members) {
        try {
            const newMember = convertMemberFormat(oldMember);
            memberIds.push(newMember.userId);

            // Create document in subcollection
            const memberRef = doc(db, `farms/${farmId}/members`, newMember.userId);
            await setDoc(memberRef, newMember);

            console.log(`  ✓ Migrated: ${newMember.displayName} (${newMember.role})`);
        } catch (error: any) {
            console.error(`  ✗ Error migrating member ${oldMember.displayName}:`, error.message);
        }
    }

    // Update farm document with memberIds
    try {
        const farmRef = doc(db, 'farms', farmId);
        await updateDoc(farmRef, {
            memberIds,
            migratedAt: new Date().toISOString(),
            // Keep members array as backup for now
        });
        console.log(`  ✓ Updated farm with ${memberIds.length} memberIds`);
    } catch (error: any) {
        console.error(`  ✗ Error updating farm:`, error.message);
    }
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
    console.log('🚀 Starting Farm Members Migration...\n');
    console.log('This will migrate farm members to subcollections.');
    console.log('Original data will be preserved as backup.\n');

    try {
        // Get all farms
        const farmsSnapshot = await getDocs(collection(db, 'farms'));
        const totalFarms = farmsSnapshot.size;

        console.log(`📊 Found ${totalFarms} farms to process\n`);
        console.log('═'.repeat(60));

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        // Process each farm
        for (const farmDoc of farmsSnapshot.docs) {
            const farmId = farmDoc.id;
            const farmData = farmDoc.data();

            try {
                // Skip if already migrated
                if (farmData.migratedAt) {
                    console.log(`\n⏩ Skipping (already migrated): ${farmData.name}`);
                    skipped++;
                    continue;
                }

                await migrateFarm(farmId, farmData);
                migrated++;
            } catch (error: any) {
                console.error(`\n❌ Error processing farm ${farmId}:`, error.message);
                errors++;
            }

            console.log('─'.repeat(60));
        }

        // Summary
        console.log('\n' + '═'.repeat(60));
        console.log('\n📋 Migration Summary:');
        console.log(`   Total farms: ${totalFarms}`);
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ⏩ Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('\n✨ Migration complete!\n');

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
runMigration()
    .then(() => {
        console.log('✓ Process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Process failed:', error);
        process.exit(1);
    });
