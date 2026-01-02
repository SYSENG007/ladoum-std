/**
 * ScoreGauge - Circular gauge for morphometric score
 */

import React from 'react';
import type { MorphometricClass } from '../../types/morphometric';
import { getClassificationLabel } from '../../utils/morphometricScoring';
import clsx from 'clsx';

interface ScoreGaugeProps {
    score: number; // 0-100
    classification: MorphometricClass;
    confidence: number; // 0-1
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
    score,
    classification,
    confidence,
}) => {
    // Calculate arc parameters
    const radius = 80;
    const strokeWidth = 16;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    // Arc goes from -135° to 135° (270° total)
    const arcLength = (circumference * 270) / 360;
    const scoreOffset = arcLength - (score / 100) * arcLength;

    // Color based on classification
    const getColor = (cls: MorphometricClass): string => {
        const colors: Record<MorphometricClass, string> = {
            Elite: '#059669',       // green-600
            TresBon: '#10b981',     // green-500
            Moyen: '#f59e0b',       // amber-500
            Faible: '#ef4444',      // red-500
        };
        return colors[cls];
    };

    const color = getColor(classification);

    return (
        <div className="flex flex-col items-center justify-center">
            {/* SVG Gauge */}
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-[135deg]"
            >
                {/* Background arc */}
                <circle
                    stroke="#e2e8f0"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />

                {/* Score arc */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeDashoffset={scoreOffset}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Score value (centered) */}
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-slate-900">{score}</span>
                <span className="text-sm text-slate-500">/100</span>
                <span
                    className={clsx(
                        'text-xs font-medium mt-1 px-2 py-0.5 rounded-full',
                        classification === 'Elite' && 'bg-green-100 text-green-700',
                        classification === 'TresBon' && 'bg-green-50 text-green-600',
                        classification === 'Moyen' && 'bg-orange-100 text-orange-700',
                        classification === 'Faible' && 'bg-red-100 text-red-700'
                    )}
                >
                    {getClassificationLabel(classification)}
                </span>
            </div>

            {/* Confidence indicator */}
            <div className="mt-4 text-center">
                <div className="flex items-center gap-2 justify-center">
                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${confidence * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-500">
                        {(confidence * 100).toFixed(0)}% confiance
                    </span>
                </div>
            </div>
        </div>
    );
};
