import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Animal } from '../types';
import type { LayoutResult, LayoutNode, LayoutEdge, LayoutConfig } from '../types/pedigree';

const elk = new ELK();

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
 * According to PRD: "ELK.js est l'unique source de layout"
 */
export async function computeLayoutWithELK(
    animals: Animal[],
    config: LayoutConfig
): Promise<LayoutResult> {
    // Build ELK graph structure
    const elkNodes: ElkNode[] = animals.map(animal => ({
        id: animal.id,
        width: config.nodeWidth,
        height: config.nodeHeight,
        // Store animal data for later rendering
        labels: [{ text: animal.name }],
    }));

    // Build edges (parent → child relationships)
    const elkEdges: ElkExtendedEdge[] = [];
    animals.forEach(animal => {
        // Edge from father to child
        if (animal.sireId && animals.some(a => a.id === animal.sireId)) {
            elkEdges.push({
                id: `${animal.sireId}-${animal.id}-father`,
                sources: [animal.sireId],
                targets: [animal.id],
            });
        }

        // Edge from mother to child
        if (animal.damId && animals.some(a => a.id === animal.damId)) {
            elkEdges.push({
                id: `${animal.damId}-${animal.id}-mother`,
                sources: [animal.damId],
                targets: [animal.id],
            });
        }
    });

    // Create ELK graph
    const graph: ElkNode = {
        id: 'root',
        layoutOptions: ELK_OPTIONS,
        children: elkNodes,
        edges: elkEdges,
    };

    console.log('🔧 ELK Input:', {
        nodes: elkNodes.length,
        edges: elkEdges.length,
    });

    // Compute layout with ELK
    const layoutedGraph = await elk.layout(graph);

    console.log('✅ ELK Output:', layoutedGraph);

    // Convert ELK result to our LayoutResult format
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
                generation: 0, // ELK calculates position, generation is implicit
                x: elkNode.x,
                y: elkNode.y,
            });
        }
    });

    // Create node map for edge creation
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Generate SVG paths for edges
    const edges: LayoutEdge[] = [];

    animals.forEach(animal => {
        const childNode = nodeMap.get(animal.id);
        if (!childNode) return;

        // Edge from father
        if (animal.sireId) {
            const fatherNode = nodeMap.get(animal.sireId);
            if (fatherNode) {
                console.log(`🔗 Edge: ${fatherNode.name} (father) → ${childNode.name} (child)`);
                edges.push({
                    from: fatherNode.id,
                    to: childNode.id,
                    path: createEdgePath(fatherNode, childNode, config),
                });
            }
        }

        // Edge from mother
        if (animal.damId) {
            const motherNode = nodeMap.get(animal.damId);
            if (motherNode) {
                console.log(`🔗 Edge: ${motherNode.name} (mother) → ${childNode.name} (child)`);
                edges.push({
                    from: motherNode.id,
                    to: childNode.id,
                    path: createEdgePath(motherNode, childNode, config),
                });
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
 * Create SVG path between two nodes
 * Simple straight line or elbow connector
 */
function createEdgePath(
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

    // Elbow connector
    const midY = (startY + endY) / 2;
    return `M${startX},${startY} L${startX},${midY} L${endX},${midY} L${endX},${endY}`;
}
