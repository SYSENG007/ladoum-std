/**
 * Breeding Expert Rules System V1.1
 * 
 * Rule-based system for breeding recommendations
 * Each rule can modify the breeding context and add warnings
 */

import type {
    ExpertRule,
    BreedingContext,
    AppliedRule,
    BreedingSimulationResult,
    QualifiedBreedingScore
} from '../types/breeding';
import type { Animal } from '../types';
import { calculateInbreedingCoefficient } from './genetics';
import { calculateMorphometricScore } from './morphometrics';

/**
 * R1: Insufficient Pedigree Data
 * If pedigree is incomplete, breeding score cannot be "Excellent"
 */
const RULE_R1_INSUFFICIENT_PEDIGREE: ExpertRule = {
    id: 'R1_INSUFFICIENT_PEDIGREE',
    name: 'Pedigree Incomplet',
    priority: 1,  // Execute first
    explanation: 'Sans pedigree complet, le calcul de consanguinité est impossible',
    condition: (ctx) => ctx.inbreeding.status !== 'COMPUTABLE',
    consequence: (ctx) => {
        // Downgrade to LOW_CONFIDENCE if not already worse
        if (ctx.globalScore.status === 'RELIABLE') {
            ctx.globalScore.status = 'LOW_CONFIDENCE';
        }

        ctx.warnings.push(
            `⚠️ Pedigree incomplet (${ctx.inbreeding.availableGenerations}/${ctx.inbreeding.requiredGenerations} générations). ` +
            `Le calcul de consanguinité est impossible. Renseignez les parents de chaque animal.`
        );
    }
};

/**
 * R2: High Inbreeding Risk
 * COI >= 12.5% is automatically "NotRecommended"
 */
const RULE_R2_HIGH_INBREEDING: ExpertRule = {
    id: 'R2_HIGH_INBREEDING',
    name: 'Consanguinité Élevée',
    priority: 2,
    explanation: 'COI ≥ 12.5% présente des risques génétiques importants',
    condition: (ctx) =>
        ctx.inbreeding.coefficient !== null &&
        ctx.inbreeding.coefficient >= 0.125,
    consequence: (ctx) => {
        ctx.globalScore.recommendation = 'NotRecommended';
        ctx.globalScore.status = 'RELIABLE';  // We're confident it's bad!

        ctx.warnings.push(
            `🚫 Consanguinité élevée (${(ctx.inbreeding.coefficient! * 100).toFixed(1)}%). ` +
            `Risque de dépression génétique, malformations et baisse de fertilité. Ce croisement est déconseillé.`
        );
    }
};

/**
 * R3: Low Morphometric Confidence
 * If morphometric predictions have low confidence, score is indicative only
 */
const RULE_R3_LOW_MORPHOMETRIC_CONFIDENCE: ExpertRule = {
    id: 'R3_LOW_MORPHOMETRIC_CONFIDENCE',
    name: 'Confiance Morphométrique Faible',
    priority: 3,
    explanation: 'Confiance < 50% rend les prédictions morphométriques indicatives',
    condition: (ctx) => ctx.morphometrics.confidence < 0.5,
    consequence: (ctx) => {
        // Downgrade from RELIABLE to LOW_C ONFIDENCE
        if (ctx.globalScore.status === 'RELIABLE') {
            ctx.globalScore.status = 'LOW_CONFIDENCE';
        }

        const traitsWithLowConfidence = [
            ctx.morphometrics.hg.confidence < 0.5 ? 'HG' : null,
            ctx.morphometrics.lcs.confidence < 0.5 ? 'LCS' : null,
            ctx.morphometrics.tp.confidence < 0.5 ? 'TP' : null
        ].filter(Boolean);

        ctx.warnings.push(
            `⚠️ Prédictions morphométriques peu fiables (${traitsWithLowConfidence.join(', ')}). ` +
            `Mesurez les parents pour améliorer la précision des prédictions.`
        );
    }
};

/**
 * R4: Score Not Computable
 * If both inbreeding AND morphometrics are unavailable, no recommendation possible
 */
