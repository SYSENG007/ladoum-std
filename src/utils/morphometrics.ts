/**
 * Morphometric Utilities for Ladoum Sheep Breeding
 * Predicts offspring measurements and calculates genetic potential
 */

import type { Animal, MorphometricPrediction, Measurement } from '../types';
import { getGrandparents } from './genetics';

// Default herd averages for Ladoum sheep (can be recalculated from actual data)
const DEFAULT_HERD_AVERAGES = {
    hg: 95,   // Hauteur au garrot (cm)
    lcs: 105, // Longueur corps (cm)
    tp: 100   // Tour de poitrine (cm)
};

// Weights for genetic prediction calculation
const PREDICTION_WEIGHTS = {
    parents: 0.40,       // 40% from parents
    grandparents: 0.30,  // 30% from grandparents
    descendants: 0.30    // 30% from existing descendants (if any)
};

/**
 * Get the latest morphometric measurements from an animal
 */
export function getLatestMeasurements(animal: Animal): {
    hg: number;
    lcs: number;
    tp: number;
} | null {
    // First check if animal has measurement history
    if (animal.measurements && animal.measurements.length > 0) {
        const latest = animal.measurements[animal.measurements.length - 1];
        return {
            hg: latest.height_hg,
            lcs: latest.length_lcs,
            tp: latest.chest_tp
        };
    }

    // Fallback to direct properties
    if (animal.height && animal.length && animal.chestGirth) {
        return {
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
 * Calculate average measurements from a list of animals
 */
function calculateAverageMeasurements(animals: (Animal | undefined)[]): {
    hg: number | null;
    lcs: number | null;
    tp: number | null;
} {
    const validAnimals = animals.filter((a): a is Animal => a !== undefined);
    if (validAnimals.length === 0) return { hg: null, lcs: null, tp: null };

    let totalHG = 0, totalLCS = 0, totalTP = 0;
    let countHG = 0, countLCS = 0, countTP = 0;

    for (const animal of validAnimals) {
        const measurements = getLatestMeasurements(animal);
        if (measurements) {
            if (measurements.hg > 0) { totalHG += measurements.hg; countHG++; }
            if (measurements.lcs > 0) { totalLCS += measurements.lcs; countLCS++; }
            if (measurements.tp > 0) { totalTP += measurements.tp; countTP++; }
        }
    }

    return {
        hg: countHG > 0 ? totalHG / countHG : null,
        lcs: countLCS > 0 ? totalLCS / countLCS : null,
        tp: countTP > 0 ? totalTP / countTP : null
    };
}

/**
 * Predict offspring morphometrics based on parents, grandparents, and existing descendants
 */
export function predictOffspringMorphometrics(
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[]
): MorphometricPrediction {
    const herdAverages = calculateHerdAverages(allAnimals);

    // Get parent measurements
    const sireMeasurements = getLatestMeasurements(sire);
    const damMeasurements = getLatestMeasurements(dam);

    // Get grandparents
    const sireGrandparents = getGrandparents(sire.id, allAnimals);
    const damGrandparents = getGrandparents(dam.id, allAnimals);

    // Get existing offspring of these parents (if any)
    const existingOffspring = allAnimals.filter(
        a => (a.sireId === sire.id && a.damId === dam.id) ||
            (a.sireId === dam.id && a.damId === sire.id)
    );

    // Calculate weighted predictions
    let predictedHG = herdAverages.hg;
    let predictedLCS = herdAverages.lcs;
    let predictedTP = herdAverages.tp;

    // Track data availability for confidence
    let dataPointsHG = 0;
    let dataPointsLCS = 0;
    let dataPointsTP = 0;

    // Parents contribution (40%)
    if (sireMeasurements && damMeasurements) {
        const parentAvgHG = (sireMeasurements.hg + damMeasurements.hg) / 2;
        const parentAvgLCS = (sireMeasurements.lcs + damMeasurements.lcs) / 2;
        const parentAvgTP = (sireMeasurements.tp + damMeasurements.tp) / 2;

        predictedHG = parentAvgHG;
        predictedLCS = parentAvgLCS;
        predictedTP = parentAvgTP;

        dataPointsHG += 2;
        dataPointsLCS += 2;
        dataPointsTP += 2;
    }

    // Grandparents contribution (30%)
    const grandparents = [
        sireGrandparents.paternalGrandSire,
        sireGrandparents.paternalGrandDam,
        sireGrandparents.maternalGrandSire,
        sireGrandparents.maternalGrandDam,
        damGrandparents.paternalGrandSire,
        damGrandparents.paternalGrandDam,
        damGrandparents.maternalGrandSire,
        damGrandparents.maternalGrandDam
    ];

    const grandparentAvg = calculateAverageMeasurements(grandparents);

    if (grandparentAvg.hg !== null) {
        predictedHG = predictedHG * PREDICTION_WEIGHTS.parents +
            grandparentAvg.hg * PREDICTION_WEIGHTS.grandparents +
            herdAverages.hg * PREDICTION_WEIGHTS.descendants;
        dataPointsHG += grandparents.filter(g => g !== undefined).length;
    }

    if (grandparentAvg.lcs !== null) {
        predictedLCS = predictedLCS * PREDICTION_WEIGHTS.parents +
            grandparentAvg.lcs * PREDICTION_WEIGHTS.grandparents +
            herdAverages.lcs * PREDICTION_WEIGHTS.descendants;
        dataPointsLCS += grandparents.filter(g => g !== undefined).length;
    }

    if (grandparentAvg.tp !== null) {
        predictedTP = predictedTP * PREDICTION_WEIGHTS.parents +
            grandparentAvg.tp * PREDICTION_WEIGHTS.grandparents +
            herdAverages.tp * PREDICTION_WEIGHTS.descendants;
        dataPointsTP += grandparents.filter(g => g !== undefined).length;
    }

    // Existing offspring contribution (replaces descendant part if available)
    if (existingOffspring.length > 0) {
        const offspringAvg = calculateAverageMeasurements(existingOffspring);

        if (offspringAvg.hg !== null) {
            predictedHG = predictedHG * (1 - PREDICTION_WEIGHTS.descendants) +
                offspringAvg.hg * PREDICTION_WEIGHTS.descendants;
            dataPointsHG += existingOffspring.length;
        }
        if (offspringAvg.lcs !== null) {
            predictedLCS = predictedLCS * (1 - PREDICTION_WEIGHTS.descendants) +
                offspringAvg.lcs * PREDICTION_WEIGHTS.descendants;
            dataPointsLCS += existingOffspring.length;
        }
        if (offspringAvg.tp !== null) {
            predictedTP = predictedTP * (1 - PREDICTION_WEIGHTS.descendants) +
                offspringAvg.tp * PREDICTION_WEIGHTS.descendants;
            dataPointsTP += existingOffspring.length;
        }
    }

    // Determine confidence levels based on data availability
    const getConfidence = (dataPoints: number): 'Low' | 'Medium' | 'High' => {
        if (dataPoints >= 4) return 'High';
        if (dataPoints >= 2) return 'Medium';
        return 'Low';
    };

    return {
        predictedHG: Math.round(predictedHG * 10) / 10,
        predictedLCS: Math.round(predictedLCS * 10) / 10,
        predictedTP: Math.round(predictedTP * 10) / 10,
        confidenceHG: getConfidence(dataPointsHG),
        confidenceLCS: getConfidence(dataPointsLCS),
        confidenceTP: getConfidence(dataPointsTP),
        comparedToHerdAverage: {
            hg: Math.round(((predictedHG - herdAverages.hg) / herdAverages.hg) * 100),
            lcs: Math.round(((predictedLCS - herdAverages.lcs) / herdAverages.lcs) * 100),
            tp: Math.round(((predictedTP - herdAverages.tp) / herdAverages.tp) * 100)
        }
    };
}

/**
 * Calculate genetic potential score for an animal (0-100)
 * Based on how its measurements compare to herd averages
 */
export function calculateGeneticPotential(
    animal: Animal,
    allAnimals: Animal[]
): number {
    const herdAverages = calculateHerdAverages(allAnimals);
    const measurements = getLatestMeasurements(animal);

    if (!measurements) return 50; // Default average score

    // Calculate deviation from herd average (positive = better)
    const hgScore = (measurements.hg / herdAverages.hg) * 100;
    const lcsScore = (measurements.lcs / herdAverages.lcs) * 100;
    const tpScore = (measurements.tp / herdAverages.tp) * 100;

    // Average score, capped at 0-100
    const rawScore = (hgScore + lcsScore + tpScore) / 3;
    return Math.min(100, Math.max(0, rawScore));
}

/**
 * Calculate morphometric compatibility score between two animals (0-100)
 * Higher score = better breeding pair for morphometric improvement
 */
export function scoreMorphometricCompatibility(
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[]
): number {
    const prediction = predictOffspringMorphometrics(sire, dam, allAnimals);
    const herdAverages = calculateHerdAverages(allAnimals);

    // Score based on predicted improvement over herd average
    const hgImprovement = prediction.predictedHG / herdAverages.hg;
    const lcsImprovement = prediction.predictedLCS / herdAverages.lcs;
    const tpImprovement = prediction.predictedTP / herdAverages.tp;

    // Weighted improvement score
    const avgImprovement = (hgImprovement + lcsImprovement + tpImprovement) / 3;

    // Convert to 0-100 scale (100 = average, >100 = above average)
    return Math.round(Math.min(100, avgImprovement * 100));
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

    // Sort by date
    const sorted = [...measurements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Calculate time difference in months
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
