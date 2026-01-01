import type { PedigreeData, LayoutConfig, LayoutResult, LayoutNode, LayoutEdge, PedigreeSubject } from '../types/pedigree';
import type { Animal } from '../types';
import { groupByGeneration } from './pedigreeValidator';
import { buildPedigreeGraph, getAncestors, getDescendants, getVisibleNodes } from './pedigreeGraph';

/**
 * Default layout configuration - VERTICAL
 * Ancestors at top (positive Y), Subject in middle, Descendants at bottom (negative Y)
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    nodeWidth: 200,
    nodeHeight: 140,
    generationGap: 200,  // Vertical gap between generations
    siblingGap: 30,      // Horizontal gap between siblings
    direction: 'vertical',
};

/**
 * Compute VERTICAL layout for bidirectional pedigree
 * - Ancestors: top (Y increases upward with generation)
 * - Subject: center (generation 0)
 * - Descendants: bottom (Y decreases with negative generation)
 */
export function computeLayout(
    data: PedigreeData,
    config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutResult {
    const { subjects } = data;
    const groups = groupByGeneration(subjects);

    // Calculate positions for each generation
    const nodes: LayoutNode[] = [];
    const generations = Array.from(groups.keys()).sort((a, b) => b - a); // Sort descending: highest gen (ancestors) first

    generations.forEach(gen => {
        const genSubjects = groups.get(gen)!;

        // Y position: higher generations (ancestors) at top, lower (descendants) at bottom
        // gen positive = ancestors (move up), gen negative = descendants (move down)
        const y = -gen * config.generationGap;

        // X position: center subjects horizontally
        const totalWidth = genSubjects.length * config.nodeWidth + (genSubjects.length - 1) * config.siblingGap;
        let currentX = -totalWidth / 2;

        genSubjects.forEach(subject => {
            nodes.push({
                ...subject,
                x: currentX,
                y,
            });
            currentX += config.nodeWidth + config.siblingGap;
        });
    });

    // Create lookup for positioned nodes
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Generate edges (parent → child SVG paths)
    const edges: LayoutEdge[] = [];

    nodes.forEach(childNode => {
        // Edge from father to child
        if (childNode.fatherId) {
            const fatherNode = nodeMap.get(childNode.fatherId);
            if (fatherNode) {
                edges.push({
                    from: fatherNode.id,
                    to: childNode.id,
                    path: createVerticalEdgePath(fatherNode, childNode, config),
                });
            }
        }

        // Edge from mother to child
        if (childNode.motherId) {
            const motherNode = nodeMap.get(childNode.motherId);
            if (motherNode) {
                edges.push({
                    from: motherNode.id,
                    to: childNode.id,
                    path: createVerticalEdgePath(motherNode, childNode, config),
                });
            }
        }
    });

    // Calculate bounds
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);

    return {
        nodes,
        edges,
        bounds: {
            minX: Math.min(...xs),
            maxX: Math.max(...xs) + config.nodeWidth,
            minY: Math.min(...ys),
            maxY: Math.max(...ys) + config.nodeHeight,
        },
    };
}

/**
 * V1.1: Compute layout for multiple selected animals
 * Builds a forest layout with visible nodes based on selection
 */
