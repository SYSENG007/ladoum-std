import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { convertAnimalsToPedigree } from '../../utils/animalsToPedigree';
import { computeLayout, DEFAULT_LAYOUT_CONFIG } from '../../utils/pedigreeLayout';
import { validatePedigree } from '../../utils/pedigreeValidator';
import { useZoomPan } from '../../hooks/useZoomPan';
import { PedigreeNode, PedigreeNodeDefs } from './PedigreeNode';
import { AddParentModal } from './AddParentModal';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import type { Animal } from '../../types';
import type { LayoutNode } from '../../types/pedigree';

interface FamilyTreeProps {
    rootAnimal: Animal;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ rootAnimal }) => {
    const { animals, refreshAnimals } = useAnimals();
    const svgRef = useRef<SVGSVGElement>(null);

    // Configuration state
    const [maxGenerations, setMaxGenerations] = useState(5);
    const [maxAncestors, setMaxAncestors] = useState(3);

    // Modal state for adding parents
    const [showAddParentModal, setShowAddParentModal] = useState(false);
    const [parentContext, setParentContext] = useState<{
        childNode: LayoutNode;
        role: 'sire' | 'dam';
    } | null>(null);

    const pedigreeData = useMemo(() => {
        return convertAnimalsToPedigree(rootAnimal, animals);
    }, [rootAnimal, animals]);

    useMemo(() => {
        const validation = validatePedigree(pedigreeData);
        if (!validation.valid) {
            console.warn('Pedigree validation warnings:', validation.errors);
        }
    }, [pedigreeData]);

    const layout = useMemo(() => {
        return computeLayout(pedigreeData, DEFAULT_LAYOUT_CONFIG);
    }, [pedigreeData]);

    const { transform, handlers, reset, fitToView, zoomIn, zoomOut } = useZoomPan(svgRef as React.RefObject<SVGSVGElement>);

    useEffect(() => {
        if (layout && layout.nodes.length > 0 && svgRef.current) {
            const timer = setTimeout(() => {
                fitToView(layout.bounds);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [rootAnimal.id, layout]);

    // Handle adding parent
    const handleAddFather = (node: LayoutNode) => {
        setParentContext({ childNode: node, role: 'sire' });
        setShowAddParentModal(true);
    };

    const handleAddMother = (node: LayoutNode) => {
        setParentContext({ childNode: node, role: 'dam' });
        setShowAddParentModal(true);
    };

    const handleModalSuccess = () => {
        setShowAddParentModal(false);
        setParentContext(null);
        refreshAnimals();
    };

    if (!layout || layout.nodes.length === 0) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="text-slate-500">Aucun sujet à afficher</div>
            </div>
        );
    }

    const { nodes, edges, bounds } = layout;

    return (
        <div className="absolute inset-0 flex flex-col bg-slate-100">
            {/* TOP BAR */}
            <div className="flex-shrink-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                {/* Left: Subject Selector */}
                <div className="flex items-center gap-3">
                    <select
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={rootAnimal.id}
                        disabled
                    >
                        <option value={rootAnimal.id}>{rootAnimal.name}</option>
                    </select>
                </div>

                {/* Right: Zoom Controls */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 min-w-[3rem] text-right">
                        {Math.round(transform.scale * 100)}%
                    </span>
                    <button
                        onClick={() => zoomOut()}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Zoom arrière"
                    >
                        <ZoomOut className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                        onClick={() => zoomIn()}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Zoom avant"
                    >
                        <ZoomIn className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                        onClick={() => fitToView(bounds)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                        <Maximize2 className="w-4 h-4" />
                        Fit All
                    </button>
                    <button
                        onClick={reset}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* CANVAS SVG */}
            <div className="relative flex-1 overflow-hidden">
                <svg
                    ref={svgRef}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                    {...handlers}
                >
                    <PedigreeNodeDefs />
                    <g
                        id="viewport"
                        transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
                    >
                        <g id="edges">
                            {edges.map(edge => (
                                <path
                                    key={`${edge.from}-${edge.to}`}
                                    d={edge.path}
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    fill="none"
                                    opacity="0.6"
                                />
                            ))}
                        </g>
                        <g id="nodes">
                            {nodes.map(node => (
                                <PedigreeNode
                                    key={node.id}
                                    node={node}
                                    onAddFather={handleAddFather}
                                    onAddMother={handleAddMother}
                                />
                            ))}
                        </g>
                    </g>
                </svg>
            </div>

            {/* BOTTOM BAR */}
            <div className="flex-shrink-0 h-14 bg-white border-t border-slate-200 flex items-center justify-between px-6">
                {/* Left: Legend */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
                        <span className="text-sm text-slate-600">Mâle</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-400"></div>
                        <span className="text-sm text-slate-600">Femelle</span>
                    </div>
                </div>

                {/* Center: Generations Slider */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">
                        Générations:
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={maxGenerations}
                        onChange={(e) => setMaxGenerations(Number(e.target.value))}
                        className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <span className="text-sm font-medium text-slate-700 min-w-[1.5rem]">
                        {maxGenerations}
                    </span>
                </div>

                {/* Right: Ancestors Slider */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">
                        Ancêtres:
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={maxAncestors}
                        onChange={(e) => setMaxAncestors(Number(e.target.value))}
                        className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <span className="text-sm font-medium text-slate-700 min-w-[1.5rem]">
                        {maxAncestors}
                    </span>
                </div>
            </div>

            {/* AddParentModal */}
            {parentContext && (
                <AddParentModal
                    isOpen={showAddParentModal}
                    onClose={() => setShowAddParentModal(false)}
                    onSuccess={handleModalSuccess}
                    childAnimal={animals.find(a => a.id === parentContext.childNode.id)!}
                    role={parentContext.role}
                />
            )}
        </div>
    );
};
