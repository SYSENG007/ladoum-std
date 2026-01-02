/**
 * PercentileBar - Visual percentile indicator for KPIs
 */

import React from 'react';
import clsx from 'clsx';

interface PercentileBarProps {
    percentile: number; // 0-100
    label?: string;
    compact?: boolean;
}

export const PercentileBar: React.FC<PercentileBarProps> = ({
    percentile,
    label,
    compact = false,
}) => {
    // Color based on percentile
    const getBarColor = (pct: number): string => {
        if (pct >= 75) return 'bg-green-500';
        if (pct >= 50) return 'bg-blue-500';
        if (pct >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className={clsx('mt-1', compact ? 'space-y-0.5' : 'space-y-1')}>
            <div className={clsx(
                'bg-slate-100 rounded-full overflow-hidden',
                compact ? 'h-0.5' : 'h-1'
            )}>
                <div
                    className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        getBarColor(percentile)
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, percentile))}%` }}
                />
            </div>
            <span className="text-xs text-slate-500">
                {label || `${Math.round(percentile)}e percentile`}
            </span>
        </div>
    );
};
