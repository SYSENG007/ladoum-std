import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PawPrint, GitFork, CalendarCheck, Calendar, Package, LogOut, Menu, Store, Wallet, Stethoscope, Settings, Users, Sun, Moon } from 'lucide-react';
import logo from '../../assets/logo.jpg';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useSettings, useTranslation } from '../../context/SettingsContext';
import { FarmSwitcher } from '../farm/FarmSwitcher';

// Navigation items with translation keys
const NAV_ITEMS = [
    { key: 'nav.dashboard', icon: LayoutDashboard, path: '/', tourId: 'dashboard' },
    { key: 'nav.herd', icon: PawPrint, path: '/herd', tourId: 'herd' },
    { key: 'nav.pedigree', icon: GitFork, path: '/pedigree', tourId: 'pedigree' },
    { key: 'nav.reproduction', icon: CalendarCheck, path: '/reproduction', tourId: 'reproduction' },
    { key: 'nav.tasks', icon: CalendarCheck, path: '/tasks', tourId: 'tasks' },
    { key: 'nav.calendar', icon: Calendar, path: '/calendar', tourId: 'calendar' },
    { key: 'nav.inventory', icon: Package, path: '/inventory', tourId: 'inventory' },
    { key: 'nav.staff', icon: Users, path: '/staff', tourId: 'staff' },
    { key: 'nav.vet', icon: Stethoscope, path: '/teleconsultation', tourId: 'teleconsultation' },
    { key: 'nav.accounting', icon: Wallet, path: '/accounting', tourId: 'accounting' },
    { key: 'nav.marketplace', icon: Store, path: '/marketplace', tourId: 'marketplace' },
];

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { logout } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleTheme = () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        updateSettings({ theme: newTheme });
    };

    const isDark = settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={clsx(
                "hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen fixed left-0 top-0 z-50 transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}>
                <div className={clsx("p-4 flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
                    <button onClick={toggleSidebar} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                            <img src={logo} alt="Ladoum STD Logo" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-lg font-bold text-slate-800 dark:text-white truncate">Ladoum STD</span>
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
                            title={isCollapsed ? t(item.key) : undefined}
                            data-tour={item.tourId}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200',
                                    isCollapsed ? "justify-center" : ""
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span className="truncate">{t(item.key)}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 w-full transition-colors rounded-xl",
                            isCollapsed ? "justify-center" : ""
                        )}
                        title={isCollapsed ? t(isDark ? 'theme.light' : 'theme.dark') : undefined}
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 shrink-0" />
                        ) : (
                            <Moon className="w-5 h-5 shrink-0" />
                        )}
                        {!isCollapsed && <span>{t(isDark ? 'theme.light' : 'theme.dark')}</span>}
                    </button>

                    {/* Settings Link */}
                    <NavLink
                        to="/settings"
                        title={isCollapsed ? t('nav.settings') : undefined}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200',
                                isCollapsed ? "justify-center" : ""
                            )
                        }
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>{t('nav.settings')}</span>}
                    </NavLink>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20",
                            isCollapsed ? "justify-center" : ""
                        )}
                        title={isCollapsed ? t('nav.logout') : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>{t('nav.logout')}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};
