import type { Animal } from '../types';

/**
 * Build a complete pedigree graph from all animals
 * Returns adjacency lists for both parent→child and child→parent relationships
 */
export interface PedigreeGraph {
    /** Map of parentId → Set of childIds */
    descendants: Map<string, Set<string>>;
    /** Map of childId → Set of parentIds (sire, dam) */
    ancestors: Map<string, Set<string>>;
    /** All animal IDs in the graph */
    allIds: Set<string>;
}

/**
 * Build bidirectional pedigree graph from animals
 */
export function buildPedigreeGraph(animals: Animal[]): PedigreeGraph {
    const descendants = new Map<string, Set<string>>();
    const ancestors = new Map<string, Set<string>>();
    const allIds = new Set<string>();

    // Initialize maps
    for (const animal of animals) {
        allIds.add(animal.id);
        descendants.set(animal.id, new Set());
        ancestors.set(animal.id, new Set());
    }

    // Build relationships
    for (const animal of animals) {
        // Link to sire
        if (animal.sireId) {
            // Child → Parent
            ancestors.get(animal.id)?.add(animal.sireId);
            // Parent → Child
            if (!descendants.has(animal.sireId)) {
                descendants.set(animal.sireId, new Set());
            }
            descendants.get(animal.sireId)?.add(animal.id);
        }

        // Link to dam
        if (animal.damId) {
            // Child → Parent
            ancestors.get(animal.id)?.add(animal.damId);
            // Parent → Child
            if (!descendants.has(animal.damId)) {
                descendants.set(animal.damId, new Set());
            }
            descendants.get(animal.damId)?.add(animal.id);
        }
    }

    return { descendants, ancestors, allIds };
}

/**
 * Find all ancestors of a given animal up to maxGenerations
 */
export function getAncestors(
    animalId: string,
    graph: PedigreeGraph,
    maxGenerations: number = 10
): Set<string> {
    const result = new Set<string>();
    const queue: Array<{ id: string; generation: number }> = [{ id: animalId, generation: 0 }];

    while (queue.length > 0) {
        const { id, generation } = queue.shift()!;

        if (generation >= maxGenerations) continue;

        const parents = graph.ancestors.get(id);
        if (!parents) continue;

        for (const parentId of parents) {
            if (!result.has(parentId)) {
                result.add(parentId);
                queue.push({ id: parentId, generation: generation + 1 });
            }
        }
    }

    return result;
}

/**
 * Find all descendants of a given animal
 */
export function getDescendants(
    animalId: string,
    graph: PedigreeGraph,
    maxGenerations: number = 10
): Set<string> {
    const result = new Set<string>();
    const queue: Array<{ id: string; generation: number }> = [{ id: animalId, generation: 0 }];

    while (queue.length > 0) {
        const { id, generation } = queue.shift()!;

        if (generation >= maxGenerations) continue;

        const children = graph.descendants.get(id);
        if (!children) continue;

        for (const childId of children) {
            if (!result.has(childId)) {
                result.add(childId);
                queue.push({ id: childId, generation: generation + 1 });
            }
        }
    }

    return result;
}

/**
 * Find common ancestors between multiple animals
 * Returns ancestors that appear in ALL animals' pedigrees
 */
export function findCommonAncestors(
    animalIds: string[],
    graph: PedigreeGraph,
    maxGenerations: number = 10
): Set<string> {
    if (animalIds.length === 0) return new Set();
    if (animalIds.length === 1) return new Set();

    // Get ancestors for first animal
    const commonAncestors = getAncestors(animalIds[0], graph, maxGenerations);

    // Intersect with ancestors of other animals
    for (let i = 1; i < animalIds.length; i++) {
        const ancestors = getAncestors(animalIds[i], graph, maxGenerations);

        // Keep only ancestors that are in both sets
        for (const ancestorId of commonAncestors) {
            if (!ancestors.has(ancestorId)) {
                commonAncestors.delete(ancestorId);
            }
        }
    }

    return commonAncestors;
}

/**
 * Get all nodes that should be visible based on selection
 */
export function getVisibleNodes(
    selection: Set<string>,
    graph: PedigreeGraph,
    maxGenerations: number = 5,
    includeDescendants: boolean = true
): Set<string> {
    const visible = new Set<string>();

    // If no selection, all nodes visible (global view)
    if (selection.size === 0) {
        return new Set(graph.allIds);
    }

    // Add selected nodes
    for (const id of selection) {
        visible.add(id);
    }

    // Add ancestors for each selected node
    for (const id of selection) {
        const ancestors = getAncestors(id, graph, maxGenerations);
        for (const ancestorId of ancestors) {
            visible.add(ancestorId);
        }
    }

    // Optionally add descendants
    if (includeDescendants) {
        for (const id of selection) {
            const descendants = getDescendants(id, graph, maxGenerations);
            for (const descendantId of descendants) {
                visible.add(descendantId);
            }
        }
    }

    return visible;
}

/**
 * Calculate generation depth from root
 */
export function calculateGenerationDepth(
    animalId: string,
    graph: PedigreeGraph
): number {
    let maxDepth = 0;
    const queue: Array<{ id: string; depth: number }> = [{ id: animalId, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const { id, depth } = queue.shift()!;

        if (visited.has(id)) continue;
        visited.add(id);

        maxDepth = Math.max(maxDepth, depth);

        const parents = graph.ancestors.get(id);
        if (parents) {
            for (const parentId of parents) {
                queue.push({ id: parentId, depth: depth + 1 });
            }
        }
    }

    return maxDepth;
}
