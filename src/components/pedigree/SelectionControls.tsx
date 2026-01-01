import React from 'react';
import { X, Users, User } from 'lucide-react';
import type { SelectionMode } from '../../hooks/usePedigreeSelection';
import { getTopRelevantNodes } from '../../utils/pedigreeHighlight';

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
    animals,
    onClear,
}) => {
    // Don't show if no selection
    if (selectionMode === 'none') return null;

    const selectedAnimals = getTopRelevantNodes(selection, animals, 3);
    const hasMore = selection.size > 3;

    return (
        <div className="absolute top-20 left-6 z-20 bg-white rounded-lg shadow-lg border border-slate-200 p-4 max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {selectionMode === 'single' ? (
                        <User className="w-4 h-4 text-primary-600" />
                    ) : (
                        <Users className="w-4 h-4 text-primary-600" />
                    )}
                    <span className="text-sm font-semibold text-slate-900">
                        {selectionMode === 'single' ? 'Sélection' : `${selection.size} animaux sélectionnés`}
                    </span>
                </div>
                <button
                    onClick={onClear}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title="Effacer la sélection"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Selected animals list */}
            <div className="space-y-1">
                {selectedAnimals.map(animal => (
                    <div key={animal.id} className="text-sm text-slate-700">
                        • {animal.name}
                    </div>
                ))}
                {hasMore && (
                    <div className="text-sm text-slate-500 italic">
                        + {selection.size - 3} autre{selection.size - 3 > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Common ancestors info (grouped view only) */}
            {selectionMode === 'multiple' && commonAncestorsCount > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-600">
                        🔗 {commonAncestorsCount} ancêtre{commonAncestorsCount > 1 ? 's' : ''} commun{commonAncestorsCount > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* Help text */}
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                <div>Clic → Sélection unique</div>
                <div>Ctrl+Clic → Ajouter à la sélection</div>
            </div>
        </div>
    );
};
