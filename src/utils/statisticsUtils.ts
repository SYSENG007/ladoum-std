/**
 * Statistical Utilities for Morphometric Analysis
 * Pure functions for statistical calculations
 */

/**
 * Calculate mean (average) of an array of numbers
 */
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

/**
 * Calculate standard deviation
 * Uses sample standard deviation (N-1) for small populations
 */
export function standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;

    const avg = mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);

    return Math.sqrt(variance);
}

/**
 * Calculate Z-score (number of standard deviations from mean)
 * Z = (value - mean) / stdDev
 */
export function calculateZScore(
    value: number,
    populationMean: number,
    populationStdDev: number
): number {
    if (populationStdDev === 0) return 0; // All values identical
    return (value - populationMean) / populationStdDev;
}

/**
 * Convert Z-score to percentile using normal distribution approximation
 * Uses error function (erf) approximation for CDF
 */
export function zScoreToPercentile(zScore: number): number {
    // Approximate cumulative distribution function (CDF) of standard normal
    // Using polynomial approximation of erf
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    const cdf = zScore >= 0 ? 1 - probability : probability;
    return Math.round(cdf * 100);
}

/**
 * Calculate percentile rank of a value within a distribution
 * Direct method (not using Z-score)
 */
export function calculatePercentile(
    value: number,
    distribution: number[]
): number {
    if (distribution.length === 0) return 50;

    const sorted = [...distribution].sort((a, b) => a - b);
    const countBelow = sorted.filter(v => v < value).length;
    const countEqual = sorted.filter(v => v === value).length;

    // Percentile = (countBelow + 0.5 * countEqual) / total * 100
    const percentile = ((countBelow + 0.5 * countEqual) / distribution.length) * 100;
    return Math.round(percentile);
}

/**
 * Calculate median of an array
 */
export function median(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

/**
 * Normalize a score to 0-100 range
 * Z-scores typically range from -3 to +3 for ~99% of data
 */
export function normalizeZScore(zScore: number): number {
    // Map Z-score range [-3, 3] to [0, 100]
    // Z = -3 → 0, Z = 0 → 50, Z = +3 → 100
    const normalized = ((zScore + 3) / 6) * 100;
    return Math.max(0, Math.min(100, normalized));
}

/**
 * Calculate weighted average
 */
export function weightedAverage(
    values: Array<{ value: number; weight: number }>
): number {
    const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = values.reduce((sum, item) => sum + (item.value * item.weight), 0);
    return weightedSum / totalWeight;
}
