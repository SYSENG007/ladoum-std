import React from 'react';
import type { LayoutNode } from '../../types/pedigree';
import { User } from 'lucide-react';

interface PedigreeNodeProps {
    node: LayoutNode;
    onClick?: (node: LayoutNode) => void;
    onAddFather?: (node: LayoutNode) => void;
    onAddMother?: (node: LayoutNode) => void;
}

/**
 * Individual pedigree subject card rendered in SVG
 */
export const PedigreeNode: React.FC<PedigreeNodeProps> = ({
    node,
    onClick,
    onAddFather,
    onAddMother
}) => {
    const { x, y, name, sex, photoUrl, tagId, fatherId, motherId } = node;

    const cardWidth = 200;
    const cardHeight = 140;

    const bgColor = sex === 'M' ? '#EFF6FF' : '#FCE7F3';
    const borderColor = sex === 'M' ? '#60A5FA' : '#F472B6';

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Main card */}
            <g
                onClick={() => onClick?.(node)}
                style={{ cursor: onClick ? 'pointer' : 'default' }}
            >
                {/* Card background */}
                <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="8"
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth="2"
                />

                {/* Photo area */}
                {photoUrl ? (
                    <image
                        x="10"
                        y="10"
                        width="180"
                        height="80"
                        href={photoUrl}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="url(#photoClip)"
                    />
                ) : (
                    <g>
                        <rect x="10" y="10" width="180" height="80" rx="4" fill="#F1F5F9" />
                        <User
                            x="85"
                            y="35"
                            width="30"
                            height="30"
                            stroke="#94A3B8"
                            strokeWidth="2"
                            fill="none"
                        />
                    </g>
                )}

                {/* Name */}
                <text
                    x={cardWidth / 2}
                    y="110"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="600"
                    fill="#1E293B"
                >
                    {name}
                </text>

                {/* Tag ID */}
                {tagId && (
                    <text
                        x={cardWidth / 2}
                        y="130"
                        textAnchor="middle"
                        fontSize="11"
                        fill="#64748B"
                    >
                        {tagId}
                    </text>
                )}
            </g>

            {/* Add Father button (left side) - only if fatherId is missing and callback provided */}
            {!fatherId && onAddFather && (
                <g
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddFather(node);
                    }}
                    style={{ cursor: 'pointer' }}
                    className="add-parent-button"
                >
                    <circle
                        cx="-15"
                        cy={cardHeight / 2}
                        r="16"
                        fill="#60A5FA"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <text
                        x="-15"
                        y={cardHeight / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="20"
                        fontWeight="bold"
                        fill="white"
                    >
                        +
                    </text>
                    {/* Tooltip hint */}
                    <g opacity="0" className="tooltip">
                        <rect
                            x="-60"
                            y={cardHeight / 2 - 25}
                            width="90"
                            height="30"
                            rx="4"
                            fill="#1E293B"
                        />
                        <text
                            x="-15"
                            y={cardHeight / 2 - 7}
                            textAnchor="middle"
                            fontSize="11"
                            fill="white"
                        >
                            Ajouter père
                        </text>
                    </g>
                </g>
            )}

            {/* Add Mother button (right side) - only if motherId is missing and callback provided */}
            {!motherId && onAddMother && (
                <g
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddMother(node);
                    }}
                    style={{ cursor: 'pointer' }}
                    className="add-parent-button"
                >
                    <circle
                        cx={cardWidth + 15}
                        cy={cardHeight / 2}
                        r="16"
                        fill="#F472B6"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <text
                        x={cardWidth + 15}
                        y={cardHeight / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="20"
                        fontWeight="bold"
                        fill="white"
                    >
                        +
                    </text>
                    {/* Tooltip hint */}
                    <g opacity="0" className="tooltip">
                        <rect
                            x={cardWidth - 30}
                            y={cardHeight / 2 - 25}
                            width="90"
                            height="30"
                            rx="4"
                            fill="#1E293B"
                        />
                        <text
                            x={cardWidth + 15}
                            y={cardHeight / 2 - 7}
                            textAnchor="middle"
                            fontSize="11"
                            fill="white"
                        >
                            Ajouter mère
                        </text>
                    </g>
                </g>
            )}
        </g>
    );
};

// Clip path for photo
export const PedigreeNodeDefs: React.FC = () => (
    <defs>
        <clipPath id="photoClip">
            <rect x="10" y="10" width="180" height="80" rx="4" />
        </clipPath>
        <style>
            {`
        .add-parent-button:hover circle {
          filter: brightness(1.1);
        }
        .add-parent-button:active circle {
          filter: brightness(0.9);
        }
        .add-parent-button:hover .tooltip {
          opacity: 1;
        }
      `}
        </style>
    </defs>
);
