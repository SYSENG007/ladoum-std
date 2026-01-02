import { useState, useCallback, useMemo } from 'react';

export type SelectionMode = 'none' | 'single' | 'multi';

export interface UsePedigreeSelectionResult {
    selection: Set<string>;
    selectionMode: SelectionMode;
    selectOne: (id: string) => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
}

export const usePedigreeSelection = (): UsePedigreeSelectionResult => {
    const [selection, setSelection] = useState<Set<string>>(new Set());

    const selectionMode = useMemo((): SelectionMode => {
        if (selection.size === 0) return 'none';
        if (selection.size === 1) return 'single';
        return 'multi';
    }, [selection.size]);

    const selectOne = useCallback((id: string) => {
        setSelection(new Set([id]));
    }, []);

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

    const clearSelection = useCallback(() => {
        setSelection(new Set());
    }, []);

    return {
        selection,
        selectionMode,
        selectOne,
        toggleSelection,
        clearSelection,
    };
};
