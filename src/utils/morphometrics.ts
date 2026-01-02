/**
 * Morphometric Utilities for Ladoum Sheep Breeding V1.1
 * Predicts offspring measurements with confidence qualification
 * 
 * V1.1 Changes:
 * - Returns PredictedTrait with confidence (0-1) instead of string labels
 * - Returns MorphometricScore with qualified confidence
 * - null instead of defaults when data insufficient
 * - Explicit data basis for each prediction
 */

import type { Animal, MorphometricPrediction, Measurement } from '../types';
import type { PredictedTrait, MorphometricScore } from '../types/breeding';

// Default herd averages for Ladoum sheep
const DEFAULT_HERD_AVERAGES = {
    hg: 95,   // Hauteur au garrot (cm)
    lcs: 105, // Longueur corps (cm)
    tp: 100   // Tour de poitrine (cm)
};

// Heritability estimates for morphometric traits (sheep)
const HERITABILITY = {
    hg: 0.40,   // Height: 40% heritable
    lcs: 0.35,  // Length: 35% heritable
    tp: 0.30    // Chest: 30% heritable
};

/**
 * Get the latest morphometric measurements from an animal
 */
export function getLatestMeasurements(animal: Animal): {
    weight: number;
    hg: number;
    lcs: number;
    tp: number;
} | null {
    if (animal.measurements && animal.measurements.length > 0) {
        const latest = animal.measurements[animal.measurements.length - 1];
        return {
            weight: latest.weight,
            hg: latest.height_hg,
            lcs: latest.length_lcs,
            tp: latest.chest_tp
        };
    }

    if (animal.weight && animal.height && animal.length && animal.chestGirth) {
        return {
            weight: animal.weight,
            hg: animal.height,
            lcs: animal.length,
            tp: animal.chestGirth
        };
    }

    return null;
}

/**
 * Calculate herd averages from actual animals
 */
export function calculateHerdAverages(animals: Animal[]): {
    hg: number;
    lcs: number;
    tp: number;
} {
    const activeAnimals = animals.filter(a => a.status === 'Active');
    if (activeAnimals.length === 0) return DEFAULT_HERD_AVERAGES;

    let totalHG = 0, totalLCS = 0, totalTP = 0;
    let countHG = 0, countLCS = 0, countTP = 0;

    for (const animal of activeAnimals) {
        const measurements = getLatestMeasurements(animal);
        if (measurements) {
            if (measurements.hg > 0) { totalHG += measurements.hg; countHG++; }
            if (measurements.lcs > 0) { totalLCS += measurements.lcs; countLCS++; }
            if (measurements.tp > 0) { totalTP += measurements.tp; countTP++; }
        }
    }

    return {
        hg: countHG > 0 ? totalHG / countHG : DEFAULT_HERD_AVERAGES.hg,
        lcs: countLCS > 0 ? totalLCS / countLCS : DEFAULT_HERD_AVERAGES.lcs,
        tp: countTP > 0 ? totalTP / countTP : DEFAULT_HERD_AVERAGES.tp
    };
}

/**
 * Calculate variance for prediction interval based on heritability
 */
function calculatePredictionVariance(
    heritability: number,
    parentMeasures: number[],
    herdMean: number
): number {
    // Standard deviation increases with lower heritability and data scarcity
    const baseVariance = herdMean * 0.10; // 10% of mean
    const heritabilityFactor = 1 - heritability;
    const dataFacto = Math.max(0.5, 1 / Math.sqrt(parentMeasures.length));

    return baseVariance * heritabilityFactor * dataFacto;
}

/**
 * Predict a single morphometric trait with confidence V1.1
 * 
 * @param traitName - Which trait (HG, LCS, TP)
 * @param sire - Father animal
 * @param dam - Mother animal
 * @param allAnimals - Complete herd for population mean
 * @param heritability - Trait heritability (0-1)
 * @returns PredictedTrait with confidence and interval
 */
