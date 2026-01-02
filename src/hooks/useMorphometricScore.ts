/**
 * Custom hook for morphometric scoring
 * Loads herd statistics and calculates animal score
 */

import { useState, useEffect } from 'react';
import type { Animal } from '../types';
import type { MorphometricScore, HerdStatistics, AnimalPercentiles } from '../types/morphometric';
import { HerdStatisticsService } from '../services/HerdStatisticsService';
import { calculateMorphometricScore } from '../utils/morphometricScoring';

interface UseMorphometricScoreResult {
    score: MorphometricScore | null;
    herdStats: HerdStatistics | null;
    percentiles: AnimalPercentiles | null;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to load and calculate morphometric scoring for an animal
 */
export function useMorphometricScore(animal: Animal | null): UseMorphometricScoreResult {
    const [score, setScore] = useState<MorphometricScore | null>(null);
    const [herdStats, setHerdStats] = useState<HerdStatistics | null>(null);
    const [percentiles, setPercentiles] = useState<AnimalPercentiles | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!animal) {
            setLoading(false);
            return;
        }

        if (!animal.farmId) {
            setError('Animal sans ID de ferme');
            setLoading(false);
            return;
        }

        const loadScoring = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('[useMorphometricScore] Loading stats for farm:', animal.farmId);

                // Load herd statistics (with cache)
                const stats = await HerdStatisticsService.getHerdStatistics(animal.farmId!);
                console.log('[useMorphometricScore] Herd stats loaded:', stats);
                setHerdStats(stats);

                // Check minimum herd size for statistical validity
                if (stats.count < 3) {
                    console.warn('[useMorphometricScore] Herd too small:', stats.count);
                    setError('Troupeau trop petit pour calcul statistique (minimum 3 animaux)');
                    setLoading(false);
                    return;
                }

                // Calculate animal score
                console.log('[useMorphometricScore] Calculating score for animal:', animal.name);
                const animalScore = calculateMorphometricScore(animal, stats);
                console.log('[useMorphometricScore] Score calculated:', animalScore);
                setScore(animalScore);

                // Extract percentiles for KPI display
                const animalPercentiles: AnimalPercentiles = {
                    mass: animalScore.breakdown.mass?.percentile || null,
                    height: animalScore.breakdown.height?.percentile || null,
                    length: animalScore.breakdown.length?.percentile || null,
                    chest: animalScore.breakdown.chest?.percentile || null,
                };
                setPercentiles(animalPercentiles);

            } catch (err) {
                console.error('Error loading morphometric score:', err);
                setError('Erreur lors du calcul du score morphologique');
            } finally {
                setLoading(false);
            }
        };

        loadScoring();
    }, [animal?.id, animal?.farmId]);

    return { score, herdStats, percentiles, loading, error };
}
