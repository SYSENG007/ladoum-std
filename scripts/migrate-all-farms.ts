/**
 * Migration Script for All Existing Farms
 * Migrates all farms from members array to subcollections
 * 
 * Usage: npm run migrate-all-farms
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';

// Firebase config from environment
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

/**
 * Remove undefined fields from an object
 */
function removeUndefinedFields(obj: any): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                // Recursively clean nested objects
                cleaned[key] = removeUndefinedFields(value);
            } else {
                cleaned[key] = value;
            }
        }
    }

    return cleaned;
}

/**
 * Convert old member format to new format with permissions
 */
function convertMemberFormat(oldMember: any): any {
    // Default permissions based on role
    const permissions = {
        canAccessFinances: oldMember.role === 'owner' ? true : (oldMember.canAccessFinances || false),
        canManageAnimals: oldMember.role === 'owner' || oldMember.role === 'manager',
        canManageTasks: true,
        canManageInventory: oldMember.role === 'owner' || oldMember.role === 'manager',
        canManageStaff: oldMember.role === 'owner',
        canViewReports: true
    };

    const newMember = {
        id: oldMember.userId,
        userId: oldMember.userId,
        displayName: oldMember.displayName || oldMember.name || 'Member',
        email: oldMember.email || '',
        role: oldMember.role,
        permissions,
        status: oldMember.status || 'active',
        joinedAt: oldMember.joinedAt || new Date().toISOString(),
        phone: oldMember.phone,
        photoUrl: oldMember.photoUrl,
        invitedBy: oldMember.invitedBy
    };

    // Remove undefined fields
    return removeUndefinedFields(newMember);
}

/**
 * Migrate a single farm
 */
async function migrateFarm(farmId: string, farmData: any): Promise<boolean> {
    console.log(`\n📦 Migrating: ${farmData.name} (${farmId})`);

    const members = farmData.members || [];

    if (members.length === 0) {
        console.log('  ⚠️  No members to migrate');
        return false;
    }

    console.log(`  👥 Found ${members.length} members`);

    try {
        const batch = writeBatch(db);
        const memberIds: string[] = [];

        // Migrate each member to subcollection
        for (const oldMember of members) {
            const newMember = convertMemberFormat(oldMember);
            memberIds.push(newMember.userId);

            // Create document in subcollection
            const memberRef = doc(db, `farms/${farmId}/members`, newMember.userId);
            batch.set(memberRef, newMember);

            console.log(`  ✓ Prepared: ${newMember.displayName} (${newMember.role})`);
        }

        // Update farm document with memberIds and mark as migrated
        const farmRef = doc(db, 'farms', farmId);
        batch.update(farmRef, {
            memberIds,
            migratedAt: new Date().toISOString()
        });

        // Commit the batch
        await batch.commit();

        console.log(`  ✅ Successfully migrated ${memberIds.length} members`);
        return true;

    } catch (error: any) {
        console.error(`  ❌ Error migrating farm:`, error.message);
        return false;
    }
}

/**
 * Main migration function
 */
async function migrateAllFarms(): Promise<void> {
    console.log('🚀 Starting Migration of All Farms\n');
    console.log('═'.repeat(60));

    try {
        // Get all farms
        const farmsSnapshot = await getDocs(collection(db, 'farms'));
        const totalFarms = farmsSnapshot.size;

        if (totalFarms === 0) {
            console.log('\n⚠️  No farms found in database');
            return;
        }

        console.log(`\n📊 Found ${totalFarms} farm(s) to process\n`);

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
                    console.log(`\n⏩ Skipping "${farmData.name}" - already migrated on ${new Date(farmData.migratedAt).toLocaleString('fr-FR')}`);
                    skipped++;
                    continue;
                }

                // Migrate the farm
                const success = await migrateFarm(farmId, farmData);

                if (success) {
                    migrated++;
                } else {
                    skipped++;
                }

            } catch (error: any) {
                console.error(`\n❌ Fatal error processing farm "${farmData.name}":`, error.message);
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

        if (migrated > 0) {
            console.log('\n✨ Migration completed successfully!');
            console.log('🔄 Users should refresh their browsers to see changes.\n');
        } else {
            console.log('\n⚠️  No farms were migrated (all already migrated or no members).\n');
        }

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateAllFarms()
    .then(() => {
        console.log('✓ Process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Process failed:', error);
        process.exit(1);
    });
