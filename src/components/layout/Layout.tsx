import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import logo from '../../assets/logo.jpg';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Ladoum STD" className="w-8 h-8 rounded-md object-cover" />
                    <span className="font-bold text-lg text-slate-900">Ladoum STD</span>
                </div>
                <NotificationCenter />
            </div>

            {/* Desktop Header */}
            <div className={clsx(
                "hidden md:flex fixed top-0 right-0 z-40 bg-white border-b border-slate-200 px-8 py-4 items-center justify-between transition-all duration-300",
                isSidebarCollapsed ? "left-20" : "left-64"
            )}>
                {/* Left - Farm Name */}
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Ma Bergerie</h2>
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
                            <p className="text-sm font-semibold text-slate-900">Totok Michael</p>
                            <p className="text-xs text-slate-500">tmichael20@mail.com</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            T
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
