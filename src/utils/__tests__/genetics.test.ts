/**
 * Tests for Genetics V1.1
 * Validates inbreeding coefficient calculation with qualified results
 */

import {
    assessPedigreeDepth,
    calculateInbreedingCoefficient
} from '../genetics';
import type { Animal } from '../../types';

// Helper function to create mock animals
function createAnimal(
    id: string,
    name: string,
    sireId?: string,
    damId?: string
): Animal {
    return {
        id,
        name,
        tagId: id,
        gender: 'Male',
        status: 'Active',
        birthDate: '2020-01-01',
        sireId,
        damId
    } as Animal;
}

describe('assessPedigreeDepth', () => {
    test('returns 0 for animal with no parents', () => {
        const animal = createAnimal('A1', 'Animal1');
        const depth = assessPedigreeDepth('A1', [animal]);
        expect(depth).toBe(0);
    });

    test('returns 1 for animal with both parents but no grandparents', () => {
        const sire = createAnimal('S1', 'Sire1');
        const dam = createAnimal('D1', 'Dam1');
        const offspring = createAnimal('O1', 'Offspring1', 'S1', 'D1');

        const depth = assessPedigreeDepth('O1', [sire, dam, offspring]);
        expect(depth).toBe(1);
    });

    test('returns 2 for complete 2-generation pedigree', () => {
        const gs1 = createAnimal('GS1', 'GrandSire1');
        const gd1 = createAnimal('GD1', 'GrandDam1');
        const sire = createAnimal('S1', 'Sire1', 'GS1', 'GD1');
        const dam = createAnimal('D1', 'Dam1');
        const offspring = createAnimal('O1', 'Offspring1', 'S1', 'D1');

        const depth = assessPedigreeDepth('O1', [gs1, gd1, sire, dam, offspring]);
        expect(depth).toBe(1); // Dam has no parents, so only 1 complete generation
    });

    test('returns correct depth for complete 3-generation pedigree', () => {
        // Great-grandparents
        const ggs1 = createAnimal('GGS1', 'GreatGrandSire1');
        const ggd1 = createAnimal('GGD1', 'GreatGrandDam1');

        // Grandparents
        const gs1 = createAnimal('GS1', 'GrandSire1', 'GGS1', 'GGD1');
        const gd1 = createAnimal('GD1', 'GrandDam1', 'GGS1', 'GGD1');

        // Parents
        const sire = createAnimal('S1', 'Sire1', 'GS1', 'GD1');
        const dam = createAnimal('D1', 'Dam1', 'GS1', 'GD1');

        // Offspring
        const offspring = createAnimal('O1', 'Offspring1', 'S1', 'D1');

        const animals = [ggs1, ggd1, gs1, gd1, sire, dam, offspring];
        const depth = assessPedigreeDepth('O1', animals);
        expect(depth).toBe(3);
    });
});