export function predictTrait(
    traitName: 'HG' | 'LCS' | 'TP',
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[],
    heritability: number
): PredictedTrait {
    const herdAverages = calculateHerdAverages(allAnimals);
    const herdMean = herdAverages[traitName.toLowerCase() as 'hg' | 'lcs' | 'tp'];

    const sireMeasure = getLatestMeasurements(sire);
    const damMeasure = getLatestMeasurements(dam);

    const traitKey = traitName.toLowerCase() as 'hg' | 'lcs' | 'tp';
    const sireValue = sireMeasure?.[traitKey];
    const damValue = damMeasure?.[traitKey];

    // Case 1: No data at all
    if (!sireValue && !damValue && !herdMean) {
        return {
            trait: traitName,
            mean: null,
            min: null,
            max: null,
            confidence: 0,
            dataBasis: 'INSUFFICIENT_DATA'
        };
    }

    // Case 2: Both parents measured
    if (sireValue && damValue) {
        const mean = (sireValue + damValue) / 2;
        const variance = calculatePredictionVariance(heritability, [sireValue, damValue], herdMean);

        // Narrow interval, high confidence
        return {
            trait: traitName,
            mean: Math.round(mean * 10) / 10,
            min: Math.round((mean - variance) * 10) / 10,
            max: Math.round((mean + variance) * 10) / 10,
            confidence: 0.75 + (variance < 5 ? 0.15 : 0),  // 0.75-0.9
            dataBasis: 'BOTH_PARENTS_MEASURED'
        };
    }

    // Case 3: One parent measured
    if (sireValue || damValue) {
        const parentValue = (sireValue || damValue)!;

        // Regression to mean: mix parent value with population mean
        const mean = herdMean
            ? parentValue * heritability + herdMean * (1 - heritability)
            : parentValue;

        const variance = calculatePredictionVariance(heritability, [parentValue], herdMean);

        // Wider interval, medium confidence
        return {
            trait: traitName,
            mean: Math.round(mean * 10) / 10,
            min: Math.round((mean - variance * 1.5) * 10) / 10,
            max: Math.round((mean + variance * 1.5) * 10) / 10,
            confidence: 0.45 + (herdMean ? 0.15 : 0),  // 0.45-0.6
            dataBasis: 'ONE_PARENT_MEASURED'
        };
    }

    // Case 4: Population only (no parents measured)
    return {
        trait: traitName,
        mean: Math.round(herdMean * 10) / 10,
        min: Math.round((herdMean - 10) * 10) / 10,
        max: Math.round((herdMean + 10) * 10) / 10,
        confidence: 0.3,  // Low confidence
        dataBasis: 'POPULATION_ONLY'
    };
}

/**
 * Calculate complete morphometric score V1.1
 * 
 * @param sire - Father animal
 * @param dam - Mother animal  
 * @param allAnimals - Complete herd
 * @returns MorphometricScore with qualified confidence
 */
export function calculateMorphometricScore(
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[]
): MorphometricScore {
    // Predict each trait with confidence
    const hg = predictTrait('HG', sire, dam, allAnimals, HERITABILITY.hg);
    const lcs = predictTrait('LCS', sire, dam, allAnimals, HERITABILITY.lcs);
    const tp = predictTrait('TP', sire, dam, allAnimals, HERITABILITY.tp);

    const traits = [hg, lcs, tp];

    // Only compute score if at least one parent is measured
    const validTraits = traits.filter(t => t.confidence >= 0.4);

    if (validTraits.length === 0) {
        return {
            hg, lcs, tp,
            overallScore: null,
            confidence: 0
        };
    }

    // Calculate overall score based on improvement over herd average
    const herdAverages = calculateHerdAverages(allAnimals);

    let weightedScore = 0;
    let totalConfidence = 0;

    for (const trait of validTraits) {
        if (trait.mean !== null) {
            const traitKey = trait.trait.toLowerCase() as 'hg' | 'lcs' | 'tp';
            const herdMean = herdAverages[traitKey];
            const improvement = (trait.mean - herdMean) / herdMean;

            weightedScore += improvement * trait.confidence * 100;
            totalConfidence += trait.confidence;
        }
    }

    const avgConfidence = totalConfidence / traits.length;

    // Normalize score to 0-100 range (50 = average, >50 = above average)
    const normalizedScore = 50 + (weightedScore / totalConfidence);

    return {
        hg, lcs, tp,
        overallScore: Math.round(Math.max(0, Math.min(100, normalizedScore))),
        confidence: Math.round(avgConfidence * 100) / 100
    };
}

