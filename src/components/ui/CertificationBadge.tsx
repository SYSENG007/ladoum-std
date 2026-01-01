import React from 'react';
import { Shield, Award, Medal, Crown, Star } from 'lucide-react';
import clsx from 'clsx';
import type { CertificationLevel } from '../../types';

interface CertificationBadgeProps {
    level: CertificationLevel;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
    level,
    size = 'md',
    showLabel = true,
    className
}) => {
    const getBadgeStyles = (level: CertificationLevel) => {
        switch (level) {
            case 'Bronze':
                return 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 border-orange-300';
            case 'Silver':
                return 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-800 border-primary-400';
            case 'Gold':
                return 'bg-gradient-to-br from-yellow-100 to-yellow-300 text-yellow-800 border-yellow-400';
            case 'Platinum':
                return 'bg-gradient-to-br from-cyan-50 to-cyan-200 text-cyan-800 border-cyan-300';
            case 'Elite':
                return 'bg-gradient-to-br from-purple-100 to-purple-300 text-purple-900 border-purple-400';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getIcon = (level: CertificationLevel) => {
        switch (level) {
            case 'Bronze': return Shield;
            case 'Silver': return Medal;
            case 'Gold': return Award;
            case 'Platinum': return Star;
            case 'Elite': return Crown;
        }
    };

    const Icon = getIcon(level);

    const sizeClasses = {
        sm: 'p-1 text-xs',
        md: 'p-2 text-sm',
        lg: 'p-3 text-base',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <div className={clsx(
            "inline-flex items-center gap-2 rounded-lg border shadow-sm font-bold uppercase tracking-wide",
            getBadgeStyles(level),
            sizeClasses[size],
            className
        )}>
            <Icon className={clsx(iconSizes[size], "shrink-0")} />
            {showLabel && <span>{level}</span>}
        </div>
    );
};
