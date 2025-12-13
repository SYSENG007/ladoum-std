import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { UserService } from '../../services/UserService';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import clsx from 'clsx';

interface FarmSwitcherProps {
    collapsed?: boolean;
}

export const FarmSwitcher: React.FC<FarmSwitcherProps> = ({ collapsed = false }) => {
    const { user, refreshUserProfile } = useAuth();
    const { currentFarm, farms, switchFarm } = useFarm();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSwitchFarm = async (farmId: string) => {
        if (!user || farmId === currentFarm?.id) {
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            // Mettre à jour la ferme active dans le profil utilisateur
            await UserService.setActiveFarm(user.uid, farmId);
            // Mettre à jour le contexte
            await switchFarm(farmId);
            // Rafraîchir le profil
            await refreshUserProfile();
        } catch (err) {
            console.error('Error switching farm:', err);
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    };

    // Si une seule ferme ou pas de ferme, afficher simplement le nom
    if (farms.length <= 1) {
        return (
            <div className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50",
                collapsed && "justify-center"
            )}>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                {!collapsed && (
                    <span className="text-sm font-medium text-slate-700 truncate">
                        {currentFarm?.name || 'Ma Ferme'}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors w-full",
                    collapsed && "justify-center"
                )}
            >
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                {!collapsed && (
                    <>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                                {currentFarm?.name || 'Sélectionner'}
                            </p>
                            <p className="text-xs text-slate-400">{farms.length} fermes</p>
                        </div>
                        <ChevronDown className={clsx(
                            "w-4 h-4 text-slate-400 transition-transform",
                            isOpen && "rotate-180"
                        )} />
                    </>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className={clsx(
                        "absolute z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[200px]",
                        collapsed ? "left-full ml-2 top-0" : "left-0 right-0 mt-2"
                    )}>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Mes Fermes
                        </div>

                        {farms.map(farm => (
                            <button
                                key={farm.id}
                                onClick={() => handleSwitchFarm(farm.id)}
                                disabled={loading}
                                className={clsx(
                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors",
                                    farm.id === currentFarm?.id && "bg-emerald-50"
                                )}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    farm.id === currentFarm?.id
                                        ? "bg-emerald-500 text-white"
                                        : "bg-slate-100"
                                )}>
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={clsx(
                                        "text-sm font-medium truncate",
                                        farm.id === currentFarm?.id
                                            ? "text-emerald-700"
                                            : "text-slate-700"
                                    )}>
                                        {farm.name}
                                    </p>
                                    {farm.location && (
                                        <p className="text-xs text-slate-400 truncate">
                                            {farm.location}
                                        </p>
                                    )}
                                </div>
                                {farm.id === currentFarm?.id && (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                )}
                            </button>
                        ))}

                        <div className="border-t border-slate-100 mt-2 pt-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // TODO: Navigate to create farm or open modal
                                }}
                                className="w-full px-3 py-2 flex items-center gap-3 text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-8 h-8 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Nouvelle ferme</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
