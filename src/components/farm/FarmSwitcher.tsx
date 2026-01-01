import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { Building2 } from 'lucide-react';
import clsx from 'clsx';

interface FarmSwitcherProps {
    collapsed?: boolean;
}

// Version mono-bergerie: affiche simplement le nom de la bergerie
export const FarmSwitcher: React.FC<FarmSwitcherProps> = ({ collapsed = false }) => {
    const { currentFarm } = useFarm();

    return (
        <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50",
            collapsed && "justify-center"
        )}>
            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-900" />
            </div>
            {!collapsed && (
                <span className="text-sm font-medium text-slate-700 truncate">
                    {currentFarm?.name || 'Ma Bergerie'}
                </span>
            )}
        </div>
    );
};
