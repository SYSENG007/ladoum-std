import React, { useRef, useEffect, useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { useZoomPan } from '../../hooks/useZoomPan';
import { PedigreeNode, PedigreeNodeDefs } from './PedigreeNode';
import { ZoomIn, ZoomOut, Maximize2, ChevronDown, Download } from 'lucide-react';
import { getNodeOpacity, getEdgeOpacity, getHighlightedEdges } from '../../utils/pedigreeHighlight';
import type { LayoutResult } from '../../types/pedigree';
import domtoimage from 'dom-to-image-more';

interface PedigreeCanvasProps {
    layout: LayoutResult;
    selection: Set<string>;
    commonAncestors: Set<string>;
    visibleNodes: Set<string>;
    onNodeClick: (nodeId: string, ctrlKey: boolean) => void;
}

/**
 * Pure rendering component for pedigree
 * Handles zoom/pan, visual highlighting, and user interaction
 */
export const PedigreeCanvas: React.FC<PedigreeCanvasProps> = ({
    layout,
    selection,
    commonAncestors,
    visibleNodes,
    onNodeClick,
}) => {
    const svgRef = useRef<SVGSVGElement>(null!);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const { animals } = useAnimals();
    const { transform, handlers, fitToView, zoomIn, zoomOut } = useZoomPan(svgRef);
    const [showDropdown, setShowDropdown] = useState(false);
    const [exporting, setExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Export image handler - using dom-to-image for proper SVG/font/image capture
    const handleExportImage = async () => {
        if (!canvasContainerRef.current) return;
        setExporting(true);

        try {
            const dataUrl = await domtoimage.toPng(canvasContainerRef.current, {
                quality: 1.0,
                bgcolor: '#f1f5f9',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                },
            });

            const link = document.createElement('a');
            link.download = `pedigree-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error exporting image:', error);
        } finally {
            setExporting(false);
        }
    };

    // Fit to view when layout changes
    useEffect(() => {
        if (layout && layout.nodes.length > 0 && svgRef.current) {
            const timer = setTimeout(() => {
                fitToView(layout.bounds);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [layout, fitToView]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    // Calculate highlighted edges
    const highlightedEdges = getHighlightedEdges(selection, visibleNodes, {
        descendants: new Map(),
        ancestors: new Map(),
        allIds: new Set(),
    });

    // Get selected animals names
    const selectedAnimals = animals.filter(a => selection.has(a.id));
    const dropdownLabel = selection.size === 0
        ? 'Tous les animaux'
        : selection.size === 1
            ? selectedAnimals[0]?.name || '1 sélectionné'
            : `${selection.size} sélectionnés`;

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
                {/* Left: Animal Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">
                            {dropdownLabel}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-3 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-600 uppercase">
                                        Sélectionner des animaux
                                    </span>
                                    {selection.size > 0 && (
                                        <button
                                            onClick={() => {
                                                animals.forEach(a => onNodeClick(a.id, false));
                                                setShowDropdown(false);
                                            }}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Tout désélectionner
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Animals List */}
                            <div className="overflow-y-auto flex-1">
                                {animals.map(animal => (
                                    <label
                                        key={animal.id}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selection.has(animal.id)}
                                            onChange={() => onNodeClick(animal.id, true)}
                                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-2 focus:ring-primary-500"
                                        />
                                        <img
                                            src={animal.photoUrl}
                                            alt={animal.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-900 truncate">
                                                {animal.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {animal.tagId}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Zoom Controls + Fit All + Export */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => zoomOut()}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Zoom arrière"
                    >
                        <ZoomOut className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="text-sm font-medium text-slate-600 min-w-[3rem] text-center">
                        {Math.round(transform.scale * 100)}%
                    </span>
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
                        onClick={handleExportImage}
                        disabled={exporting}
                        className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        title="Télécharger image"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? 'Export...' : 'Image'}
                    </button>
                </div>
            </div>

            {/* CANVAS SVG */}
            <div ref={canvasContainerRef} className="relative flex-1 overflow-hidden">
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
                        {/* Edges */}
                        <g id="edges">
                            {edges.map(edge => {
                                const opacity = getEdgeOpacity(
                                    edge.from,
                                    edge.to,
                                    selection,
                                    highlightedEdges,
                                    visibleNodes
                                );

                                return (
                                    <path
                                        key={`${edge.from}-${edge.to}`}
                                        d={edge.path}
                                        stroke={edge.color || "#94a3b8"}
                                        strokeWidth={edge.color ? "3" : "2"}
                                        fill="none"
                                        opacity={opacity}
                                        className="transition-opacity duration-300"
                                    />
                                );
                            })}
                        </g>

                        {/* Nodes */}
                        <g id="nodes">
                            {nodes.map(node => {
                                const isSelected = selection.has(node.id);
                                const isCommonAncestor = commonAncestors.has(node.id);
                                const opacity = getNodeOpacity(
                                    node.id,
                                    selection,
                                    commonAncestors,
                                    visibleNodes
                                );

                                return (
                                    <g
                                        key={node.id}
                                        opacity={opacity}
                                        className="transition-opacity duration-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNodeClick(node.id, e.ctrlKey || e.metaKey);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <PedigreeNode
                                            node={node}
                                            isSelected={isSelected}
                                            isCommonAncestor={isCommonAncestor}
                                        />
                                    </g>
                                );
                            })}
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
                    {commonAncestors.size > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-400"></div>
                            <span className="text-sm text-slate-600">Ancêtre commun</span>
                        </div>
                    )}
                </div>

                {/* Right: Help */}
                <div className="text-xs text-slate-500">
                    Clic → Sélection • Ctrl+Clic → Multi-sélection • Molette → Zoom
                </div>
            </div>
        </div>
    );
};