/**
 * Legacy function for backward compatibility
 * Maps to new structure
 */
export function predictOffspringMorphometrics(
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[]
): MorphometricPrediction {
    const score = calculateMorphometricScore(sire, dam, allAnimals);
    const herdAverages = calculateHerdAverages(allAnimals);

    const getConfidenceLabel = (conf: number): 'Low' | 'Medium' | 'High' => {
        if (conf >= 0.7) return 'High';
        if (conf >= 0.5) return 'Medium';
        return 'Low';
    };

    return {
        predictedHG: score.hg.mean || herdAverages.hg,
        predictedLCS: score.lcs.mean || herdAverages.lcs,
        predictedTP: score.tp.mean || herdAverages.tp,
        confidenceHG: getConfidenceLabel(score.hg.confidence),
        confidenceLCS: getConfidenceLabel(score.lcs.confidence),
        confidenceTP: getConfidenceLabel(score.tp.confidence),
        comparedToHerdAverage: {
            hg: score.hg.mean
                ? Math.round(((score.hg.mean - herdAverages.hg) / herdAverages.hg) * 100)
                : 0,
            lcs: score.lcs.mean
                ? Math.round(((score.lcs.mean - herdAverages.lcs) / herdAverages.lcs) * 100)
                : 0,
            tp: score.tp.mean
                ? Math.round(((score.tp.mean - herdAverages.tp) / herdAverages.tp) * 100)
                : 0
        }
    };
}

/**
 * Legacy function for backward compatibility
 */
export function scoreMorphometricCompatibility(
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[]
): number {
    const score = calculateMorphometricScore(sire, dam, allAnimals);
    return score.overallScore || 50;  // Default to average if not computable
}

/**
 * Calculate genetic potential score for an animal (0-100)
 */
export function calculateGeneticPotential(
    animal: Animal,
    allAnimals: Animal[]
): number {
    const herdAverages = calculateHerdAverages(allAnimals);
    const measurements = getLatestMeasurements(animal);

    if (!measurements) return 50;

    const hgScore = (measurements.hg / herdAverages.hg) * 100;
    const lcsScore = (measurements.lcs / herdAverages.lcs) * 100;
    const tpScore = (measurements.tp / herdAverages.tp) * 100;

    const rawScore = (hgScore + lcsScore + tpScore) / 3;
    return Math.min(100, Math.max(0, rawScore));
}

/**
 * Get morphometric trend from measurement history
 */
export function getMorphometricTrend(measurements: Measurement[]): {
    hgTrend: 'Increasing' | 'Stable' | 'Decreasing';
    lcsTrend: 'Increasing' | 'Stable' | 'Decreasing';
    tpTrend: 'Increasing' | 'Stable' | 'Decreasing';
    monthlyGrowth: { hg: number; lcs: number; tp: number };
} {
    if (measurements.length < 2) {
        return {
            hgTrend: 'Stable',
            lcsTrend: 'Stable',
            tpTrend: 'Stable',
            monthlyGrowth: { hg: 0, lcs: 0, tp: 0 }
        };
    }

    const sorted = [...measurements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const months = (new Date(last.date).getTime() - new Date(first.date).getTime()) /
        (1000 * 60 * 60 * 24 * 30);

    if (months === 0) {
        return {
            hgTrend: 'Stable',
            lcsTrend: 'Stable',
            tpTrend: 'Stable',
            monthlyGrowth: { hg: 0, lcs: 0, tp: 0 }
        };
    }

    const hgChange = last.height_hg - first.height_hg;
    const lcsChange = last.length_lcs - first.length_lcs;
    const tpChange = last.chest_tp - first.chest_tp;

    const getTrend = (change: number): 'Increasing' | 'Stable' | 'Decreasing' => {
        if (change > 1) return 'Increasing';
        if (change < -1) return 'Decreasing';
        return 'Stable';
    };

    return {
        hgTrend: getTrend(hgChange),
        lcsTrend: getTrend(lcsChange),
        tpTrend: getTrend(tpChange),
        monthlyGrowth: {
            hg: Math.round((hgChange / months) * 10) / 10,
            lcs: Math.round((lcsChange / months) * 10) / 10,
            tp: Math.round((tpChange / months) * 10) / 10
        }
    };
}
