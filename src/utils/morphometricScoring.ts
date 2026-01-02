/**
 * Morphometric Scoring Service V1.2
 * Calculate individual animal scores and classifications
 */

import type { Animal } from '../types';
import type {
    MorphometricScore,
    MorphometricClass,
    HerdStatistics,
    ScoringWeights,
    ZScore
} from '../types/morphometric';
import {
    calculateZScore,
    zScoreToPercentile,
    normalizeZScore,
    weightedAverage
} from './statisticsUtils';
import { getLatestMeasurements } from './morphometrics';

// Default scoring weights (configurable per farm in future)
export const DEFAULT_WEIGHTS: ScoringWeights = {
    length: 0.30,      // 30% - Most important for Ladoum standard
    height: 0.20,      // 20%
    chest: 0.20,       // 20%
    mass: 0.20,        // 20%
    functional: 0.10,  // 10% - Reserved for future (aplombs)
};

/**
 * Calculate complete morphometric score for an animal
 */
export function calculateMorphometricScore(
    animal: Animal,
    herdStats: HerdStatistics,
    weights: ScoringWeights = DEFAULT_WEIGHTS
): MorphometricScore {
    const measurements = getLatestMeasurements(animal);

    // Calculate Z-scores for each metric
    const massZScore = measurements && measurements.hg > 0
        ? createZScore(measurements.hg, herdStats.mean.mass, herdStats.stdDev.mass)
        : null;

    const heightZScore = measurements && measurements.hg > 0
        ? createZScore(measurements.hg, herdStats.mean.height, herdStats.stdDev.height)
        : null;

    const lengthZScore = measurements && measurements.lcs > 0
        ? createZScore(measurements.lcs, herdStats.mean.length, herdStats.stdDev.length)
        : null;

    const chestZScore = measurements && measurements.tp > 0
        ? createZScore(measurements.tp, herdStats.mean.chest, herdStats.stdDev.chest)
        : null;

    // Functional score not yet implemented
    const functionalZScore = null;

    // Breakdown object
    const breakdown = {
        mass: massZScore,
        height: heightZScore,
        length: lengthZScore,
        chest: chestZScore,
        functional: functionalZScore,
    };

    // Calculate confidence based on available metrics
    const confidence = calculateConfidence(breakdown);

    // Calculate weighted global score
    const globalScore = calculateGlobalScore(breakdown, weights);

    // Determine classification
    const classification = getClassification(globalScore);

    // Calculate overall percentile
    const percentile = calculateOverallPercentile(breakdown, weights);

    // Generate summary
    const summary = generateMorphologicalSummary(globalScore, classification, breakdown, animal);

    return {
        globalScore: Math.round(globalScore),
        classification,
        percentile: Math.round(percentile),
        confidence,
        breakdown,
        weights,
        summary,
    };
}

/**
 * Create a ZScore object from a measurement
 */
function createZScore(
    value: number,
    mean: number,
    stdDev: number
): ZScore {
    const zScore = calculateZScore(value, mean, stdDev);
    const percentile = zScoreToPercentile(zScore);

    return {
        value,
        zScore,
        percentile,
        available: true,
    };
}

/**
 * Calculate global score from Z-scores with weights
 */
function calculateGlobalScore(
    breakdown: MorphometricScore['breakdown'],
    weights: ScoringWeights
): number {
    const scores: Array<{ value: number; weight: number }> = [];

    if (breakdown.mass?.available) {
        scores.push({
            value: normalizeZScore(breakdown.mass.zScore),
            weight: weights.mass,
        });
    }

    if (breakdown.height?.available) {
        scores.push({
            value: normalizeZScore(breakdown.height.zScore),
            weight: weights.height,
        });
    }

    if (breakdown.length?.available) {
        scores.push({
            value: normalizeZScore(breakdown.length.zScore),
            weight: weights.length,
        });
    }

    if (breakdown.chest?.available) {
        scores.push({
            value: normalizeZScore(breakdown.chest.zScore),
            weight: weights.chest,
        });
    }

    if (breakdown.functional?.available) {
        scores.push({
            value: normalizeZScore(breakdown.functional.zScore),
            weight: weights.functional,
        });
    }

    if (scores.length === 0) return 50; // No data = average score

    return weightedAverage(scores);
}

