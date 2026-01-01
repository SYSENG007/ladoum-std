import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FarmService } from '../services/FarmService';
import type { Farm } from '../types/farm';

export const useFarm = () => {
    const { userProfile, user } = useAuth();
    const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
    const [allFarms, setAllFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadFarms = async () => {
            if (!user) return;

            setLoading(true);
            try {
                const userFarms = await FarmService.getByUserId(user.uid);
                setAllFarms(userFarms);

                // Set current farm based on userProfile
                if (userProfile?.farmId) {
                    const current = userFarms.find((f: Farm) => f.id === userProfile.farmId);
                    setCurrentFarm(current || null);
                }
            } catch (error) {
                console.error('Error loading farms:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFarms();
    }, [user, userProfile?.farmId]);

    return {
        currentFarm,
        allFarms,
        loading,
    };
};
