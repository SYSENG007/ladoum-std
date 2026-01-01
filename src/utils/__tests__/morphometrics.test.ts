/**
 * Tests for Morphometrics V1.1
 * Validates trait predictions with confidence qualification
 */

import {
    predictTrait,
    calculateMorphometricScore
} from '../morphometrics';
import type { Animal } from '../../types';

// Helper to create mock animal with measurements
function createAnimal(
    id: string,
    name: string,
    gender: 'Male' | 'Female',
    measurements?: { hg: number; lcs: number; tp: number },
    sireId?: string,
    damId?: string
): Animal {
    return {
        id,
        name,
        tagId: id,
        gender,
        status: 'Active',
        birthDate: '2020-01-01',
        sireId,
        damId,
        height: measurements?.hg,
        length: measurements?.lcs,
        chestGirth: measurements?.tp
    } as Animal;
}

describe('predictTrait V1.1', () => {
    /**
     * PRD Cas A: Les deux parents mesurés
     * Confidence attendue: ≥ 0.75
     * DataBasis: BOTH_PARENTS_MEASURED
     */
    test('Cas A: 2 parents mesurés → confidence ≥ 0.75', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const herd = [sire, dam];

        const result = predictTrait('HG', sire, dam, herd, 0.40);

        expect(result.mean).not.toBeNull();
        expect(result.confidence).toBeGreaterThanOrEqual(0.75);
        expect(result.dataBasis).toBe('BOTH_PARENTS_MEASURED');
        expect(result.min).not.toBeNull();
        expect(result.max).not.toBeNull();
        expect(result.max).toBeGreaterThan(result.min!);
    });

    /**
     * PRD Cas B: Un seul parent mesuré
     * Confidence attendue: ≈ 0.45-0.6
     * DataBasis: ONE_PARENT_MEASURED
     */
    test('Cas B: 1 parent mesuré → confidence 0.45-0.6', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female'); // No measurements
        const herd = [sire, dam];

        const result = predictTrait('HG', sire, dam, herd, 0.40);

        expect(result.mean).not.toBeNull();
        expect(result.confidence).toBeGreaterThanOrEqual(0.45);
        expect(result.confidence).toBeLessThanOrEqual(0.6);
        expect(result.dataBasis).toBe('ONE_PARENT_MEASURED');
    });

    /**
     * PRD Cas C: Aucun parent mesuré (population seulement)
     * Confidence attendue: < 0.4
     * DataBasis: POPULATION_ONLY
     */
    test('Cas C: Population seulement → confidence < 0.4', () => {
        const sire = createAnimal('S1', 'Sire', 'Male');
        const dam = createAnimal('D1', 'Dam', 'Female');
        // But herd has other animals with measurements
        const other1 = createAnimal('O1', 'Other1', 'Male', { hg: 95, lcs: 105, tp: 100 });
        const other2 = createAnimal('O2', 'Other2', 'Female', { hg: 93, lcs: 103, tp: 98 });
        const herd = [sire, dam, other1, other2];

        const result = predictTrait('HG', sire, dam, herd, 0.40);

        expect(result.mean).not.toBeNull();
        expect(result.confidence).toBeLessThan(0.4);
        expect(result.dataBasis).toBe('POPULATION_ONLY');
    });

    /**
     * PRD Cas D: Aucune donnée disponible
     * Mean: null
     * Confidence: 0
     * DataBasis: INSUFFICIENT_DATA
     */
    test('Cas D: Aucune donnée → INSUFFICIENT_DATA', () => {
        const sire = createAnimal('S1', 'Sire', 'Male');
        const dam = createAnimal('D1', 'Dam', 'Female');
        const herd = [sire, dam]; // No measurements anywhere

        const result = predictTrait('HG', sire, dam, herd, 0.40);

        expect(result.mean).toBeNull();
        expect(result.min).toBeNull();
        expect(result.max).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.dataBasis).toBe('INSUFFICIENT_DATA');
    });

    /**
     * Test: Intervalle plus large avec 1 parent vs 2 parents
     */
    test('Intervalle plus large avec 1 parent vs 2 parents', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam1 = createAnimal('D1', 'Dam1', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const dam2 = createAnimal('D2', 'Dam2', 'Female'); // No measurements
        const herd = [sire, dam1, dam2];

        const result2Parents = predictTrait('HG', sire, dam1, herd, 0.40);
        const result1Parent = predictTrait('HG', sire, dam2, herd, 0.40);

        const interval2Parents = result2Parents.max! - result2Parents.min!;
        const interval1Parent = result1Parent.max! - result1Parent.min!;

        expect(interval1Parent).toBeGreaterThan(interval2Parents);
    });

    /**
     * Test: Heritability affects prediction
     */
    test('Higher heritability = closer to parents average', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 110, lcs: 120, tp: 115 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 90, lcs: 100, tp: 95 });
        const herd = [sire, dam];

        const lowHerit = predictTrait('HG', sire, dam, herd, 0.1);
        const highHerit = predictTrait('HG', sire, dam, herd, 0.9);

        const parentsAvg = (110 + 90) / 2; // 100

        // High heritability should be closer to parents average
        expect(Math.abs(highHerit.mean! - parentsAvg)).toBeLessThan(
            Math.abs(lowHerit.mean! - parentsAvg)
        );
    });
});

