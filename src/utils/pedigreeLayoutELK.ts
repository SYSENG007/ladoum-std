import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Animal } from '../types';
import type { LayoutResult, LayoutNode, LayoutEdge, LayoutConfig } from '../types/pedigree';
import { buildPedigreeGraph, getAncestors, getDescendants } from './pedigreeGraph';

const elk = new ELK();

/**
 * Palette de couleurs pour distinguer les lignées
 */
const LINEAGE_COLORS = [
    '#2563eb', // Blue
    '#db2777', // Pink
    '#16a34a', // Green
    '#9333ea', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#dc2626', // Red
];

/**
 * Configuration ELK selon PRD
 */
const ELK_OPTIONS = {
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.layered.spacing.nodeNodeBetweenLayers': '120',
    'elk.spacing.nodeNode': '80',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    'elk.padding': '[top=50,left=50,bottom=50,right=50]',
};

/**
 * Compute layout using ELK.js (professional graph layout engine)
 * With lineage coloring support
 */
export async function computeLayoutWithELK(
    animals: Animal[],
    config: LayoutConfig,
    selection?: Set<string>
): Promise<LayoutResult> {
    // Build ELK graph structure
    const elkNodes: ElkNode[] = animals.map(animal => ({
        id: animal.id,
        width: config.nodeWidth,
        height: config.nodeHeight,
        labels: [{ text: animal.name }],
    }));

    // Build edges (parent → child relationships)
    const elkEdges: ElkExtendedEdge[] = [];
    animals.forEach(animal => {
        if (animal.sireId && animals.some(a => a.id === animal.sireId)) {
            elkEdges.push({
                id: `${animal.sireId}-${animal.id}-father`,
                sources: [animal.sireId],
                targets: [animal.id],
            });
        }
        if (animal.damId && animals.some(a => a.id === animal.damId)) {
            elkEdges.push({
                id: `${animal.damId}-${animal.id}-mother`,
                sources: [animal.damId],
                targets: [animal.id],
            });
        }
    });

    const graph: ElkNode = {
        id: 'root',
        layoutOptions: ELK_OPTIONS,
        children: elkNodes,
        edges: elkEdges,
    };

    // Compute layout
    const layoutedGraph = await elk.layout(graph);

    // Convert ELK result
    const nodes: LayoutNode[] = [];
    const animalMap = new Map(animals.map(a => [a.id, a]));

    layoutedGraph.children?.forEach(elkNode => {
        const animal = animalMap.get(elkNode.id);
        if (animal && elkNode.x !== undefined && elkNode.y !== undefined) {
            nodes.push({
                id: animal.id,
                name: animal.name,
                sex: animal.gender === 'Male' ? 'M' : 'F',
                photoUrl: animal.photoUrl,
                tagId: animal.tagId,
                birthDate: animal.birthDate,
                fatherId: animal.sireId,
                motherId: animal.damId,
                generation: 0,
                x: elkNode.x,
                y: elkNode.y,
            });
        }
    });

    // Prepare coloring logic
    const edges: LayoutEdge[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Build local graph for ancestor/descendant lookup
    const localGraph = buildPedigreeGraph(animals);
    const selectedIds = Array.from(selection || new Set<string>());

    // --- COLORING STRATEGY SELECTION ---
    const isGlobalView = selectedIds.length === 0;

    // A. GLOBAL VIEW: PATRILINEAL COLORING
    // Every edge takes the color of the "Patriline" (Sire Line) of the source node
    const patrilineColors = new Map<string, string>();
    if (isGlobalView) {
        // Helper to find patriline founder
        const getPatrilineFounder = (startId: string): string => {
            let current = startId;
            const visited = new Set<string>();
            while (true) {
                if (visited.has(current)) return current; // Cycle detected
                visited.add(current);

                const parentIds = localGraph.ancestors.get(current);
                // Find sire among parents (we need to look up animal data for sex/sireId)
                const animal = animalMap.get(current);
                if (!animal || !animal.sireId || !localGraph.allIds.has(animal.sireId)) {
                    return current; // Found a root or unknown sire
                }
                // Prevent unused variable warning
                void parentIds;
                current = animal.sireId;
            }
        };

        // Assign colors to patrilines
        animals.forEach(animal => {
            const founderId = getPatrilineFounder(animal.id);
            // Hash founder ID to pick a color
            let hash = 0;
            for (let i = 0; i < founderId.length; i++) {
                hash = founderId.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIndex = Math.abs(hash) % LINEAGE_COLORS.length;
            patrilineColors.set(animal.id, LINEAGE_COLORS[colorIndex]);
        });
    }

    // B. SELECTION VIEW: HIGHLIGHT ONLY SELECTED LINES
    const subjectColors = new Map<string, string>();
    const subjectLineages = new Map<string, Set<string>>();

    if (!isGlobalView) {
        selectedIds.forEach((id, index) => {
            subjectColors.set(id, LINEAGE_COLORS[index % LINEAGE_COLORS.length]);
        });

        // Determine lineages for each selected subject
        selectedIds.forEach(id => {
            const ancestors = getAncestors(id, localGraph);
            const descendants = getDescendants(id, localGraph);
            const lineage = new Set([...ancestors, ...descendants, id]);
            subjectLineages.set(id, lineage);
        });
    }

    animals.forEach(animal => {
        const childNode = nodeMap.get(animal.id);
        if (!childNode) return;

        // Function to determine edge color
        const getEdgeColor = (parentId: string, childId: string): string | undefined => {
            if (isGlobalView) {
                // Return validity of the source node's lineage
                return patrilineColors.get(parentId);
            } else {
                // Find which selected subjects contain this edge in their lineage
                const matchingSubjects = selectedIds.filter(subjectId => {
                    const lineage = subjectLineages.get(subjectId);
                    return lineage?.has(parentId) && lineage?.has(childId);
                });

                if (matchingSubjects.length === 1) {
                    return subjectColors.get(matchingSubjects[0]);
                } else if (matchingSubjects.length > 1) {
                    return '#eab308'; // Gold/Yellow for common lines
                }
                return undefined; // Default gray
            }
        };

        // Edge from father
        if (animal.sireId) {
            const fatherNode = nodeMap.get(animal.sireId);
            if (fatherNode) {
                edges.push({
                    from: fatherNode.id,
                    to: childNode.id,
                    path: createEdgePath(fatherNode, childNode, config),
                    color: getEdgeColor(fatherNode.id, childNode.id)
                });
            }
        }

        // Edge from mother
        if (animal.damId) {
            const motherNode = nodeMap.get(animal.damId);
            if (motherNode) {
                edges.push({
                    from: motherNode.id,
                    to: childNode.id,
                    path: createEdgePath(motherNode, childNode, config),
                    color: getEdgeColor(motherNode.id, childNode.id)
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
 * Create SVG path between two nodes
 * Simple straight line or elbow connector
 */
function createEdgePath(
    parent: LayoutNode,
    child: LayoutNode,
    config: LayoutConfig
): string {
    const startX = parent.x + config.nodeWidth / 2;
    const startY = parent.y + config.nodeHeight;
    const endX = child.x + config.nodeWidth / 2;
    const endY = child.y;
    const midY = (startY + endY) / 2;
    return `M${startX},${startY} L${startX},${midY} L${endX},${midY} L${endX},${endY}`;
}