describe('calculateInbreedingCoefficient V1.1', () => {
    /**
     * PRD Cas 1: Pedigree vide
     * Père et mère connus, mais aucun ancêtre
     * Résultat attendu: coefficient = null, status = INSUFFICIENT_PEDIGREE_DATA
     */
    test('Cas 1: Pedigree vide → coefficient = null', () => {
        const sire = createAnimal('S1', 'Sire1');
        const dam = createAnimal('D1', 'Dam1');

        const result = calculateInbreedingCoefficient('S1', 'D1', [sire, dam]);

        expect(result.coefficient).toBeNull();
        expect(result.status).toBe('INSUFFICIENT_PEDIGREE_DATA');
        expect(result.riskLevel).toBe('Unknown');
        expect(result.availableGenerations).toBe(0);
    });

    /**
     * PRD Cas 2: Frère × Sœur (pedigree complet)
     * COI attendu: 0.25 (25%)
     * Risk: HIGH
     */
    test('Cas 2: Frère × Sœur → COI = 0.25', () => {
        const sire = createAnimal('S1', 'CommonSire');
        const dam = createAnimal('D1', 'CommonDam');
        const brother = createAnimal('B1', 'Brother', 'S1', 'D1');
        const sister = createAnimal('S2', 'Sister', 'S1', 'D1');

        const animals = [sire, dam, brother, sister];
        const result = calculateInbreedingCoefficient('B1', 'S2', animals);

        expect(result.coefficient).toBeCloseTo(0.25, 2);
        expect(result.status).toBe('COMPUTABLE');
        expect(result.riskLevel).toBe('High');
    });

    /**
     * PRD Cas 3: Cousins germains
     * COI attendu: ≈ 0.0625 (6.25%)
     * Risk: MEDIUM
     */
    test('Cas 3: Cousins germains → COI ≈ 0.0625', () => {
        // Grands-parents communs
        const gs = createAnimal('GS', 'GrandSire');
        const gd = createAnimal('GD', 'GrandDam');

        // Oncle et tante (frère et sœur)
        const uncle = createAnimal('U1', 'Uncle', 'GS', 'GD');
        const aunt = createAnimal('A1', 'Aunt', 'GS', 'GD');

        // Autres parents (non apparentés)
        const otherSire = createAnimal('OS', 'OtherSire');
        const otherDam = createAnimal('OD', 'OtherDam');

        // Cousins
        const cousin1 = createAnimal('C1', 'Cousin1', 'U1', 'OD');
        const cousin2 = createAnimal('C2', 'Cousin2', 'OS', 'A1');

        const animals = [gs, gd, uncle, aunt, otherSire, otherDam, cousin1, cousin2];
        const result = calculateInbreedingCoefficient('C1', 'C2', animals);

        expect(result.coefficient).toBeCloseTo(0.0625, 3);
        expect(result.status).toBe('COMPUTABLE');
        expect(result.riskLevel).toBe('Medium');
    });

    /**
     * PRD Cas 4: Aucun ancêtre commun (pedigree complet)
     * COI attendu: 0
     * Risk: LOW
     * NOTE: Seulement si pedigree complet!
     */
    test('Cas 4: Aucun ancêtre commun → COI = 0', () => {
        // Lignée 1 (complète sur 2 générations)
        const gs1 = createAnimal('GS1', 'GrandSire1');
        const gd1 = createAnimal('GD1', 'GrandDam1');
        const sire = createAnimal('S1', 'Sire', 'GS1', 'GD1');

        // Lignée 2 (complète sur 2 générations, totalement différente)
        const gs2 = createAnimal('GS2', 'GrandSire2');
        const gd2 = createAnimal('GD2', 'GrandDam2');
        const dam = createAnimal('D1', 'Dam', 'GS2', 'GD2');

        const animals = [gs1, gd1, gs2, gd2, sire, dam];
        const result = calculateInbreedingCoefficient('S1', 'D1', animals, 2);

        expect(result.coefficient).toBe(0);
        expect(result.status).toBe('COMPUTABLE');
        expect(result.riskLevel).toBe('Low');
    });

    /**
     * Test spécifique: Parent × Enfant
     * COI attendu: 0.25 (25%)
     * Risk: HIGH
     */
    test('Parent × Enfant → COI = 0.25', () => {
        const sire = createAnimal('S1', 'Father');
        const dam = createAnimal('D1', 'Mother');
        const daughter = createAnimal('D2', 'Daughter', 'S1', 'D1');

        const animals = [sire, dam, daughter];
        const result = calculateInbreedingCoefficient('S1', 'D2', animals);

        expect(result.coefficient).toBe(0.25);
        expect(result.status).toBe('COMPUTABLE');
        expect(result.riskLevel).toBe('High');
    });

    /**
     * Test spécifique: Grand-parent × Petit-enfant
     * COI attendu: 0.125 (12.5%)
     * Risk: MEDIUM
     */
    test('Grand-parent × Petit-enfant → COI = 0.125', () => {
        const grandfather = createAnimal('GF', 'Grandfather');
        const grandmother = createAnimal('GM', 'Grandmother');
        const father = createAnimal('F', 'Father', 'GF', 'GM');
        const mother = createAnimal('M', 'Mother');
        const grandchild = createAnimal('GC', 'Grandchild', 'F', 'M');

        const animals = [grandfather, grandmother, father, mother, grandchild];
        const result = calculateInbreedingCoefficient('GF', 'GC', animals);

        expect(result.coefficient).toBe(0.125);
        expect(result.status).toBe('COMPUTABLE');
        expect(result.riskLevel).toBe('Medium');
    });

    /**
     * Test: Pedigree incomplet (< 5 générations requises)
     */
    test('Pedigree incomplet → INCOMPLETE_GENERATIONS', () => {
        const gs = createAnimal('GS', 'GrandSire');
        const gd = createAnimal('GD', 'GrandDam');
        const sire = createAnimal('S', 'Sire', 'GS', 'GD');
        const dam = createAnimal('D', 'Dam');

        const animals = [gs, gd, sire, dam];
        const result = calculateInbreedingCoefficient('S', 'D', animals, 5);

        expect(result.coefficient).toBeNull();
        expect(result.status).toBe('INCOMPLETE_GENERATIONS');
        expect(result.availableGenerations).toBeLessThan(5);
    });

    /**
     * Test: Demi-frères (même père, mères différentes)
     * COI attendu: ≈ 0.125 (12.5%)
     */
    test('Demi-frères → COI ≈ 0.125', () => {
        const sire = createAnimal('S', 'CommonSire');
        const dam1 = createAnimal('D1', 'Dam1');
        const dam2 = createAnimal('D2', 'Dam2');
        const halfBrother1 = createAnimal('HB1', 'HalfBrother1', 'S', 'D1');
        const halfBrother2 = createAnimal('HB2', 'HalfBrother2', 'S', 'D2');

        const animals = [sire, dam1, dam2, halfBrother1, halfBrother2];
        const result = calculateInbreedingCoefficient('HB1', 'HB2', animals);

        expect(result.coefficient).toBeCloseTo(0.125, 2);
        expect(result.status).toBe('COMPUTABLE');
    });
});
