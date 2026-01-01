import React from 'react';
import { Card } from '../ui/Card';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'blue' | 'amber' | 'red';
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, trend, color = 'primary' }) => {
    const colorStyles = {
        primary: 'bg-primary-50 text-primary-600',
        blue: 'bg-blue-50 text-primary-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <Card className="flex items-center gap-4 p-4">
            <div className={clsx('p-3 rounded-2xl', colorStyles[color])}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    {trend && (
                        <span className={clsx('text-xs font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
};
