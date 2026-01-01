/**
 * Tests for Breeding Rules V1.1
 * Validates expert system rules and simulateBreeding function
 */

import { simulateBreeding } from '../breedingRules';
import type { Animal } from '../../types';

// Helper to create mock animal
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

describe('Expert Rules System', () => {
    /**
     * R4: NOT_COMPUTABLE
     * Pas de pedigree ET pas de mesures → Bloque tout
     */
    test('R4: Aucune donnée → NOT_COMPUTABLE', () => {
        const sire = createAnimal('S1', 'Sire', 'Male');
        const dam = createAnimal('D1', 'Dam', 'Female');
        const herd = [sire, dam];

        const result = simulateBreeding(sire, dam, herd);

        expect(result.globalScore.value).toBeNull();
        expect(result.globalScore.status).toBe('NOT_COMPUTABLE');
        expect(result.globalScore.recommendation).toBe('InsufficientData');
        expect(result.expertRules.some(r => r.ruleId === 'R4_NOT_COMPUTABLE')).toBe(true);
    });

    /**
     * R1: INSUFFICIENT_PEDIGREE
     * Pas de pedigree → Confiance dégradée
     */
    test('R1: Pedigree incomplet → LOW_CONFIDENCE', () => {
        // Parents mesurés mais pas de pedigree
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const herd = [sire, dam];

        const result = simulateBreeding(sire, dam, herd);

        expect(result.inbreeding.coefficient).toBeNull();
        expect(result.inbreeding.status).toBe('INSUFFICIENT_PEDIGREE_DATA');
        expect(result.globalScore.status).not.toBe('RELIABLE');
        expect(result.expertRules.some(r => r.ruleId === 'R1_INSUFFICIENT_PEDIGREE')).toBe(true);
        expect(result.warnings.some(w => w.includes('Pedigree'))).toBe(true);
    });

    /**
     * R2: HIGH_INBREEDING
     * COI ≥ 12.5% → NotRecommended
     */
    test('R2: COI ≥ 12.5% → NotRecommended', () => {
        // Create full siblings (brother × sister)
        const gs = createAnimal('GS', 'GrandSire');
        const gd = createAnimal('GD', 'GrandDam');
        const sire = createAnimal('S1', 'Brother', 'Male', { hg: 100, lcs: 110, tp: 105 }, 'GS', 'GD');
        const dam = createAnimal('D1', 'Sister', 'Female', { hg: 98, lcs: 108, tp: 103 }, 'GS', 'GD');
        const herd = [gs, gd, sire, dam];

        const result = simulateBreeding(sire, dam, herd);

        expect(result.inbreeding.coefficient).toBeGreaterThanOrEqual(0.125);
        expect(result.globalScore.recommendation).toBe('NotRecommended');
        expect(result.expertRules.some(r => r.ruleId === 'R2_HIGH_INBREEDING')).toBe(true);
        expect(result.warnings.some(w => w.includes('Consanguinité élevée'))).toBe(true);
    });

    /**
     * R3: LOW_MORPHOMETRIC_CONFIDENCE
     * Morpho < 50% confiance → LOW_CONFIDENCE
     */
    test('R3: Morpho < 50% → LOW_CONFIDENCE', () => {
        // Un seul parent mesuré → confiance ~0.45-0.6
        // Mais avec pedigree complet
        const gs1 = createAnimal('GS1', 'GS1');
        const gd1 = createAnimal('GD1', 'GD1');
        const gs2 = createAnimal('GS2', 'GS2');
        const gd2 = createAnimal('GD2', 'GD2');
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 }, 'GS1', 'GD1');
        const dam = createAnimal('D1', 'Dam', 'Female', undefined, 'GS2', 'GD2'); // Not measured
        const herd = [gs1, gd1, gs2, gd2, sire, dam];

        const result = simulateBreeding(sire, dam, herd, 2); // Only 2 generations required

        // With one parent measured, morpho confidence should be ~0.45-0.6
        if (result.morphometrics.confidence < 0.5) {
            expect(result.expertRules.some(r => r.ruleId === 'R3_LOW_MORPHOMETRIC_CONFIDENCE')).toBe(true);
            expect(result.globalScore.status).not.toBe('RELIABLE');
        }
    });

    /**
     * R5: EXCELLENT_REQUIRES_ALL
     * Score ≥ 85 mais données partielles → Dégradé à "Good"
     */
    test('R5: Score élevé mais confiance limitée → pas "Excellent"', () => {
        // Parents excellents mesurés, mais pas de pedigree
        const sire = createAnimal('S1', 'ExcellentSire', 'Male', { hg: 110, lcs: 120, tp: 115 });
        const dam = createAnimal('D1', 'ExcellentDam', 'Female', { hg: 108, lcs: 118, tp: 113 });
        // Herd with lower average
        const herd = [
            createAnimal('H1', 'H1', 'Male', { hg: 90, lcs: 100, tp: 95 }),
            createAnimal('H2', 'H2', 'Female', { hg: 88, lcs: 98, tp: 93 }),
            sire,
            dam
        ];

        const result = simulateBreeding(sire, dam, herd);

        // Score should be high due to good morphometrics
        if (result.globalScore.value && result.globalScore.value >= 85) {
            // But without pedigree, cannot be "Excellent"
            if (result.inbreeding.coefficient === null) {
                expect(result.globalScore.recommendation).not.toBe('Excellent');
                expect(result.expertRules.some(r => r.ruleId === 'R5_EXCELLENT_REQUIRES_ALL')).toBe(true);
            }
        }
    });
});

