/**
 * Types for Morphometric Scoring System V1.2
 * Statistical analysis and classification of animal morphology
 */

// Qualitative classification based on score
export type MorphometricClass = 'Elite' | 'TresBon' | 'Moyen' | 'Faible';

// Individual Z-score for a metric
export interface ZScore {
    value: number;          // Raw measurement value
    zScore: number;         // Standardized score (σ from mean)
    percentile: number;     // Position in herd (0-100)
    available: boolean;     // Whether this metric was measured
}

// Configurable scoring weights
export interface ScoringWeights {
    length: number;     // 30% default - LCS (most important)
    height: number;     // 20% default - HG
    chest: number;      // 20% default - TP
    mass: number;       // 20% default - Weight
    functional: number; // 10% default - Future: aplombs/balance
}

// Complete morphometric score for an animal
export interface MorphometricScore {
    globalScore: number;            // 0-100 overall score
    classification: MorphometricClass;
    percentile: number;             // Overall position in herd
    confidence: number;             // 0-1 based on data availability
    breakdown: {
        mass: ZScore | null;
        height: ZScore | null;
        length: ZScore | null;
        chest: ZScore | null;
        functional: ZScore | null;  // Reserved for future
    };
    weights: ScoringWeights;        // Applied weights
    summary: string;                // Auto-generated text summary
}

// Herd-level statistics
export interface HerdStatistics {
    farmId: string;
    count: number;                  // Number of active animals
    mean: {
        mass: number;
        height: number;
        length: number;
        chest: number;
    };
    stdDev: {
        mass: number;
        height: number;
        length: number;
        chest: number;
    };
    distribution: {
        elite: number;              // % animals Elite (≥80)
        tresBon: number;            // % animals Très bon (65-79)
        moyen: number;              // % animals Moyen (50-64)
        faible: number;             // % animals Faible (<50)
    };
    medianScore: number;
    lastUpdated: Date;
    version: number;                // Cache version for invalidation
}

// Percentiles for display under KPIs
export interface AnimalPercentiles {
    mass: number | null;
    height: number | null;
    length: number | null;
    chest: number | null;
}
