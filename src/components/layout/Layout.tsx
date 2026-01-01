import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { useSidebar } from '../../context/SidebarContext';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            {/* Main Content Area */}
            <main className={clsx("min-h-screen pb-20 md:pb-0 transition-all duration-300", isCollapsed ? "md:ml-20" : "md:ml-64")}>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation - Fixed on all pages */}
            <MobileBottomNav />

            {/* Onboarding Tour - appears after completing onboarding */}
            <OnboardingTour />
        </div>
    );
};
