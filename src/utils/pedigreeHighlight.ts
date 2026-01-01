import type { PedigreeGraph } from './pedigreeGraph';
import { getAncestors, getDescendants } from './pedigreeGraph';

/**
 * Node visual state based on selection context
 */
export type NodeHighlightState =
    | 'selected'           // Node is selected
    | 'common_ancestor'    // Node is a common ancestor of selected nodes
    | 'direct_relation'    // Node is a parent or child of selected
    | 'visible'            // Node is visible but not directly related
    | 'hidden';            // Node is outside visible scope

/**
 * Visual properties for each highlight state
 */
export interface HighlightStyle {
    opacity: number;
    strokeWidth: number;
    strokeDasharray?: string;
    fillOpacity?: number;
    highlight?: 'yellow' | 'blue' | 'green';
}

/**
 * Map of highlight state to visual style
 */
export const HIGHLIGHT_STYLES: Record<NodeHighlightState, HighlightStyle> = {
    selected: {
        opacity: 1.0,
        strokeWidth: 3,
        fillOpacity: 1.0,
    },
    common_ancestor: {
        opacity: 1.0,
        strokeWidth: 2,
        strokeDasharray: '4,2',
        fillOpacity: 0.95,
        highlight: 'yellow',
    },
    direct_relation: {
        opacity: 0.9,
        strokeWidth: 2,
        fillOpacity: 0.9,
    },
    visible: {
        opacity: 0.6,
        strokeWidth: 1,
        fillOpacity: 0.7,
    },
    hidden: {
        opacity: 0.3,
        strokeWidth: 1,
        fillOpacity: 0.5,
    },
};

/**
 * Determine the highlight state for a node based on selection context
 */
export function getNodeHighlightState(
    nodeId: string,
    selection: Set<string>,
    commonAncestors: Set<string>,
    visibleNodes: Set<string>,
    graph: PedigreeGraph
): NodeHighlightState {
    // Check if selected
    if (selection.has(nodeId)) {
        return 'selected';
    }

    // Check if common ancestor
    if (commonAncestors.has(nodeId)) {
        return 'common_ancestor';
    }

    // Check if direct relation (parent or child of selected)
    if (selection.size > 0) {
        for (const selectedId of selection) {
            const parents = graph.ancestors.get(selectedId);
            const children = graph.descendants.get(selectedId);

            if (parents?.has(nodeId) || children?.has(nodeId)) {
                return 'direct_relation';
            }
        }
    }

    // Check if visible
    if (visibleNodes.has(nodeId)) {
        return 'visible';
    }

    // Hidden
    return 'hidden';
}

/**
 * Calculate opacity for a node based on selection
 */
export function getNodeOpacity(
    nodeId: string,
    selection: Set<string>,
    commonAncestors: Set<string>,
    visibleNodes: Set<string>
): number {
    // Selected node: full opacity
    if (selection.has(nodeId)) return 1.0;

    // Common ancestor: full opacity
    if (commonAncestors.has(nodeId)) return 1.0;

    // No selection: all equal
    if (selection.size === 0) return 0.8;

    // Visible but not selected: moderate opacity
    if (visibleNodes.has(nodeId)) return 0.6;

    // Hidden: very low opacity
    return 0.3;
}

/**
 * Get CSS classes for a node based on its highlight state
 */
export function getNodeHighlightClasses(state: NodeHighlightState): string {
    const baseClasses = 'transition-all duration-300';

    switch (state) {
        case 'selected':
            return `${baseClasses} ring-4 ring-primary-500 z-10`;
        case 'common_ancestor':
            return `${baseClasses} ring-2 ring-yellow-400 bg-yellow-50 z-5`;
        case 'direct_relation':
            return `${baseClasses} z-4`;
        case 'visible':
            return `${baseClasses} z-2`;
        case 'hidden':
            return `${baseClasses} z-1`;
        default:
            return baseClasses;
    }
}

/**
 * Calculate which edges should be highlighted
 */
export function getHighlightedEdges(
    selection: Set<string>,
    visibleNodes: Set<string>,
    graph: PedigreeGraph
): Set<string> {
    const highlightedEdges = new Set<string>();

    // If no selection, no special edge highlighting
    if (selection.size === 0) return highlightedEdges;

    // Highlight edges between selected nodes and their direct relations
    for (const selectedId of selection) {
        const parents = graph.ancestors.get(selectedId);
        const children = graph.descendants.get(selectedId);

        // Edges to parents
        if (parents) {
            for (const parentId of parents) {
                if (visibleNodes.has(parentId)) {
                    highlightedEdges.add(`${parentId}-${selectedId}`);
                }
            }
        }

        // Edges to children
        if (children) {
            for (const childId of children) {
                if (visibleNodes.has(childId)) {
                    highlightedEdges.add(`${selectedId}-${childId}`);
                }
            }
        }
    }

    return highlightedEdges;
}

/**
 * Get edge opacity based on selection
 */
export function getEdgeOpacity(
    fromId: string,
    toId: string,
    selection: Set<string>,
    highlightedEdges: Set<string>,
    visibleNodes: Set<string>
): number {
    const edgeKey = `${fromId}-${toId}`;

    // Highlighted edge: full opacity
    if (highlightedEdges.has(edgeKey)) return 1.0;

    // No selection: all equal
    if (selection.size === 0) return 0.6;

    // Both nodes visible: moderate opacity
    if (visibleNodes.has(fromId) && visibleNodes.has(toId)) return 0.4;

    // Otherwise: very low opacity
    return 0.2;
}

/**
 * Get the most relevant node IDs to display in a limited space
 * Used for UI like "5 animals selected" → show which ones
 */
export function getTopRelevantNodes(
    selection: Set<string>,
    animals: Array<{ id: string; name: string }>,
    maxCount: number = 3
): Array<{ id: string; name: string }> {
    const selectedAnimals = animals.filter(a => selection.has(a.id));

    // Sort alphabetically for consistency
    selectedAnimals.sort((a, b) => a.name.localeCompare(b.name));

    return selectedAnimals.slice(0, maxCount);
}
