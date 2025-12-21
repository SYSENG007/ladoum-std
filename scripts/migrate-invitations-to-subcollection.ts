import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    writeBatch,
    query,
    where
} from 'firebase/firestore';
import * as readline from 'readline';

/**
 * Migration Script: Move Invitations to Farm-Scoped Subcollection
 * 
 * This script migrates existing invitations from the root-level 'invitations' collection
 * to the new farm-scoped structure: farms/{farmId}/invitations/{invitationId}
 * 
 * PREREQUISITES:
 * 1. Firestore collection group indexes deployed
 * 2. Backup of production database created
 * 3. New security rules tested in staging
 * 
 * USAGE:
 *   # Dry run (no changes)
 *   npx tsx scripts/migrate-invitations-to-subcollection.ts --dry-run
 * 
 *   # Production migration
 *   npx tsx scripts/migrate-invitations-to-subcollection.ts --execute
 * 
 * SAFETY FEATURES:
 * - Dry run mode by default
 * - Interactive confirmation before making changes
 * - Batch transactions for atomicity
 * - Detailed logging of all operations
 * - Verification after migration
 */

// Firebase config from environment
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

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

interface OldInvitation {
    id: string;
    farmId: string;
    email: string;
    displayName: string;
    role: 'manager' | 'worker';
    permissions: any;
    token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    invitedBy: string;
    inviterName: string;
    expiresAt: string;
    createdAt: string;
    acceptedAt?: string;
    acceptedBy?: string;
    [key: string]: any; // Allow additional fields
}

/**
 * Prompt user for confirmation
 */
async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${message} (yes/no): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * Main migration function
 */
