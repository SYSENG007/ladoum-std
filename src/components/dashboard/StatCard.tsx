import React from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
    label: string;
    value: string;
    trend: string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'amber';
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon: Icon, color, onClick }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        amber: 'bg-amber-100 text-amber-600',
    };

    const trendColor = trend.startsWith('+') ? 'text-green-600' : 'text-red-600';

    return (
        <div
            onClick={onClick}
            className={clsx(
                "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all",
                onClick && "cursor-pointer hover:shadow-md hover:border-primary-200 hover:-translate-y-1"
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={clsx("p-3 rounded-xl", colorClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={clsx("text-sm font-bold", trendColor)}>{trend}</span>
            </div>
            <div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
            </div>
        </div>
    );
};