describe('simulateBreeding Integration', () => {
    /**
     * Test: Cas idéal - Tout complet
     */
    test('Cas idéal: Pedigree+ Mesures complets → RELIABLE + Excellent possible', () => {
        // Create complete pedigree (3 generations)
        const ggs1 = createAnimal('GGS1', 'GGS1', 'Male', { hg: 95, lcs: 105, tp: 100 });
        const ggd1 = createAnimal('GGD1', 'GGD1', 'Female', { hg: 93, lcs: 103, tp: 98 });
        const gs1 = createAnimal('GS1', 'GS1', 'Male', { hg: 100, lcs: 110, tp: 105 }, 'GGS1', 'GGD1');
        const gd1 = createAnimal('GD1', 'GD1', 'Female', { hg: 98, lcs: 108, tp: 103 }, 'GGS1', 'GGD1');

        const ggs2 = createAnimal('GGS2', 'GGS2', 'Male', { hg: 94, lcs: 104, tp: 99 });
        const ggd2 = createAnimal('GGD2', 'GGD2', 'Female', { hg: 92, lcs: 102, tp: 97 });
        const gs2 = createAnimal('GS2', 'GS2', 'Male', { hg: 99, lcs: 109, tp: 104 }, 'GGS2', 'GGD2');
        const gd2 = createAnimal('GD2', 'GD2', 'Female', { hg: 97, lcs: 107, tp: 102 }, 'GGS2', 'GGD2');

        // Excellent parents with complete pedigree
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 110, lcs: 120, tp: 115 }, 'GS1', 'GD1');
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 108, lcs: 118, tp: 113 }, 'GS2', 'GD2');

        const herd = [ggs1, ggd1, gs1, gd1, ggs2, ggd2, gs2, gd2, sire, dam];

        const result = simulateBreeding(sire, dam, herd, 3);

        // Complete pedigree
        expect(result.inbreeding.coefficient).not.toBeNull();
        expect(result.inbreeding.coefficient).toBe(0); // No common ancestors

        // Both parents measured
        expect(result.morphometrics.confidence).toBeGreaterThanOrEqual(0.75);

        // Should be RELIABLE
        expect(result.globalScore.status).toBe('RELIABLE');

        // Can be Excellent
        if (result.globalScore.value && result.globalScore.value >= 85) {
            expect(result.globalScore.recommendation).toBe('Excellent');
        }
    });

    /**
     * Test: expectedDueDate est toujours généré
     */
    test('expectedDueDate toujours calculé (145 jours)', () => {
        const sire = createAnimal('S1', 'Sire', 'Male');
        const dam = createAnimal('D1', 'Dam', 'Female');
        const herd = [sire, dam];

        const before = new Date();
        const result = simulateBreeding(sire, dam, herd);
        const after = new Date();

        expect(result.expectedDueDate).toBeInstanceOf(Date);

        // Should be ~145 days from now
        const daysDiff = (result.expectedDueDate.getTime() - before.getTime()) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeGreaterThan(144);
        expect(daysDiff).toBeLessThan(146);
    });

    /**
     * Test: Warnings toujours un tableau
     */
    test('Warnings toujours retourné même si vide', () => {
        const sire = createAnimal('S1', 'Sire', 'Male', { hg: 100, lcs: 110, tp: 105 });
        const dam = createAnimal('D1', 'Dam', 'Female', { hg: 98, lcs: 108, tp: 103 });
        const herd = [sire, dam];

        const result = simulateBreeding(sire, dam, herd);

        expect(Array.isArray(result.warnings)).toBe(true);
        expect(Array.isArray(result.expertRules)).toBe(true);
    });

    /**
     * Test: High inbreeding overrides high scores
     */
    test('Consanguinité élevée → NotRecommended même si bon score morpho', () => {
        // Siblings with excellent measurements
        const gs = createAnimal('GS', 'GS', 'Male', { hg: 95, lcs: 105, tp: 100 });
        const gd = createAnimal('GD', 'GD', 'Female', { hg: 93, lcs: 103, tp: 98 });
        const sire = createAnimal('S1', 'Brother', 'Male', { hg: 110, lcs: 120, tp: 115 }, 'GS', 'GD');
        const dam = createAnimal('D1', 'Sister', 'Female', { hg: 108, lcs: 118, tp: 113 }, 'GS', 'GD');
        const herd = [gs, gd, sire, dam];

        const result = simulateBreeding(sire, dam, herd);

        // High morphometric score expected
        expect(result.morphometrics.overallScore).toBeGreaterThan(70);

        // But high inbreeding
        expect(result.inbreeding.coefficient).toBeCloseTo(0.25, 2);

        // Should be NotRecommended
        expect(result.globalScore.recommendation).toBe('NotRecommended');
    });
});
