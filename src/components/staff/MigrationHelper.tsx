import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { FarmMemberService } from '../../services/FarmMemberService';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Migration Helper Component
 * Shows a warning if the farm needs migration and provides a button to migrate
 */
export const MigrationHelper: React.FC = () => {
    const { currentFarm, refreshFarm } = useFarm();
    const { user } = useAuth();
    const [migrating, setMigrating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check if migration is needed
    const needsMigration = currentFarm &&
        !currentFarm.migratedAt &&
        currentFarm.members &&
        currentFarm.members.length > 0;

    const handleMigrate = async () => {
        if (!currentFarm || !user) return;

        setMigrating(true);
        setError(null);
        setSuccess(false);

        try {
            console.log('[Migration] Starting migration for farm:', currentFarm.name);

            const members = currentFarm.members || [];
            const memberIds: string[] = [];

            // Migrate each member to subcollection
            for (const member of members) {
                const permissions = {
                    canAccessFinances: member.role === 'owner' ? true : ((member as any).canAccessFinances || false),
                    canManageAnimals: member.role === 'owner' || member.role === 'manager',
                    canManageTasks: true,
                    canManageInventory: member.role === 'owner' || member.role === 'manager',
                    canManageStaff: member.role === 'owner',
                    canViewReports: true
                };

                // Prepare member data, only including defined fields
                const memberData: any = {
                    userId: member.userId,
                    displayName: member.displayName || (member as any).name || 'Member',
                    email: member.email || '',
                    role: member.role,
                    permissions,
                    status: member.status || 'active',
                    joinedAt: member.joinedAt || new Date().toISOString()
                };

                // Only add optional fields if they have values
                if (member.phone) memberData.phone = member.phone;
                if (member.photoUrl) memberData.photoUrl = member.photoUrl;
                if ((member as any).invitedBy) memberData.invitedBy = (member as any).invitedBy;

                await FarmMemberService.addMember(currentFarm.id, memberData);

                memberIds.push(member.userId);
                console.log('[Migration] Migrated member:', memberData.displayName);
            }

            // Mark farm as migrated
            const farmRef = doc(db, 'farms', currentFarm.id);
            await updateDoc(farmRef, {
                migratedAt: new Date().toISOString()
            });

            console.log('[Migration] Farm migrated successfully!');
            setSuccess(true);

            // Refresh farm data
            setTimeout(() => {
                refreshFarm();
                window.location.reload(); // Force reload to clear cache
            }, 1000);

        } catch (err: any) {
            console.error('[Migration] Error:', err);
            setError(err.message || 'Erreur lors de la migration');
        } finally {
            setMigrating(false);
        }
    };

    if (!needsMigration) return null;

    if (success) {
        return (
            <div className="mb-6 p-4 bg-slate-100 border border-primary-400 rounded-lg">
                <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-slate-900 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-emerald-900">Migration réussie !</h3>
                        <p className="text-sm text-slate-900 mt-1">
                            La page va se recharger automatiquement...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-semibold text-amber-900">Migration requise</h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Votre ferme utilise l'ancien format. Cliquez sur "Migrer" pour mettre à jour vers la nouvelle architecture multi-utilisateurs.
                    </p>
                    {error && (
                        <p className="text-sm text-red-600 mt-2">
                            Erreur: {error}
                        </p>
                    )}
                    <Button
                        onClick={handleMigrate}
                        disabled={migrating}
                        className="mt-3"
                        size="sm"
                    >
                        {migrating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Migration en cours...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Migrer maintenant
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