const RULE_R4_NOT_COMPUTABLE: ExpertRule = {
    id: 'R4_NOT_COMPUTABLE',
    name: 'Score Non Calculable',
    priority: 0,  // Execute first (blocks others)
    explanation: 'Sans aucune donnée fiable, aucun conseil ne peut être donné',
    condition: (ctx) =>
        ctx.inbreeding.coefficient === null &&
        ctx.morphometrics.overallScore === null,
    consequence: (ctx) => {
        ctx.globalScore.value = null;
        ctx.globalScore.confidence = 0;
        ctx.globalScore.status = 'NOT_COMPUTABLE';
        ctx.globalScore.recommendation = 'InsufficientData';
        ctx.globalScore.explanation =
            'Données insuffisantes pour évaluer ce croisement. ' +
            'Renseignez les pedigrees (père/mère) et mesurez les animaux (HG, LCS, TP) pour obtenir une analyse.';
    }
};

/**
 * R5: Excellent Requires High Data Quality
 * "Excellent" recommendation only if both pedigree complete AND high morphometric confidence
 */
const RULE_R5_EXCELLENT_REQUIRES_ALL: ExpertRule = {
    id: 'R5_EXCELLENT_REQUIRES_ALL',
    name: 'Excellent Nécessite Données Complètes',
    priority: 4,  // Execute last (after score calculated)
    explanation: 'Un score "Excellent" exige pedigree complet ET mesures des deux parents',
    condition: (ctx) =>
        ctx.globalScore.value !== null &&
        ctx.globalScore.value >= 85 &&
        ctx.globalScore.recommendation === 'Excellent' &&  // Would be excellent
        (ctx.inbreeding.coefficient === null || ctx.morphometrics.confidence < 0.7),
    consequence: (ctx) => {
        // Downgrade from Excellent to Good
        ctx.globalScore.recommendation = 'Good';
        ctx.globalScore.status = 'LOW_CONFIDENCE';

        const reasons = [];
        if (ctx.inbreeding.coefficient === null) {
            reasons.push('pedigree incomplet');
        }
        if (ctx.morphometrics.confidence < 0.7) {
            reasons.push('mesures parentales manquantes');
        }

        ctx.warnings.push(
            `ℹ️ Score élevé mais confiance limitée (${reasons.join(', ')}). ` +
            `"Excellent" nécessite pedigree complet ET mesures des deux parents. Recommandation ajustée à "Bon".`
        );
    }
};

/**
 * All expert rules in priority order
 */
const EXPERT_RULES: ExpertRule[] = [
    RULE_R4_NOT_COMPUTABLE,      // Priority 0 - blocks everything
    RULE_R1_INSUFFICIENT_PEDIGREE, // Priority 1
    RULE_R2_HIGH_INBREEDING,      // Priority 2
    RULE_R3_LOW_MORPHOMETRIC_CONFIDENCE, // Priority 3
    RULE_R5_EXCELLENT_REQUIRES_ALL  // Priority 4 - refines final decision
];

/**
 * Apply all expert rules to a breeding context
 * Rules are executed in priority order (lower number = higher priority)
 * 
 * @param context - Mutable breeding context
 * @returns Array of applied rules with explanations
 */
export function applyExpertRules(context: BreedingContext): AppliedRule[] {
    // Sort by priority (ascending)
    const sortedRules = [...EXPERT_RULES].sort((a, b) => a.priority - b.priority);
    const appliedRules: AppliedRule[] = [];

    for (const rule of sortedRules) {
        if (rule.condition(context)) {
            // Execute rule consequence
            rule.consequence(context);

            // Record applied rule
            appliedRules.push({
                ruleId: rule.id,
                explanation: rule.explanation,
                impact: determineImpact(rule.id)
            });

            // If R4 (NOT_COMPUTABLE) was applied, stop processing
            if (rule.id === 'R4_NOT_COMPUTABLE') {
                break;
            }
        }
    }

    return appliedRules;
}

