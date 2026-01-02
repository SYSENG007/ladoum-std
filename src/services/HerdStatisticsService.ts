/**
 * Herd Statistics Service
 * Calculate and cache herd-level morphometric statistics
 */

import { collection, doc, query, where, getDocs, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Animal } from '../types';
import type { HerdStatistics } from '../types/morphometric';
import { mean, standardDeviation, median } from '../utils/statisticsUtils';
import { getLatestMeasurements } from '../utils/morphometrics';
import { calculateMorphometricScore } from '../utils/morphometricScoring';

const CACHE_COLLECTION = 'herd_statistics';
const CACHE_TTL_HOURS = 1; // Cache valid for 1 hour

export class HerdStatisticsService {
    /**
     * Calculate complete herd statistics from all active animals
     */
    static async calculateHerdStatistics(farmId: string): Promise<HerdStatistics> {
        // Fetch all active animals for this farm
        const animalsQuery = query(
            collection(db, 'animals'),
            where('farmId', '==', farmId),
            where('status', '==', 'Active')
        );

        const snapshot = await getDocs(animalsQuery);
        const animals: Animal[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Animal));

        // Extract latest measurements for each animal
        const massValues: number[] = [];
        const heightValues: number[] = [];
        const lengthValues: number[] = [];
        const chestValues: number[] = [];

        animals.forEach(animal => {
            const measurements = getLatestMeasurements(animal);
            if (measurements) {
                if (measurements.weight > 0) massValues.push(measurements.weight);
                if (measurements.hg > 0) heightValues.push(measurements.hg);
                if (measurements.lcs > 0) lengthValues.push(measurements.lcs);
                if (measurements.tp > 0) chestValues.push(measurements.tp);
            }
        });

        // Calculate means and standard deviations
        const stats: HerdStatistics = {
            farmId,
            count: animals.length,
            mean: {
                mass: mean(massValues),
                height: mean(heightValues),
                length: mean(lengthValues),
                chest: mean(chestValues),
            },
            stdDev: {
                mass: standardDeviation(massValues),
                height: standardDeviation(heightValues),
                length: standardDeviation(lengthValues),
                chest: standardDeviation(chestValues),
            },
            distribution: {
                elite: 0,
                tresBon: 0,
                moyen: 0,
                faible: 0,
            },
            medianScore: 50,
            lastUpdated: new Date(),
            version: Date.now(),
        };

        // Calculate distribution by scoring each animal
        // (Recursive but necessary for initial calculation)
        if (animals.length >= 3) { // Minimum for stats
            const scores: number[] = [];
            let eliteCount = 0;
            let tresBonCount = 0;
            let moyenCount = 0;
            let faibleCount = 0;

            animals.forEach(animal => {
                try {
                    const score = calculateMorphometricScore(animal, stats);
                    scores.push(score.globalScore);

                    if (score.classification === 'Elite') eliteCount++;
                    else if (score.classification === 'TresBon') tresBonCount++;
                    else if (score.classification === 'Moyen') moyenCount++;
                    else faibleCount++;
                } catch (e) {
                    // Skip animals with insufficient data
                }
            });

            if (scores.length > 0) {
                stats.medianScore = median(scores);
                stats.distribution = {
                    elite: (eliteCount / scores.length) * 100,
                    tresBon: (tresBonCount / scores.length) * 100,
                    moyen: (moyenCount / scores.length) * 100,
                    faible: (faibleCount / scores.length) * 100,
                };
            }
        }

        return stats;
    }

    /**
     * Get cached statistics or calculate if needed
     */
    static async getHerdStatistics(farmId: string): Promise<HerdStatistics> {
        // Try to get from cache first
        const cached = await this.getCachedStatistics(farmId);

        if (cached && this.isCacheValid(cached)) {
            return cached;
        }

        // Calculate fresh and cache
        const fresh = await this.calculateHerdStatistics(farmId);
        await this.saveHerdStatistics(farmId, fresh);

        return fresh;
    }

    /**
     * Save statistics to cache
     */
    static async saveHerdStatistics(
        farmId: string,
        stats: HerdStatistics
    ): Promise<void> {
        const docRef = doc(db, CACHE_COLLECTION, farmId);
        await setDoc(docRef, {
            ...stats,
            lastUpdated: Timestamp.fromDate(stats.lastUpdated),
        });
    }

    /**
     * Get cached statistics
     */
    private static async getCachedStatistics(
        farmId: string
    ): Promise<HerdStatistics | null> {
        try {
            const docRef = doc(db, CACHE_COLLECTION, farmId);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) return null;

            const data = snapshot.data();
            return {
                ...data,
                lastUpdated: data.lastUpdated.toDate(),
            } as HerdStatistics;
        } catch (e) {
            console.error('Error getting cached stats:', e);
            return null;
        }
    }

    /**
     * Check if cache is still valid
     */
    private static isCacheValid(stats: HerdStatistics): boolean {
        const ageHours = (Date.now() - stats.lastUpdated.getTime()) / (1000 * 60 * 60);
        return ageHours < CACHE_TTL_HOURS;
    }

    /**
     * Invalidate cache (call after animal modification)
     */
    static async invalidateCache(farmId: string): Promise<void> {
        try {
            const docRef = doc(db, CACHE_COLLECTION, farmId);
            await setDoc(docRef, {
                version: Date.now(),
                lastUpdated: Timestamp.now(),
                invalidated: true
            }, { merge: true });
        } catch (e) {
            console.error('Error invalidating cache:', e);
        }
    }
}