describe('calculateMorphometricScore V1.1', () => {
    /**
     * Test: Score calculable avec 2 parents mesurés
     */
    test('Score calculable avec 2 parents mesurés', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const herd = [sire, dam];

        const result = calculateMorphometricScore(sire, dam, herd);

        expect(result.overallScore).not.toBeNull();
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.hg.mean).not.toBeNull();
        expect(result.lcs.mean).not.toBeNull();
        expect(result.tp.mean).not.toBeNull();
    });

    /**
     * Test: Score null si aucun parent mesuré et pas de herd
     */
    test('Score null si données insuffisantes', () => {
        const sire = createAnimal('S1', 'Sire', 'Male');
        const dam = createAnimal('D1', 'Dam', 'Female');
        const herd = [sire, dam];

        const result = calculateMorphometricScore(sire, dam, herd);

        expect(result.overallScore).toBeNull();
        expect(result.confidence).toBe(0);
    });

    /**
     * Test: Confidence moyenne des traits individuels
     */
    test('Confidence globale = moyenne des confidences traits', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const herd = [sire, dam];

        const result = calculateMorphometricScore(sire, dam, herd);

        const avgConfidence = (
            result.hg.confidence +
            result.lcs.confidence +
            result.tp.confidence
        ) / 3;

        expect(result.confidence).toBeCloseTo(avgConfidence, 2);
    });

    /**
     * Test: Score > 50 si animaux au-dessus moyenne
     */
    test('Score > 50 si parents au-dessus moyenne du troupeau', () => {
        // Créer un troupeau avec moyenne basse
        const herd = [
            createAnimal('H1', 'Herd1', 'Male', { hg: 85, lcs: 95, tp: 90 }),
            createAnimal('H2', 'Herd2', 'Female', { hg: 87, lcs: 97, tp: 92 }),
            createAnimal('H3', 'Herd3', 'Male', { hg: 86, lcs: 96, tp: 91 })
        ];

        // Parents au-dessus de la moyenne
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        herd.push(sire, dam);

        const result = calculateMorphometricScore(sire, dam, herd);

        expect(result.overallScore).toBeGreaterThan(50);
    });

    /**
     * Test: Score < 50 si animaux en-dessous moyenne
     */
    test('Score < 50 si parents en-dessous moyenne du troupeau', () => {
        // Créer un troupeau avec moyenne haute
        const herd = [
            createAnimal('H1', 'Herd1', 'Male', { hg: 105, lcs: 115, tp: 110 }),
            createAnimal('H2', 'Herd2', 'Female', { hg: 107, lcs: 117, tp: 112 }),
            createAnimal('H3', 'Herd3', 'Male', { hg: 106, lcs: 116, tp: 111 })
        ];

        // Parents en-dessous de la moyenne
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 90, lcs: 100, tp: 95 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 88, lcs: 98, tp: 93 });
        herd.push(sire, dam);

        const result = calculateMorphometricScore(sire, dam, herd);

        expect(result.overallScore).toBeLessThan(50);
    });

    /**
     * Test: All traits have same dataBasis when both parents measured
     */
    test('Tous les traits ont même dataBasis avec 2 parents mesurés', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const herd = [sire, dam];

        const result = calculateMorphometricScore(sire, dam, herd);

        expect(result.hg.dataBasis).toBe('BOTH_PARENTS_MEASURED');
        expect(result.lcs.dataBasis).toBe('BOTH_PARENTS_MEASURED');
        expect(result.tp.dataBasis).toBe('BOTH_PARENTS_MEASURED');
    });
});
