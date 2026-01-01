import React, { useRef, useEffect } from 'react';
import { useZoomPan } from '../../hooks/useZoomPan';
import { PedigreeNode, PedigreeNodeDefs } from './PedigreeNode';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { getNodeOpacity, getEdgeOpacity, getHighlightedEdges } from '../../utils/pedigreeHighlight';
import type { LayoutResult } from '../../types/pedigree';

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
    const { transform, handlers, reset, fitToView, zoomIn, zoomOut } = useZoomPan(svgRef);

    // Fit to view when layout changes
    useEffect(() => {
        if (layout && layout.nodes.length > 0 && svgRef.current) {
            const timer = setTimeout(() => {
                fitToView(layout.bounds);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [layout, fitToView]);

    // Calculate highlighted edges
    const highlightedEdges = getHighlightedEdges(selection, visibleNodes, {
        descendants: new Map(),
        ancestors: new Map(),
        allIds: new Set(),
    });

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
                {/* Left: View Mode Info */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">
                        {selection.size === 0 && 'Vue globale'}
                        {selection.size === 1 && 'Vue individuelle'}
                        {selection.size > 1 && `Vue groupée (${selection.size})`}
                    </span>
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
                                        stroke="#94a3b8"
                                        strokeWidth="2"
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
