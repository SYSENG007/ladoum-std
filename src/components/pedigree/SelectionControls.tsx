import React from 'react';
import type { SelectionMode } from '../../hooks/usePedigreeSelection';
import { X } from 'lucide-react';

interface SelectionControlsProps {
    selection: Set<string>;
    selectionMode: SelectionMode;
    commonAncestorsCount: number;
    animals: Array<{ id: string; name: string }>;
    onClear: () => void;
}

export const SelectionControls: React.FC<SelectionControlsProps> = ({
    selection,
    selectionMode,
    commonAncestorsCount,
    onClear,
}) => {
    if (selectionMode === 'none') return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border border-slate-200">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                    {selection.size} sélectionné{selection.size > 1 ? 's' : ''}
                </span>
                {selectionMode === 'multi' && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {commonAncestorsCount} ancêtres communs
                    </span>
                )}
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1"></div>

            <button
                onClick={onClear}
                className="text-slate-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                title="Effacer la sélection"
            >
                <X size={16} />
            </button>
        </div>
    );
};
