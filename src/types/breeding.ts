/**
 * Breeding Module V1.1 - Expert System Types
 * 
 * Principles:
 * - No implicit calculations
 * - Every result includes confidence level
 * - null indicates "not computable" (never fake with 0)
 * - Explicit statuses for data quality
 */

/**
 * Inbreeding coefficient calculation result
 */
export interface InbreedingResult {
    /** Coefficient of Inbreeding (0-1), null if not computable */
    coefficient: number | null;

    /** Computation status */
    status:
    | 'COMPUTABLE'                    // Pedigree complete, COI calculated
    | 'INSUFFICIENT_PEDIGREE_DATA'    // Not enough ancestors
    | 'INCOMPLETE_GENERATIONS';       // < required generations

    /** Required pedigree depth (default: 5 generations) */
    requiredGenerations: number;

    /** Actual pedigree depth available */
    availableGenerations: number;

    /** Risk level classification */
    riskLevel: 'Low' | 'Medium' | 'High' | 'Unknown';
}

/**
 * Data basis for trait prediction
 */
export type TraitDataBasis =
    | 'BOTH_PARENTS_MEASURED'       // Confidence ≥ 0.75
    | 'ONE_PARENT_MEASURED'         // Confidence 0.45-0.6
    | 'POPULATION_ONLY'             // Confidence < 0.4
    | 'INSUFFICIENT_DATA';          // No data available

/**
 * Predicted trait with confidence interval
 */
export interface PredictedTrait {
    /** Trait name */
    trait: 'HG' | 'LCS' | 'TP';

    /** Predicted mean value (cm), null if insufficient data */
    mean: number | null;

    /** Lower bound of prediction interval */
    min: number | null;

    /** Upper bound of prediction interval */
    max: number | null;

    /** Confidence level (0-1) */
    confidence: number;

    /** What data was used for prediction */
    dataBasis: TraitDataBasis;
}

/**
 * Complete morphometric prediction score
 */
export interface MorphometricScore {
    /** Height at withers (HG) prediction */
    hg: PredictedTrait;

    /** Body length (LCS) prediction */
    lcs: PredictedTrait;

    /** Chest girth (TP) prediction */
    tp: PredictedTrait;

    /** Overall morphometric score (0-100), null if insufficient data */
    overallScore: number | null;

    /** Overall confidence (weighted average of traits) */
    confidence: number;
}

/**
 * Global breeding score status
 */
export type BreedingScoreStatus =
    | 'RELIABLE'            // High confidence, complete data
    | 'LOW_CONFIDENCE'      // Partial data, indicative only
    | 'NOT_COMPUTABLE';     // Insufficient data

/**
 * Breeding recommendation level
 */
export type BreedingRecommendation =
    | 'Excellent'           // ≥85, low inbreeding, high confidence
    | 'Good'                // ≥70, acceptable inbreeding
    | 'Caution'             // ≥50, medium inbreeding or low confidence
    | 'NotRecommended'      // <50 or high inbreeding
    | 'InsufficientData';   // Not enough data to recommend

/**
 * Qualified global breeding score
 */
export interface QualifiedBreedingScore {
    /** Score value (0-100), null if not computable */
    value: number | null;

    /** Confidence in the score (0-1) */
    confidence: number;

    /** Score reliability status */
    status: BreedingScoreStatus;

    /** Breeding recommendation */
    recommendation: BreedingRecommendation;

    /** Explanation of the status/recommendation */
    explanation: string;
}

/**
 * Impact level of an applied expert rule
 */
export type RuleImpact = 'BLOCKING' | 'WARNING' | 'INFO';

/**
 * Record of an expert rule that was applied
 */
export interface AppliedRule {
    /** Rule identifier */
    ruleId: string;

    /** Human-readable explanation */
    explanation: string;

    /** Impact level on the recommendation */
    impact: RuleImpact;
}

/**
 * Context for expert rule evaluation
 */
export interface BreedingContext {
    /** Inbreeding analysis result */
    inbreeding: InbreedingResult;

    /** Morphometric predictions */
    morphometrics: MorphometricScore;

    /** Global score (mutable by rules) */
    globalScore: QualifiedBreedingScore;

    /** Warnings accumulated by rules */
    warnings: string[];

    /** Applied expert rules */
    expertRules: AppliedRule[];
}

/**
 * Expert rule definition
 */
export interface ExpertRule {
    /** Unique rule identifier */
    id: string;

    /** Human-readable rule name */
    name: string;

    /** Condition to check if rule applies */
    condition: (context: BreedingContext) => boolean;

    /** Action to take when rule applies */
    consequence: (context: BreedingContext) => void;

    /** Explanation of what the rule checks */
    explanation: string;

    /** Execution priority (lower = earlier) */
    priority: number;
}

/**
 * Complete breeding simulation result
 */
export interface BreedingSimulationResult {
    /** Inbreeding analysis */
    inbreeding: InbreedingResult;

    /** Morphometric predictions */
    morphometrics: MorphometricScore;

    /** Qualified global score */
    globalScore: QualifiedBreedingScore;

    /** Expert rules that were applied */
    expertRules: AppliedRule[];

    /** Warnings and recommendations */
    warnings: string[];

    /** Expected due date (gestation period: 145 days) */
    expectedDueDate: Date;
}
