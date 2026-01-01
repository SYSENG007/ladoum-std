/**
 * Genetics Utilities for Ladoum Sheep Breeding V1.1
 * Calculates inbreeding coefficients using Wright's Path Method
 * 
 * V1.1 Changes:
 * - Returns InbreedingResult with confidence qualification
 * - null instead of 0 when pedigree insufficient
 * - Explicit status for data completeness
 */

import type { Animal } from '../types';
import type { InbreedingResult } from '../types/breeding';

// Maximum depth for pedigree traversal
const MAX_PEDIGREE_DEPTH = 5;

/**
 * Assess the depth of pedigree available for an animal
 * Returns the number of complete generations traced back
 * 
 * @param animalId - ID of the animal to assess
 * @param allAnimals - Complete herd data
 * @param maxDepth - Maximum depth to check (default: 5)
 * @returns Number of complete generations available
 */
export function assessPedigreeDepth(
    animalId: string,
    allAnimals: Animal[],
    maxDepth: number = MAX_PEDIGREE_DEPTH
): number {
    let currentDepth = 0;
    let currentGeneration = [animalId];

    while (currentDepth < maxDepth && currentGeneration.length > 0) {
        const nextGeneration: string[] = [];

        // Check if ALL animals in current generation have parents
        let allHaveParents = true;

        for (const id of currentGeneration) {
            const { sire, dam } = getParents(id, allAnimals);

            if (sire && dam) {
                // Both parents available
                nextGeneration.push(sire.id, dam.id);
            } else {
                // Missing parent(s) - incomplete generation
                allHaveParents = false;
                break;
            }
        }

        // If any animal lacks parents, this generation is incomplete
        if (!allHaveParents || nextGeneration.length === 0) {
            break;
        }

        currentGeneration = nextGeneration;
        currentDepth++;
    }

    return currentDepth;
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

/**
 * Build a list of all paths from an animal to a specific ancestor
 * Returns array of paths, where each path is an array of IDs [Start, ..., Ancestor]
 */
function findPathsToAncestor(
    startId: string,
    ancestorId: string,
    allAnimals: Animal[],
    currentPath: string[] = [],
    depth: number = 0
): string[][] {
    const paths: string[][] = [];
    if (depth > MAX_PEDIGREE_DEPTH) return paths;

    const newPath = [...currentPath, startId];

    if (startId === ancestorId) {
        return [newPath];
    }

    const { sire, dam } = getParents(startId, allAnimals);

    if (sire) {
        const sirePaths = findPathsToAncestor(sire.id, ancestorId, allAnimals, newPath, depth + 1);
        paths.push(...sirePaths);
    }
    if (dam) {
        const damPaths = findPathsToAncestor(dam.id, ancestorId, allAnimals, newPath, depth + 1);
        paths.push(...damPaths);
    }

    return paths;
}

/**
 * Find all common ancestors between two animals
 */
export function findCommonAncestors(
    animal1Id: string,
    animal2Id: string,
    allAnimals: Animal[],
    depth: number = MAX_PEDIGREE_DEPTH
): string[] {
    const ancestors1 = new Set<string>();
    const ancestors2 = new Set<string>();

    function collectAncestors(id: string, set: Set<string>, curDepth: number) {
        if (curDepth > depth) return;
        const { sire, dam } = getParents(id, allAnimals);
        if (sire) { set.add(sire.id); collectAncestors(sire.id, set, curDepth + 1); }
        if (dam) { set.add(dam.id); collectAncestors(dam.id, set, curDepth + 1); }
    }

    collectAncestors(animal1Id, ancestors1, 0);
    collectAncestors(animal2Id, ancestors2, 0);

    return Array.from(ancestors1).filter(id => ancestors2.has(id));
}

/**
 * Calculate inbreeding coefficient (Wright's coefficient) V1.1
 * Uses Path Method: Sum of (0.5)^(n+1) for all valid paths through common ancestors
 * 
 * V1.1 Changes:
 * - Returns InbreedingResult instead of number
 * - Returns null if pedigree insufficient (never fake with 0)
 * - Explicit status for data completeness
 * 
 * Special cases handled first:
 * - Parent × Child: COI = 0.25 (25%)
 * - Grandparent × Grandchild: COI = 0.125 (12.5%)
 */
export function calculateInbreedingCoefficient(
    sireId: string,
    damId: string,
    allAnimals: Animal[],
    requiredGenerations: number = MAX_PEDIGREE_DEPTH
): InbreedingResult {
    // Step 1: Assess pedigree completeness
    const sireDepth = assessPedigreeDepth(sireId, allAnimals, requiredGenerations);
    const damDepth = assessPedigreeDepth(damId, allAnimals, requiredGenerations);
    const minDepth = Math.min(sireDepth, damDepth);

    // If pedigree insufficient → STOP, return null
    if (minDepth < requiredGenerations) {
        return {
            coefficient: null,
            status: minDepth === 0
                ? 'INSUFFICIENT_PEDIGREE_DATA'
                : 'INCOMPLETE_GENERATIONS',
            requiredGenerations,
            availableGenerations: minDepth,
            riskLevel: 'Unknown'
        };
    }
    // ========================================
    // SPECIAL CASE 1: Parent × Child
    // ========================================
    // Step 2: Check if sire is parent of dam
    const damParents = getParents(damId, allAnimals);
    if (damParents.sire?.id === sireId || damParents.dam?.id === sireId) {
        return {
            coefficient: 0.25,
            status: 'COMPUTABLE',
            requiredGenerations,
            availableGenerations: minDepth,
            riskLevel: 'High'
        };
    }

    // Check if dam is parent of sire
    const sireParents = getParents(sireId, allAnimals);
    if (sireParents.sire?.id === damId || sireParents.dam?.id === damId) {
        return {
            coefficient: 0.25,
            status: 'COMPUTABLE',
            requiredGenerations,
            availableGenerations: minDepth,
            riskLevel: 'High'
        };
    }

    // ========================================
    // SPECIAL CASE 2: Grandparent × Grandchild
    // ========================================
    const sireGrandparents = getGrandparents(sireId, allAnimals);
    const damGrandparents = getGrandparents(damId, allAnimals);

    // Step 3: Check if sire is grandparent of dam
    if (
        sireGrandparents.paternalGrandSire?.id === damId ||
        sireGrandparents.paternalGrandDam?.id === damId ||
        sireGrandparents.maternalGrandSire?.id === damId ||
        sireGrandparents.maternalGrandDam?.id === damId
    ) {
        return {
            coefficient: 0.125,
            status: 'COMPUTABLE',
            requiredGenerations,
            availableGenerations: minDepth,
            riskLevel: 'Medium'
        };
    }

    // Check if dam is grandparent of sire
    if (
        damGrandparents.paternalGrandSire?.id === sireId ||
        damGrandparents.paternalGrandDam?.id === sireId ||
        damGrandparents.maternalGrandSire?.id === sireId ||
        damGrandparents.maternalGrandDam?.id === sireId
    ) {
        return {
            coefficient: 0.125,
            status: 'COMPUTABLE',
            requiredGenerations,
            availableGenerations: minDepth,
            riskLevel: 'Medium'
        };
    }

    // ========================================
    // STANDARD CASE: Common Ancestors
    // ========================================
    // Step 4: Standard case - common ancestors
    const commonAncestors = findCommonAncestors(sireId, damId, allAnimals);
    if (commonAncestors.length === 0) {
        return {
            coefficient: 0,
            status: 'COMPUTABLE',
            requiredGenerations,
            availableGenerations: minDepth,
            riskLevel: 'Low'
        };
    }

    let totalCOI = 0;

    for (const ancestorId of commonAncestors) {
        // Find paths from Sire to Ancestor
        const pathsFromSire = findPathsToAncestor(sireId, ancestorId, allAnimals);
        // Find paths from Dam to Ancestor
        const pathsFromDam = findPathsToAncestor(damId, ancestorId, allAnimals);

        for (const pSire of pathsFromSire) {
            for (const pDam of pathsFromDam) {
                // Combine into a full path: Sire -> ... -> Ancestor <- ... <- Dam
                // Note: Ancestor is in both, so don't duplicate it in the check
                // Valid path = No duplicate nodes except the Common Ancestor at the join

                // pSire: [S, A, B, CA]
                // pDam:  [D, X, Y, CA]
                // Full Nodes: S, A, B, CA, X, Y, D

                // Verify no intersection between the two branches (except CA)
                const pSireSet = new Set(pSire);
                const pDamSet = new Set(pDam);

                // Intersection check
                const intersection = [...pSireSet].filter(x => pDamSet.has(x));

                // For a valid Wright path through THIS ancestor, the ONLY intersection should be the ancestor itself
                if (intersection.length === 1 && intersection[0] === ancestorId) {
                    // Create unique path signature (sorted nodes) to prevent duplicates if traversed via multiple ancestors?
                    // No, paths are distinct by definition of Traversal.
                    // But if Ancestor has its own inbreeding, we might need Fa. Assuming Fa=0 for now.

                    const pathLength = pSire.length + pDam.length - 1; // Number of individuals in the loop
                    // Exponent is usually number of *individuals* in the path S->D (including S and D).
                    // Wright: (1/2)^(N) where N is number of individuals in the path.
                    // Example: S->CA->D. 3 individuals. (1/2)^3 = 1/8.
                    // pSire=[S, CA]. pDam=[D, CA]. Len=2+2=4. -1 = 3. Correct.

                    totalCOI += Math.pow(0.5, pathLength);
                }
            }
        }
    }

    // Note: The above logic might still double count if we iterate ALL common ancestors.
    // Example: S->F->GF. D->F->GF.
    // Common Ancestors: F, GF.
    // Path through F: S->F->D. (Valid). Contrib (1/2)^3 = 1/8.
    // Path through GF: S->F->GF->F->D. (Invalid, F repeated).
    // Path through GF (alternative?): If S->M->GF and D->P->GF. (GF reached via other parents).
    // Then Independent path S->...->GF->...->D.
    // Intersection check ensures we discard paths going through F if F is already common.
    // The "intersection.length === 1" check effectively filters out "Ancestor of Ancestor" paths!
    // Because if we trace to GF via F, then F is in both pSire and pDam.
    // Intersection will be [F, GF]. Length 2. INVALID.
    // So this logic AUTOMATICALLY adheres to Wright's constraint of distinct paths.

    const finalCOI = Math.min(totalCOI, 1);

    return {
        coefficient: finalCOI,
        status: 'COMPUTABLE',
        requiredGenerations,
        availableGenerations: minDepth,
        riskLevel: getInbreedingRisk(finalCOI)
    };
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
 * Get descendants helper (Active references only)
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
