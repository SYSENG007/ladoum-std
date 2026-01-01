import React, { useMemo } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { usePedigreeSelection } from '../../hooks/usePedigreeSelection';
import { buildPedigreeGraph, findCommonAncestors, getVisibleNodes } from '../../utils/pedigreeGraph';
import { computeMultiRootLayout, DEFAULT_LAYOUT_CONFIG } from '../../utils/pedigreeLayout';
import { PedigreeCanvas } from './PedigreeCanvas';
import { SelectionControls } from './SelectionControls';

/**
 * Pedigree Viewer V1
 * Orchestrates selection, graph analysis, and rendering
 * Supports 3 view modes: global (0 selection), individual (1), grouped (N)
 */
export const PedigreeViewer: React.FC = () => {
    const { animals } = useAnimals();

    // Selection management
    const {
        selection,
        selectionMode,
        selectOne,
        toggleSelection,
        clearSelection,
    } = usePedigreeSelection();

    // Build pedigree graph
    const graph = useMemo(() => buildPedigreeGraph(animals), [animals]);

    // Find common ancestors (for grouped view)
    const commonAncestors = useMemo(() => {
        if (selection.size <= 1) return new Set<string>();
        return findCommonAncestors([...selection], graph, 10);
    }, [selection, graph]);

    // Get visible nodes based on selection
    const visibleNodes = useMemo(() => {
        return getVisibleNodes(selection, graph, 5, true);
    }, [selection, graph]);

    // Compute layout
    const layout = useMemo(() => {
        return computeMultiRootLayout(selection, animals, 5, DEFAULT_LAYOUT_CONFIG);
    }, [selection, animals]);

    // Handle node click
    const handleNodeClick = (nodeId: string, ctrlKey: boolean) => {
        if (ctrlKey) {
            // Ctrl+click: toggle in/out of selection
            toggleSelection(nodeId);
        } else {
            // Simple click: select only this one
            selectOne(nodeId);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            {/* Selection Controls Overlay */}
            <SelectionControls
                selection={selection}
                selectionMode={selectionMode}
                commonAncestorsCount={commonAncestors.size}
                animals={animals.map(a => ({ id: a.id, name: a.name }))}
                onClear={clearSelection}
            />

            {/* Pedigree Canvas */}
            <PedigreeCanvas
                layout={layout}
                selection={selection}
                commonAncestors={commonAncestors}
                visibleNodes={visibleNodes}
                onNodeClick={handleNodeClick}
            />
        </div>
    );
};
