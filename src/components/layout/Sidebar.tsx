import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PawPrint, GitFork, CalendarCheck, Package, LogOut, Menu, Store, Wallet, Stethoscope, Settings } from 'lucide-react';
import logo from '../../assets/logo.jpg';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { FarmSwitcher } from '../farm/FarmSwitcher';

const NAV_ITEMS = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/', tourId: 'dashboard' },
    { name: 'Troupeau', icon: PawPrint, path: '/herd', tourId: 'herd' },
    { name: 'Pédigrées', icon: GitFork, path: '/pedigree', tourId: 'pedigree' },
    { name: 'Reproduction', icon: CalendarCheck, path: '/reproduction', tourId: 'reproduction' },
    { name: 'Tâches', icon: CalendarCheck, path: '/tasks', tourId: 'tasks' },
    { name: 'Inventaire', icon: Package, path: '/inventory', tourId: 'inventory' },
    { name: 'Véto', icon: Stethoscope, path: '/teleconsultation', tourId: 'teleconsultation' },
    { name: 'Comptabilité', icon: Wallet, path: '/accounting', tourId: 'accounting' },
    { name: 'Marketplace', icon: Store, path: '/marketplace', tourId: 'marketplace' },
];

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={clsx(
                "hidden md:flex flex-col bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50 transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}>
                <div className={clsx("p-4 flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
                    <button onClick={toggleSidebar} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <Menu className="w-6 h-6 text-slate-600" />
                    </button>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                            <img src={logo} alt="Ladoum STD Logo" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-lg font-bold text-slate-800 truncate">Ladoum STD</span>
                        </div>
                    )}
                </div>

                {/* Farm Switcher */}
                <div className="px-3 py-2">
                    <FarmSwitcher collapsed={isCollapsed} />
                </div>

                <nav className="flex-1 px-3 py-4 space-y-2">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            title={isCollapsed ? item.name : undefined}
                            data-tour={item.tourId}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                                    isCollapsed ? "justify-center" : ""
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    {/* Settings Link */}
                    <NavLink
                        to="/settings"
                        title={isCollapsed ? "Paramètres" : undefined}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                isActive
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                                isCollapsed ? "justify-center" : ""
                            )
                        }
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>Paramètres</span>}
                    </NavLink>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-red-600 w-full transition-colors rounded-xl hover:bg-red-50",
                            isCollapsed ? "justify-center" : ""
                        )}
                        title={isCollapsed ? "Déconnexion" : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>Déconnexion</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-4 py-2 flex justify-between items-center safe-area-bottom">
                {NAV_ITEMS.slice(0, 5).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                                isActive ? 'text-primary-600' : 'text-slate-400'
                            )
                        }
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    );
};
