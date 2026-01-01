import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PawPrint, Plus, CheckSquare, Settings } from 'lucide-react';
import clsx from 'clsx';

export const MobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { icon: Home, label: 'Accueil', path: '/' },
        { icon: PawPrint, label: 'Troupeau', path: '/herd' },
        { icon: Plus, label: '', path: '/herd', isCenter: true },
        { icon: CheckSquare, label: 'Tâches', path: '/tasks' },
        { icon: Settings, label: 'Réglages', path: '/settings' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return currentPath === '/';
        return currentPath.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-primary-600 border-t border-slate-200 dark:border-slate-700 z-50 md:hidden">
            <div className="flex items-center justify-around py-2 px-4 safe-area-bottom">
                {navItems.map((item, idx) => (
                    item.isCenter ? (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shadow-lg -mt-6"
                        >
                            <Plus className="w-6 h-6 text-white" />
                        </button>
                    ) : (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                "flex flex-col items-center gap-0.5 py-1 px-3",
                                isActive(item.path) ? "text-slate-900 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px]">{item.label}</span>
                        </button>
                    )
                ))}
            </div>
        </div>
    );
};
