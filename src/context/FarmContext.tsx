import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { FarmService } from '../services/FarmService';
import type { Farm } from '../types/farm';

interface FarmContextType {
    currentFarm: Farm | null;
    loading: boolean;
    error: string | null;
    refreshFarm: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile } = useAuth();
    const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger la bergerie de l'utilisateur (mono-bergerie)
    const loadFarm = async () => {
        if (!user || !userProfile) {
            setCurrentFarm(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Support rétrocompatibilité: farmId ou activeFarmId (ancien format)
            const farmIdToLoad = userProfile.farmId || (userProfile as any).activeFarmId;

            if (farmIdToLoad) {
                const farm = await FarmService.getById(farmIdToLoad);
                setCurrentFarm(farm);
            } else {
                // Pas de bergerie associée, essayer de trouver une par userId
                const userFarms = await FarmService.getByUserId(user.uid);
                if (userFarms.length > 0) {
                    setCurrentFarm(userFarms[0]);
                } else {
                    setCurrentFarm(null);
                }
            }
        } catch (err: any) {
            console.error('Error loading farm:', err);
            setError(err.message || 'Erreur lors du chargement de la bergerie');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFarm();
    }, [user, userProfile?.farmId, (userProfile as any)?.activeFarmId]);

    const refreshFarm = async () => {
        await loadFarm();
    };

    return (
        <FarmContext.Provider value={{
            currentFarm,
            loading,
            error,
            refreshFarm
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