/**
 * Calculate overall percentile from individual metric percentiles
 */
function calculateOverallPercentile(
    breakdown: MorphometricScore['breakdown'],
    weights: ScoringWeights
): number {
    const percentiles: Array<{ value: number; weight: number }> = [];

    if (breakdown.mass?.available) {
        percentiles.push({ value: breakdown.mass.percentile, weight: weights.mass });
    }
    if (breakdown.height?.available) {
        percentiles.push({ value: breakdown.height.percentile, weight: weights.height });
    }
    if (breakdown.length?.available) {
        percentiles.push({ value: breakdown.length.percentile, weight: weights.length });
    }
    if (breakdown.chest?.available) {
        percentiles.push({ value: breakdown.chest.percentile, weight: weights.chest });
    }
    if (breakdown.functional?.available) {
        percentiles.push({ value: breakdown.functional.percentile, weight: weights.functional });
    }

    if (percentiles.length === 0) return 50;

    return weightedAverage(percentiles);
}

/**
 * Determine classification based on score
 */
export function getClassification(score: number): MorphometricClass {
    if (score >= 80) return 'Elite';
    if (score >= 65) return 'TresBon';
    if (score >= 50) return 'Moyen';
    return 'Faible';
}

/**
 * Get human-readable label for classification
 */
export function getClassificationLabel(classification: MorphometricClass): string {
    const labels: Record<MorphometricClass, string> = {
        Elite: 'Elite',
        TresBon: 'Très bon',
        Moyen: 'Moyen',
        Faible: 'Faible',
    };
    return labels[classification];
}

/**
 * Calculate confidence based on data availability
 * Confidence = (available metrics / expected metrics)
 */
export function calculateConfidence(
    breakdown: MorphometricScore['breakdown']
): number {
    const totalMetrics = 4; // mass, height, length, chest (functional not counted yet)
    let availableMetrics = 0;

    if (breakdown.mass?.available) availableMetrics++;
    if (breakdown.height?.available) availableMetrics++;
    if (breakdown.length?.available) availableMetrics++;
    if (breakdown.chest?.available) availableMetrics++;

    return availableMetrics / totalMetrics;
}

/**
 * Generate automatic morphological summary text
 */
export function generateMorphologicalSummary(
    _score: number,
    classification: MorphometricClass,
    breakdown: MorphometricScore['breakdown'],
    _animal: Animal
): string {
    const parts: string[] = [];

    // Overall assessment
    if (classification === 'Elite') {
        parts.push('Animal d\'exception');
    } else if (classification === 'TresBon') {
        parts.push('Très bon sujet');
    } else if (classification === 'Moyen') {
        parts.push('Sujet standard');
    } else {
        parts.push('Potentiel d\'amélioration');
    }

    // Standout traits (top percentile)
    const standouts: string[] = [];
    if (breakdown.length?.percentile && breakdown.length.percentile >= 75) {
        standouts.push('excellente longueur corporelle');
    }
    if (breakdown.height?.percentile && breakdown.height.percentile >= 75) {
        standouts.push('très bonne hauteur');
    }
    if (breakdown.chest?.percentile && breakdown.chest.percentile >= 75) {
        standouts.push('tour de poitrine remarquable');
    }
    if (breakdown.mass?.percentile && breakdown.mass.percentile >= 75) {
        standouts.push('masse supérieure');
    }

    if (standouts.length > 0) {
        parts.push(standouts.join(', '));
    }

    // Body type description
    if (breakdown.length && breakdown.height) {
        const ratio = breakdown.length.value / breakdown.height.value;
        if (ratio > 1.15) {
            parts.push('profil longiligne recherché pour le standard Ladoum');
        } else if (ratio < 1.05) {
            parts.push('morphologie compacte');
        }
    }

    return parts.join(', ') + '.';
}
