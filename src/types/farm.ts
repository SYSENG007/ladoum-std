// ============================================
// FARM TYPES
// ============================================

// Ferme avec paramètres
export interface Farm {
    id: string;
    name: string;
    location?: string;
    ownerId: string;
    memberIds: string[];       // NEW: Array of member UIDs for permission checks
    members: FarmMember[];     // DEPRECATED: Will be moved to subcollection
    settings: FarmSettings;
    createdAt: string;
    updatedAt: string;
    migratedAt?: string;      // Timestamp when farm was migrated to subcollections
}

// Permissions granulaires d'un membre
export interface FarmPermissions {
    canAccessFinances: boolean;
    canManageAnimals: boolean;
    canManageTasks: boolean;
    canManageInventory: boolean;
    canManageStaff: boolean;     // Peut inviter/retirer des membres
    canViewReports: boolean;
}

// Membre d'une ferme (utilisé dans subcollection farms/{id}/members)
export interface FarmMember {
    id: string;            // = userId (document ID)
    userId: string;
    displayName: string;
    email: string;
    phone?: string;
    photoUrl?: string;
    role: 'owner' | 'manager' | 'worker';
    permissions: FarmPermissions;  // NEW: Permissions granulaires
    status: 'active' | 'inactive' | 'pending';
    joinedAt: string;
    invitedBy?: string;    // UID de celui qui a invité
}

// Paramètres de la ferme
export interface FarmSettings {
    currency: 'XOF' | 'EUR';
    defaultBreed: string;
    heatCycleLength: number;        // jours (défaut: 17)
    heatSurveillanceWindow: number; // jours (défaut: 2)
    gestationLength: number;        // jours (défaut: 150)
    gestationSurveillanceWindow: number; // jours (défaut: 5)
}

// Paramètres par défaut pour une nouvelle ferme
export const defaultFarmSettings: FarmSettings = {
    currency: 'XOF',
    defaultBreed: 'Ladoum',
    heatCycleLength: 17,
    heatSurveillanceWindow: 2,
    gestationLength: 150,
    gestationSurveillanceWindow: 5,
};