async function migrateInvitations() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Invitation Migration: Root → Farm Subcollection');
    console.log('═══════════════════════════════════════════════════════\n');

    if (isDryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made\n');
    } else {
        console.log('⚠️  EXECUTION MODE - Changes will be written to database\n');
    }

    try {
        // Step 1: Fetch all invitations from root collection
        console.log('[1/5] Fetching invitations from root collection...\n');
        const rootCollectionRef = collection(db, 'invitations');
        const snapshot = await getDocs(rootCollectionRef);

        if (snapshot.empty) {
            console.log('✅ No invitations found in root collection. Migration complete.\n');
            return;
        }

        console.log(`📊 Found ${snapshot.size} invitation(s) to migrate\n`);

        // Parse invitations
        const invitations: OldInvitation[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as OldInvitation));

        // Group by farmId for reporting
        const farmGroups = invitations.reduce((acc, inv) => {
            if (!acc[inv.farmId]) acc[inv.farmId] = [];
            acc[inv.farmId].push(inv);
            return acc;
        }, {} as Record<string, OldInvitation[]>);

        console.log('Invitations by farm:');
        Object.entries(farmGroups).forEach(([farmId, invs]) => {
            console.log(`  Farm ${farmId}: ${invs.length} invitation(s)`);
        });
        console.log('');

        // Step 2: Display migration plan
        console.log('[2/5] Migration Plan:\n');
        invitations.forEach((inv, index) => {
            console.log(`  ${index + 1}. ${inv.id}`);
            console.log(`     From: invitations/${inv.id}`);
            console.log(`     To:   farms/${inv.farmId}/invitations/${inv.id}`);
            console.log(`     Email: ${inv.email} | Status: ${inv.status}`);
            console.log('');
        });

        // Step 3: Confirm execution (if not dry run)
        if (!isDryRun) {
            console.log('⚠️  WARNING: This will modify your Firestore database!');
            const confirmed = await confirm('Proceed with migration?');
            if (!confirmed) {
                console.log('\n❌ Migration cancelled by user.\n');
                process.exit(0);
            }
            console.log('');
        }

        // Step 4: Migrate invitations
        console.log('[3/5] Migrating invitations...\n');

        let migratedCount = 0;
        let errorCount = 0;
        const errors: { invitationId: string; error: string }[] = [];

        // Process in batches of 500 (Firestore batch limit)
        const BATCH_SIZE = 500;
        for (let i = 0; i < invitations.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchInvitations = invitations.slice(i, i + BATCH_SIZE);

            for (const invitation of batchInvitations) {
                try {
                    // Create document in new location
                    const newPath = `farms/${invitation.farmId}/invitations/${invitation.id}`;
                    const newDocRef = doc(db, 'farms', invitation.farmId, 'invitations', invitation.id);

                    // Copy all data (excluding the old 'id' field if it exists as data)
                    const { id, ...invitationData } = invitation;
                    batch.set(newDocRef, invitationData);

                    // Mark old document as migrated (don't delete yet for safety)
                    const oldDocRef = doc(db, 'invitations', invitation.id);
                    batch.update(oldDocRef, {
                        migrated: true,
                        migratedAt: new Date().toISOString(),
                        newPath: newPath
                    });

                    if (isDryRun) {
                        console.log(`  ✓ [DRY RUN] Would migrate: ${invitation.id} → ${newPath}`);
                    }
                } catch (error: any) {
                    errors.push({ invitationId: invitation.id, error: error.message });
                    errorCount++;
                    console.error(`  ✗ Error preparing ${invitation.id}: ${error.message}`);
                }
            }

            // Commit batch
            if (!isDryRun) {
                try {
                    await batch.commit();
                    migratedCount += batchInvitations.length - errorCount;
                    console.log(`  ✓ Migrated batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchInvitations.length} invitations`);
                } catch (error: any) {
                    console.error(`  ✗ Error committing batch: ${error.message}`);
                    errorCount += batchInvitations.length;
                }
            } else {
                migratedCount += batchInvitations.length;
            }
        }

        console.log('');

        // Step 5: Verify migration
        if (!isDryRun) {
            console.log('[4/5] Verifying migration...\n');

            let verifiedCount = 0;
            for (const farmId of Object.keys(farmGroups)) {
                const farmInvitationsRef = collection(db, 'farms', farmId, 'invitations');
                const farmSnapshot = await getDocs(farmInvitationsRef);

                const expectedCount = farmGroups[farmId].length;
                const actualCount = farmSnapshot.size;

                if (actualCount === expectedCount) {
                    console.log(`  ✓ Farm ${farmId}: ${actualCount}/${expectedCount} invitations verified`);
                    verifiedCount += actualCount;
                } else {
                    console.error(`  ✗ Farm ${farmId}: Mismatch! Expected ${expectedCount}, found ${actualCount}`);
                }
            }
            console.log('');
            console.log(`Verification: ${verifiedCount}/${invitations.length} invitations confirmed\n`);
        } else {
            console.log('[4/5] Skipping verification (dry run)\n');
        }

        // Step 6: Summary
        console.log('[5/5] Migration Summary:\n');
        console.log(`  Total invitations: ${invitations.length}`);
        console.log(`  ${isDryRun ? 'Would migrate' : 'Migrated'}: ${migratedCount}`);
        console.log(`  Errors: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\n  Errors:');
            errors.forEach(({ invitationId, error }) => {
                console.log(`    - ${invitationId}: ${error}`);
            });
        }

        console.log('');

        if (isDryRun) {
            console.log('🔍 DRY RUN COMPLETE\n');
            console.log('To execute migration, run:');
            console.log('  npx tsx scripts/migrate-invitations-to-subcollection.ts --execute\n');
        } else {
            if (errorCount === 0) {
                console.log('✅ MIGRATION COMPLETE!\n');
                console.log('Next steps:');
                console.log('  1. Verify application functionality');
                console.log('  2. Monitor for errors over 7 days');
                console.log('  3. Run cleanup script to remove old invitations\n');
            } else {
                console.log('⚠️  MIGRATION COMPLETED WITH ERRORS\n');
                console.log('Please review errors above and re-run migration for failed invitations.\n');
            }
        }

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run migration
migrateInvitations()
    .then(() => {
        console.log('✨ Script completed');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Fatal error:', err);
        process.exit(1);
    });
