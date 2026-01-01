import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { convertAnimalsToPedigree } from '../../utils/animalsToPedigree';
import { computeLayout, DEFAULT_LAYOUT_CONFIG } from '../../utils/pedigreeLayout';
import { validatePedigree } from '../../utils/pedigreeValidator';
import { useZoomPan } from '../../hooks/useZoomPan';
import { PedigreeNode, PedigreeNodeDefs } from './PedigreeNode';
import { ZoomControls } from './ZoomControls';
import { AddParentModal } from './AddParentModal';
import type { Animal } from '../../types';
import type { LayoutNode } from '../../types/pedigree';

interface FamilyTreeProps {
    rootAnimal: Animal;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ rootAnimal }) => {
    const { animals, refreshAnimals } = useAnimals();
    const svgRef = useRef<SVGSVGElement>(null);

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

    const { transform, handlers, reset, fitToView } = useZoomPan(svgRef as React.RefObject<SVGSVGElement>);

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
        refreshAnimals(); // Refresh to show updated pedigree
    };

    if (!layout || layout.nodes.length === 0) {
        return (
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f1f5f9'
            }}>
                <div style={{ color: '#64748b' }}>Aucun sujet à afficher</div>
            </div>
        );
    }

    const { nodes, edges, bounds } = layout;

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f1f5f9'
        }}>
            {/* SVG area */}
            <div style={{
                position: 'relative',
                flex: 1,
                overflow: 'hidden'
            }}>
                <div className="absolute top-4 right-4 z-10">
                    <ZoomControls
                        onReset={reset}
                        onFit={() => fitToView(bounds)}
                        currentZoom={transform.scale}
                    />
                </div>

                <svg
                    ref={svgRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'grab',
                        display: 'block'
                    }}
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

            {/* Legend bar - fixed height at bottom */}
            <div style={{
                flexShrink: 0,
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                fontSize: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#dbeafe', border: '2px solid #60a5fa' }}></div>
                    <span style={{ color: '#475569' }}>Mâle</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#fce7f3', border: '2px solid #f472b6' }}></div>
                    <span style={{ color: '#475569' }}>Femelle</span>
                </div>
                <div style={{ color: '#64748b' }}>
                    Molette : Zoom • Drag : Déplacer
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