export function computeMultiRootLayout(
    selection: Set<string>,
    allAnimals: Animal[],
    maxGenerations: number = 5,
    config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutResult {
    // Build graph
    const graph = buildPedigreeGraph(allAnimals);

    // Get visible nodes based on selection
    const visibleIds = getVisibleNodes(selection, graph, maxGenerations, true);

    // Filter animals to visible ones
    const visibleAnimals = allAnimals.filter(a => visibleIds.has(a.id));

    // If no selection, find root animals (those without parents) to use as reference
    const roots = selection.size === 0
        ? new Set(allAnimals.filter(a => !a.sireId && !a.damId).map(a => a.id))
        : selection;

    // Convert to PedigreeSubject format
    const subjects: PedigreeSubject[] = visibleAnimals.map(animal => ({
        id: animal.id,
        name: animal.name,
        sex: animal.gender === 'Male' ? 'M' : 'F',
        photoUrl: animal.photoUrl,
        tagId: animal.tagId,
        birthDate: animal.birthDate,
        fatherId: animal.sireId,
        motherId: animal.damId,
        generation: calculateRelativeGeneration(animal.id, roots, graph),
    }));

    // Use standard layout algorithm
    const rootSubjectId = roots.size > 0 ? Array.from(roots)[0] : subjects[0]?.id || '';
    return computeLayout({ subjects, rootSubjectId }, config);
}

/**
 * Calculate generation number relative to selection/roots
 * Selected animals (or roots if no selection) are generation 0
 * Ancestors are positive (1, 2, 3...)
 * Descendants are negative (-1, -2, -3...)
 */
function calculateRelativeGeneration(
    animalId: string,
    referenceSet: Set<string>, // Either selection or roots
    graph: ReturnType<typeof buildPedigreeGraph>
): number {
    // If in reference set (selected or root), generation 0
    if (referenceSet.has(animalId)) return 0;

    // Check if it's an ancestor of any reference animal
    for (const refId of referenceSet) {
        const ancestors = getAncestors(refId, graph, 10);
        if (ancestors.has(animalId)) {
            // Calculate how many generations up
            return calculateGenerationDistance(refId, animalId, graph, 'up');
        }
    }

    // Check if it's a descendant of any reference animal
    for (const refId of referenceSet) {
        const descendants = getDescendants(refId, graph, 10);
        if (descendants.has(animalId)) {
            // Calculate how many generations down (negative)
            return -calculateGenerationDistance(refId, animalId, graph, 'down');
        }
    }

    // If not related to any reference animal, calculate from closest root
    // Find the closest ancestor that is a root
    let currentId = animalId;
    let depth = 0;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
        visited.add(currentId);

        // Check if this is a root (no parents)
        const parents = graph.ancestors.get(currentId);
        if (!parents || parents.size === 0) {
            // This is a root, return negative depth (descendant)
            return -depth;
        }

        // Move up to first parent
        const firstParent = Array.from(parents)[0];
        currentId = firstParent;
        depth++;
    }

    return 0;
}

/**
 * Calculate generation distance between two animals
 */
function calculateGenerationDistance(
    fromId: string,
    toId: string,
    graph: ReturnType<typeof buildPedigreeGraph>,
    direction: 'up' | 'down'
): number {
    const queue: Array<{ id: string; distance: number }> = [{ id: fromId, distance: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const { id, distance } = queue.shift()!;

        if (id === toId) return distance;
        if (visited.has(id)) continue;
        visited.add(id);

        // Traverse in the specified direction
        const nextIds = direction === 'up'
            ? graph.ancestors.get(id) || new Set()
            : graph.descendants.get(id) || new Set();

        for (const nextId of nextIds) {
            queue.push({ id: nextId, distance: distance + 1 });
        }
    }

    return 0; // Not found
}

/**
 * Create SVG path from parent to child (VERTICAL layout)
 * Parents are above (lower Y), children are below (higher Y)
 */
function createVerticalEdgePath(
    parent: LayoutNode,
    child: LayoutNode,
    config: LayoutConfig
): string {
    // Start point: bottom center of parent node
    const startX = parent.x + config.nodeWidth / 2;
    const startY = parent.y + config.nodeHeight;

    // End point: top center of child node
    const endX = child.x + config.nodeWidth / 2;
    const endY = child.y;

    // Elbow connector (vertical first, then horizontal, then vertical)
    const midY = (startY + endY) / 2;
    return `M${startX},${startY} L${startX},${midY} L${endX},${midY} L${endX},${endY}`;
}

/**
 * Optimize layout to reduce edge crossings (future enhancement)
 */
export function optimizeLayout(nodes: LayoutNode[]): LayoutNode[] {
    // TODO: Implement crossing reduction algorithm
    return nodes;
}
