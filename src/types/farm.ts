// ============================================
// FARM TYPES
// ============================================

// Ferme avec paramètres
export interface Farm {
    id: string;
    name: string;
    location?: string;
    ownerId: string;
    members: FarmMember[];
    settings: FarmSettings;
    createdAt: string;
    updatedAt: string;
}

// Membre d'une ferme
export interface FarmMember {
    id?: string;           // ID du document dans Firestore
    userId: string;
    displayName: string;
    name?: string;         // Alias pour displayName (compatibilité)
    email: string;
    phone?: string;
    photoUrl?: string;
    role: 'owner' | 'manager' | 'worker';
    canAccessFinances: boolean; // Configurable pour managers
    status: 'active' | 'inactive' | 'pending';
    joinedAt: string;
}

// Paramètres de la ferme
export interface FarmSettings {
    currency: 'XOF' | 'EUR';
    defaultBreed: string;
    heatCycleLength: number; // jours (défaut: 17)
    gestationLength: number; // jours (défaut: 150)
}

// Paramètres par défaut pour une nouvelle ferme
export const defaultFarmSettings: FarmSettings = {
    currency: 'XOF',
    defaultBreed: 'Ladoum',
    heatCycleLength: 17,
    gestationLength: 150,
};
