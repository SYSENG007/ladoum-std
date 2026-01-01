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
    generationGap: 250,  // Increased vertical gap between generations
    siblingGap: 80,      // Increased horizontal gap between siblings (was 30)
    direction: 'vertical',
};

/**
 * Sort siblings to minimize edge crossings
 * Groups children by their parent pairs to keep families together
 */
function sortSiblingsByParents(subjects: PedigreeSubject[]): PedigreeSubject[] {
    // Create a key for each parent pair
    const getParentKey = (s: PedigreeSubject) => {
        const father = s.fatherId || 'none';
        const mother = s.motherId || 'none';
        return `${father}-${mother}`;
    };

    // Group by parent pairs
    const groups = new Map<string, PedigreeSubject[]>();
    subjects.forEach(subject => {
        const key = getParentKey(subject);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(subject);
    });

    // Flatten groups back to array, keeping families together
    const sorted: PedigreeSubject[] = [];
    groups.forEach(group => {
        // Sort within group by name for consistency
        group.sort((a, b) => a.name.localeCompare(b.name));
        sorted.push(...group);
    });

    return sorted;
}


/**
 * Compute VERTICAL layout for bidirectional pedigree
 * Uses barycentric (bottom-up) algorithm to minimize edge crossings
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

    // Track x positions for each node
    const xPositions = new Map<string, number>();

    // Sort generations from bottom to top (descendants first, then ancestors)
    const generations = Array.from(groups.keys()).sort((a, b) => a - b);

    // Build parent-child relationships
    const childrenMap = new Map<string, string[]>(); // parentId -> childIds[]
    subjects.forEach(subject => {
        if (subject.fatherId) {
            if (!childrenMap.has(subject.fatherId)) {
                childrenMap.set(subject.fatherId, []);
            }
            childrenMap.get(subject.fatherId)!.push(subject.id);
        }
        if (subject.motherId) {
            if (!childrenMap.has(subject.motherId)) {
                childrenMap.set(subject.motherId, []);
            }
            childrenMap.get(subject.motherId)!.push(subject.id);
        }
    });

    // Position nodes generation by generation (bottom to top)
    let currentX = 0;
    generations.forEach((gen, genIndex) => {
        const genSubjects = groups.get(gen)!;

        if (genIndex === 0) {
            // Lowest generation: position left to right with grouping by parents
            const sortedSubjects = sortSiblingsByParents(genSubjects);
            sortedSubjects.forEach(subject => {
                xPositions.set(subject.id, currentX);
                currentX += config.nodeWidth + config.siblingGap;
            });
        } else {
            // Higher generations: center parents above their children
            // First, calculate ideal positions for all parents
            const parentPositions: Array<{ subject: PedigreeSubject; idealX: number }> = [];

            genSubjects.forEach(parent => {
                const children = childrenMap.get(parent.id) || [];

                if (children.length > 0) {
                    // Get children positions
                    const childPositions = children
                        .map(childId => xPositions.get(childId))
                        .filter(pos => pos !== undefined) as number[];

                    if (childPositions.length > 0) {
                        // Center parent on average of children positions
                        const avgX = childPositions.reduce((sum, x) => sum + x, 0) / childPositions.length;
                        parentPositions.push({ subject: parent, idealX: avgX });
                    } else {
                        // No positioned children, place at end
                        parentPositions.push({ subject: parent, idealX: currentX });
                        currentX += config.nodeWidth + config.siblingGap;
                    }
                } else {
                    // No children (root ancestor), place at end
                    parentPositions.push({ subject: parent, idealX: currentX });
                    currentX += config.nodeWidth + config.siblingGap;
                }
            });

            // Sort parents by their ideal X position to minimize crossings
            parentPositions.sort((a, b) => a.idealX - b.idealX);

            // Assign final positions with overlap resolution
            parentPositions.forEach((item, index) => {
                if (index === 0) {
                    xPositions.set(item.subject.id, item.idealX);
                } else {
                    const prevSubject = parentPositions[index - 1].subject;
                    const prevX = xPositions.get(prevSubject.id)!;
                    const minX = prevX + config.nodeWidth + config.siblingGap;

                    // Use ideal position if it doesn't overlap, otherwise push right
                    const finalX = Math.max(item.idealX, minX);
                    xPositions.set(item.subject.id, finalX);
                }
            });
        }
    });

    // Resolve overlaps within each generation
    generations.forEach(gen => {
        const genSubjects = groups.get(gen)!;
        resolveOverlaps(genSubjects, xPositions, config);
    });

    // Create layout nodes with calculated positions
    const nodes: LayoutNode[] = [];
    generations.forEach(gen => {
        const genSubjects = groups.get(gen)!;
        const y = -gen * config.generationGap;

        genSubjects.forEach(subject => {
            const x = xPositions.get(subject.id) || 0;
            nodes.push({
                ...subject,
                x,
                y,
            });
        });
    });

    // Center the entire tree
    const allX = Array.from(xPositions.values());
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const centerOffset = -(minX + maxX) / 2;

    nodes.forEach(node => {
        node.x += centerOffset;
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
                console.log(`🔗 Edge: ${fatherNode.name} (father) → ${childNode.name} (child)`);
                edges.push({
                    from: fatherNode.id,
                    to: childNode.id,
                    path: createVerticalEdgePath(fatherNode, childNode, config),
                });
            } else {
                console.warn(`⚠️ Father not found: ${childNode.name} has fatherId=${childNode.fatherId} but node doesn't exist`);
            }
        }

        // Edge from mother to child
        if (childNode.motherId) {
            const motherNode = nodeMap.get(childNode.motherId);
            if (motherNode) {
                console.log(`🔗 Edge: ${motherNode.name} (mother) → ${childNode.name} (child)`);
                edges.push({
                    from: motherNode.id,
                    to: childNode.id,
                    path: createVerticalEdgePath(motherNode, childNode, config),
                });
            } else {
                console.warn(`⚠️ Mother not found: ${childNode.name} has motherId=${childNode.motherId} but node doesn't exist`);
            }
        }
    });

    console.log(`📊 Total edges created: ${edges.length}`);
    console.log(`📊 Total nodes: ${nodes.length}`);

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
 * Resolve overlaps between nodes in same generation
 * Ensures minimum spacing while preserving relative order
 */
