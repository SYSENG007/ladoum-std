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

            {/* Desktop Floating Header */}
            <div className={clsx(
                "hidden md:flex fixed top-4 right-8 z-40 bg-white rounded-full shadow-md border border-slate-200 px-4 py-2 items-center gap-4",
                isSidebarCollapsed ? "left-24" : "left-72"
            )}>
                {/* Left - Farm Logo & Name */}
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Bergerie" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="font-bold text-slate-900 text-sm">Ma Bergerie</span>
                </div>
                <div className="flex-1" />
                {/* Right - Settings & Notifications */}
                <button
                    onClick={() => window.location.href = '/settings'}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <NotificationCenter />
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
