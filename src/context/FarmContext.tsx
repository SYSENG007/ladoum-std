import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { FarmService } from '../services/FarmService';
import type { Farm } from '../types/farm';

interface FarmContextType {
    currentFarm: Farm | null;
    farms: Farm[];
    loading: boolean;
    error: string | null;
    switchFarm: (farmId: string) => Promise<void>;
    refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile } = useAuth();
    const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les fermes de l'utilisateur
    const loadFarms = async () => {
        if (!user || !userProfile) {
            setFarms([]);
            setCurrentFarm(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Charger toutes les fermes de l'utilisateur
            const userFarms = await FarmService.getByUserId(user.uid);
            setFarms(userFarms);

            // Déterminer la ferme active
            let activeFarm: Farm | null = null;

            if (userProfile.activeFarmId) {
                activeFarm = userFarms.find(f => f.id === userProfile.activeFarmId) || null;
            }

            // Si pas de ferme active mais l'utilisateur a des fermes, prendre la première
            if (!activeFarm && userFarms.length > 0) {
                activeFarm = userFarms[0];
            }

            setCurrentFarm(activeFarm);
        } catch (err: any) {
            console.error('Error loading farms:', err);
            setError(err.message || 'Erreur lors du chargement des fermes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFarms();
    }, [user, userProfile?.activeFarmId]);

    const switchFarm = async (farmId: string) => {
        const farm = farms.find(f => f.id === farmId);
        if (farm) {
            setCurrentFarm(farm);
            // Note: La mise à jour du profil utilisateur est gérée dans Profile.tsx
        }
    };

    const refreshFarms = async () => {
        await loadFarms();
    };

    return (
        <FarmContext.Provider value={{
            currentFarm,
            farms,
            loading,
            error,
            switchFarm,
            refreshFarms
        }}>
            {children}
        </FarmContext.Provider>
    );
};

export const useFarm = () => {
    const context = useContext(FarmContext);
    if (context === undefined) {
        throw new Error('useFarm must be used within a FarmProvider');
    }
    return context;
};

// Hook pour obtenir l'ID de la ferme actuelle (pour les services)
export const useCurrentFarmId = (): string | null => {
    const { currentFarm } = useFarm();
    return currentFarm?.id || null;
};
