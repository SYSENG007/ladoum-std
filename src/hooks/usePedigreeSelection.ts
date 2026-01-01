import { useState, useCallback } from 'react';

export type SelectionMode = 'none' | 'single' | 'multiple';

interface UsePedigreeSelectionResult {
    selection: Set<string>;
    selectionMode: SelectionMode;
    selectOne: (id: string) => void;
    selectMultiple: (ids: string[]) => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
    isSelected: (id: string) => boolean;
}

/**
 * Hook for managing pedigree node selection
 * Supports single selection (click) and multi-selection (Ctrl+click)
 */
export function usePedigreeSelection(): UsePedigreeSelectionResult {
    const [selection, setSelection] = useState<Set<string>>(new Set());

    /**
     * Determine current selection mode based on selection size
     */
    const selectionMode: SelectionMode =
        selection.size === 0 ? 'none' :
            selection.size === 1 ? 'single' :
                'multiple';

    /**
     * Select a single animal (clears previous selection)
     */
    const selectOne = useCallback((id: string) => {
        setSelection(new Set([id]));
    }, []);

    /**
     * Select multiple animals at once
     */
    const selectMultiple = useCallback((ids: string[]) => {
        setSelection(new Set(ids));
    }, []);

    /**
     * Toggle an animal in/out of selection
     * Used for Ctrl+click multi-select
     */
    const toggleSelection = useCallback((id: string) => {
        setSelection(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            return newSelection;
        });
    }, []);

    /**
     * Clear all selection (returns to global view)
     */
    const clearSelection = useCallback(() => {
        setSelection(new Set());
    }, []);

    /**
     * Check if an animal is selected
     */
    const isSelected = useCallback((id: string) => {
        return selection.has(id);
    }, [selection]);

    return {
        selection,
        selectionMode,
        selectOne,
        selectMultiple,
        toggleSelection,
        clearSelection,
        isSelected,
    };
}