/**
 * Determine impact level of a rule
 */
function determineImpact(ruleId: string): 'BLOCKING' | 'WARNING' | 'INFO' {
    if (ruleId === 'R4_NOT_COMPUTABLE') return 'BLOCKING';
    if (ruleId === 'R2_HIGH_INBREEDING') return 'WARNING';
    return 'INFO';
}

/**
 * Calculate initial global score before expert rules
 * Combines inbreeding and morphometric scores
 */
function calculateRawGlobalScore(
    inbreedingCoefficient: number | null,
    morphometricScore: number | null,
    morphometricConfidence: number
): QualifiedBreedingScore {
    // If no data, will be handled by R4
    if (inbreedingCoefficient === null && morphometricScore === null) {
        return {
            value: null,
            confidence: 0,
            status: 'NOT_COMPUTABLE',
            recommendation: 'InsufficientData',
            explanation: ''
        };
    }

    // Calculate score components
    const morphoComponent = morphometricScore !== null
        ? morphometricScore * 0.6  // 60% weight
        : 50 * 0.6;  // Default to average if missing

    const inbreedingPenalty = inbreedingCoefficient !== null
        ? inbreedingCoefficient * 50  // 0.25 = 12.5 penalty points
        : 0;  // No penalty if unknown (will be flagged by rules)

    const inbreedingComponent = (100 - inbreedingPenalty) * 0.4;  // 40% weight

    const rawScore = Math.round(morphoComponent + inbreedingComponent);
    const finalScore = Math.max(0, Math.min(100, rawScore));

    // Calculate combined confidence
    const confidence = morphometricConfidence;  // Primary driver

    // Determine initial recommendation (may be modified by rules)
    let recommendation: QualifiedBreedingScore['recommendation'] = 'InsufficientData';

    if (inbreedingCoefficient !== null && inbreedingCoefficient >= 0.125) {
        recommendation = 'NotRecommended';  // High inbreeding
    } else if (finalScore >= 85 && confidence >= 0.7) {
        recommendation = 'Excellent';
    } else if (finalScore >= 70) {
        recommendation = 'Good';
    } else if (finalScore >= 50) {
        recommendation = 'Caution';
    } else {
        recommendation = 'NotRecommended';
    }

    return {
        value: finalScore,
        confidence,
        status: confidence >= 0.7 ? 'RELIABLE' : 'LOW_CONFIDENCE',
        recommendation,
        explanation: ''
    };
}

/**
 * Main breeding simulation function V1.1
 * Combines genetics, morphometrics, and expert rules
 * 
 * @param sire - Father animal
 * @param dam - Mother animal
 * @param allAnimals - Complete herd data
 * @returns Complete simulation result with qualified scores
 */
export function simulateBreeding(
    sire: Animal,
    dam: Animal,
    allAnimals: Animal[]
): BreedingSimulationResult {
    // Step 1: Calculate inbreeding
    const inbreeding = calculateInbreedingCoefficient(sire.id, dam.id, allAnimals);

    // Step 2: Calculate morphometrics
    const morphometrics = calculateMorphometricScore(sire, dam, allAnimals);

    // Step 3: Calculate raw global score
    const globalScore = calculateRawGlobalScore(
        inbreeding.coefficient,
        morphometrics.overallScore,
        morphometrics.confidence
    );

    // Step 4: Create breeding context
    const context: BreedingContext = {
        inbreeding,
        morphometrics,
        globalScore,
        warnings: [],
        expertRules: []
    };

    // Step 5: Apply expert rules
    const appliedRules = applyExpertRules(context);
    context.expertRules = appliedRules;

    // Step 6: Calculate expected due date (145 days gestation)
    const today = new Date();
    const expectedDueDate = new Date(today.getTime() + 145 * 24 * 60 * 60 * 1000);

    return {
        inbreeding: context.inbreeding,
        morphometrics: context.morphometrics,
        globalScore: context.globalScore,
        expertRules: context.expertRules,
        warnings: context.warnings,
        expectedDueDate
    };
}
