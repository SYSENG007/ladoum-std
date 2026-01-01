import type { PedigreeData, LayoutConfig, LayoutResult, LayoutNode, LayoutEdge } from '../types/pedigree';
import { groupByGeneration } from './pedigreeValidator';

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
