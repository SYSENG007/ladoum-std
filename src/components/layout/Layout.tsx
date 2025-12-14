import React, { useState, useMemo, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { FarmService } from '../../services/FarmService';
import type { Farm } from '../../types/farm';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [farms, setFarms] = useState<Farm[]>([]);
    const { user, userProfile } = useAuth();
    const { unreadCount } = useNotifications();

    // Load farms
    useEffect(() => {
        const loadFarms = async () => {
            if (!user) return;
            try {
                const userFarms = await FarmService.getByUserId(user.uid);
                setFarms(userFarms);
            } catch (err) {
                console.error('Error loading farms:', err);
            }
        };
        loadFarms();
    }, [user]);

    // Get active farm
    const activeFarm = useMemo(() => {
        if (!userProfile?.activeFarmId || !farms) return null;
        return farms.find(f => f.id === userProfile.activeFarmId);
    }, [userProfile?.activeFarmId, farms]);

    // Get user initials
    const userInitials = useMemo(() => {
        if (!userProfile?.displayName) return user?.email?.charAt(0).toUpperCase() || 'U';
        const names = userProfile.displayName.split(' ');
        if (names.length >= 2) {
            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
        }
        return userProfile.displayName.charAt(0).toUpperCase();
    }, [userProfile?.displayName, user?.email]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            {/* Desktop Header */}
            <div className={clsx(
                "hidden md:flex fixed top-0 right-0 z-40 bg-white px-8 py-4 items-center justify-between transition-all duration-300",
                isSidebarCollapsed ? "left-20" : "left-64"
            )}>
                {/* Left - Welcome + Farm Name with Logo */}
                <div className="flex items-center gap-3">
                    {/* Farm Logo */}
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {activeFarm?.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {activeFarm?.name || 'Ma Bergerie'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            Vous avez <span className="text-emerald-600 font-medium">{unreadCount} notification{unreadCount > 1 ? 's' : ''}</span> non lue{unreadCount > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Right - Notifications + User Profile */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <NotificationCenter />

                    {/* User Profile */}
                    <button
                        onClick={() => window.location.href = '/profile'}
                        className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-3 py-2 transition-colors"
                    >
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                                {userProfile?.displayName || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {user?.email || ''}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {userInitials}
                        </div>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className={clsx("min-h-screen pb-20 md:pb-0 transition-all duration-300", isSidebarCollapsed ? "md:ml-20" : "md:ml-64")}>
                <div className="p-4 md:p-8 md:pt-20 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Onboarding Tour - appears after completing onboarding */}
            <OnboardingTour />
        </div>
    );
};
