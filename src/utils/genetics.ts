/**
 * Genetics Utilities for Ladoum Sheep Breeding
 * Calculates inbreeding coefficients and identifies common ancestors
 */

import type { Animal } from '../types';

// Maximum depth for pedigree traversal
const MAX_PEDIGREE_DEPTH = 5;

/**
 * Build a pedigree map for an animal up to specified depth
 * Returns a map of ancestor IDs with their generation depth
 */
export function buildPedigree(
    animalId: string | undefined,
    allAnimals: Animal[],
    depth: number = MAX_PEDIGREE_DEPTH,
    currentDepth: number = 0
): Map<string, number> {
    const pedigree = new Map<string, number>();

    if (!animalId || currentDepth >= depth) return pedigree;

    const animal = allAnimals.find(a => a.id === animalId);
    if (!animal) return pedigree;

    // Add current animal at this depth
    pedigree.set(animalId, currentDepth);

    // Recursively add parents
    if (animal.sireId) {
        const sirePedigree = buildPedigree(animal.sireId, allAnimals, depth, currentDepth + 1);
        sirePedigree.forEach((d, id) => {
            const existing = pedigree.get(id);
            if (existing === undefined || d < existing) {
                pedigree.set(id, d);
            }
        });
    }

    if (animal.damId) {
        const damPedigree = buildPedigree(animal.damId, allAnimals, depth, currentDepth + 1);
        damPedigree.forEach((d, id) => {
            const existing = pedigree.get(id);
            if (existing === undefined || d < existing) {
                pedigree.set(id, d);
            }
        });
    }

    return pedigree;
}

/**
 * Find common ancestors between two animals
 * Returns array of common ancestor IDs
 */
export function findCommonAncestors(
    animal1Id: string,
    animal2Id: string,
    allAnimals: Animal[],
    depth: number = MAX_PEDIGREE_DEPTH
): string[] {
    const pedigree1 = buildPedigree(animal1Id, allAnimals, depth);
    const pedigree2 = buildPedigree(animal2Id, allAnimals, depth);

    const commonAncestors: string[] = [];

    pedigree1.forEach((_, id) => {
        if (pedigree2.has(id) && id !== animal1Id && id !== animal2Id) {
            commonAncestors.push(id);
        }
    });

    return commonAncestors;
}

/**
 * Calculate inbreeding coefficient (Wright's coefficient)
 * Simplified calculation based on common ancestors
 * Returns value between 0 (no inbreeding) and 1 (high inbreeding)
 */
export function calculateInbreedingCoefficient(
    sireId: string,
    damId: string,
    allAnimals: Animal[]
): number {
    // Find common ancestors
    const commonAncestors = findCommonAncestors(sireId, damId, allAnimals);

    if (commonAncestors.length === 0) return 0;

    // Build pedigrees for path calculation
    const sirePedigree = buildPedigree(sireId, allAnimals);
    const damPedigree = buildPedigree(damId, allAnimals);

    let totalCOI = 0;

    for (const ancestorId of commonAncestors) {
        const depthFromSire = sirePedigree.get(ancestorId);
        const depthFromDam = damPedigree.get(ancestorId);

        if (depthFromSire !== undefined && depthFromDam !== undefined) {
            // Wright's formula: F = Σ(0.5)^(n1 + n2 + 1)
            // n1 = generations from sire to ancestor
            // n2 = generations from dam to ancestor
            const pathLength = depthFromSire + depthFromDam + 1;
            totalCOI += Math.pow(0.5, pathLength);
        }
    }

    // Cap at 1.0
    return Math.min(totalCOI, 1);
}

/**
 * Determine inbreeding risk level from coefficient
 */
export function getInbreedingRisk(coefficient: number): 'Low' | 'Medium' | 'High' {
    if (coefficient < 0.0625) return 'Low';      // < 6.25%
    if (coefficient < 0.125) return 'Medium';    // 6.25% - 12.5%
    return 'High';                                // > 12.5%
}

/**
 * Get all descendants of an animal
 */
export function getDescendants(
    animalId: string,
    allAnimals: Animal[],
    depth: number = 3
): Animal[] {
    const descendants: Animal[] = [];
    const visited = new Set<string>();

    function findDescendantsRecursive(parentId: string, currentDepth: number) {
        if (currentDepth >= depth) return;

        const children = allAnimals.filter(
            a => (a.sireId === parentId || a.damId === parentId) && !visited.has(a.id)
        );

        for (const child of children) {
            visited.add(child.id);
            descendants.push(child);
            findDescendantsRecursive(child.id, currentDepth + 1);
        }
    }

    findDescendantsRecursive(animalId, 0);
    return descendants;
}

/**
 * Get both parents of an animal
 */
export function getParents(
    animalId: string,
    allAnimals: Animal[]
): { sire: Animal | undefined; dam: Animal | undefined } {
    const animal = allAnimals.find(a => a.id === animalId);
    if (!animal) return { sire: undefined, dam: undefined };

    return {
        sire: animal.sireId ? allAnimals.find(a => a.id === animal.sireId) : undefined,
        dam: animal.damId ? allAnimals.find(a => a.id === animal.damId) : undefined
    };
}

/**
 * Get grandparents of an animal
 */
export function getGrandparents(
    animalId: string,
    allAnimals: Animal[]
): {
    paternalGrandSire: Animal | undefined;
    paternalGrandDam: Animal | undefined;
    maternalGrandSire: Animal | undefined;
    maternalGrandDam: Animal | undefined;
} {
    const { sire, dam } = getParents(animalId, allAnimals);

    const paternalParents = sire ? getParents(sire.id, allAnimals) : { sire: undefined, dam: undefined };
    const maternalParents = dam ? getParents(dam.id, allAnimals) : { sire: undefined, dam: undefined };

    return {
        paternalGrandSire: paternalParents.sire,
        paternalGrandDam: paternalParents.dam,
        maternalGrandSire: maternalParents.sire,
        maternalGrandDam: maternalParents.dam
    };
}