function resolveOverlaps(
    subjects: PedigreeSubject[],
    xPositions: Map<string, number>,
    config: LayoutConfig
): void {
    // Sort by current x position
    const sorted = [...subjects].sort((a, b) => {
        const xA = xPositions.get(a.id) || 0;
        const xB = xPositions.get(b.id) || 0;
        return xA - xB;
    });

    // Ensure minimum spacing
    const minSpacing = config.nodeWidth + config.siblingGap;

    for (let i = 1; i < sorted.length; i++) {
        const prevX = xPositions.get(sorted[i - 1].id)!;
        const currX = xPositions.get(sorted[i].id)!;

        if (currX < prevX + minSpacing) {
            // Overlap detected, push right
            xPositions.set(sorted[i].id, prevX + minSpacing);
        }
    }
}

/**
 * V1.1: Compute layout for multiple selected animals
 * Uses ELK.js for professional graph layout (PRD requirement)
 */
export async function computeMultiRootLayout(
    selection: Set<string>,
    allAnimals: Animal[],
    maxGenerations: number = 5,
    config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Promise<LayoutResult> {
    // Import ELK layout function
    const { computeLayoutWithELK } = await import('./pedigreeLayoutELK');

    // Build graph
    const graph = buildPedigreeGraph(allAnimals);

    // Get visible nodes based on selection
    const visibleIds = getVisibleNodes(selection, graph, maxGenerations, true);

    // Filter animals to visible ones
    const visibleAnimals = allAnimals.filter(a => visibleIds.has(a.id));

    console.log(`🎯 Computing ELK layout for ${visibleAnimals.length} animals`);

    // Use ELK.js for layout computation (PRD requirement)
    return await computeLayoutWithELK(visibleAnimals, config);
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
