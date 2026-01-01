import React from 'react';
import { RotateCcw, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
    onReset: () => void;
    onFit: () => void;
    currentZoom: number;
}

/**
 * Zoom/Pan control buttons
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({ onReset, onFit, currentZoom }) => {
    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
            {/* Zoom level indicator */}
            <div className="px-3 py-1 text-xs font-mono text-slate-600 text-center border-b border-slate-200">
                {Math.round(currentZoom * 100)}%
            </div>

            {/* Fit to view */}
            <button
                onClick={onFit}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Fit all generations in view"
            >
                <Maximize2 className="w-4 h-4" />
                <span>Fit All</span>
            </button>

            {/* Reset */}
            <button
                onClick={onReset}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Reset zoom and pan"
            >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
            </button>
        </div>
    );
};
