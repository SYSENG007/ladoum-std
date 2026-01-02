/**
 * ScoreBadge - Display morphometric score with classification
 */

import React from 'react';
import type { MorphometricClass } from '../../types/morphometric';
import { Badge } from '../ui/Badge';
import { getClassificationLabel } from '../../utils/morphometricScoring';
import clsx from 'clsx';

interface ScoreBadgeProps {
    score: number;
    classification: MorphometricClass;
    percentile?: number;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

const getClassColor = (classification: MorphometricClass): string => {
    const colors: Record<MorphometricClass, string> = {
        Elite: 'bg-green-600 text-white',
        TresBon: 'bg-green-400 text-white',
        Moyen: 'bg-orange-400 text-white',
        Faible: 'bg-red-400 text-white',
    };
    return colors[classification];
};

const getClassVariant = (classification: MorphometricClass): 'success' | 'info' | 'warning' | 'error' => {
    const variants: Record<MorphometricClass, 'success' | 'info' | 'warning' | 'error'> = {
        Elite: 'success',
        TresBon: 'success',
        Moyen: 'warning',
        Faible: 'error',
    };
    return variants[classification];
};

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
    score,
    classification,
    percentile,
    size = 'md',
    showTooltip = true,
}) => {
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    return (
        <div
            className="inline-flex items-center gap-2"
            title={showTooltip ? `Score morphologique calculé à partir des mesures disponibles, comparé à la population de la bergerie` : undefined}
        >
            <div className={clsx(
                'font-bold rounded-lg',
                getClassColor(classification),
                sizeClasses[size]
            )}>
                <span>{score}/100</span>
            </div>

            <Badge variant={getClassVariant(classification)}>
                {getClassificationLabel(classification)}
            </Badge>

            {percentile !== undefined && (
                <span className="text-xs text-slate-500">
                    Top {100 - percentile}% du troupeau
                </span>
            )}
        </div>
    );
};
