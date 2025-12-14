import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            {/* Main Content Area */}
            <main className={clsx("min-h-screen pb-20 md:pb-0 transition-all duration-300", isSidebarCollapsed ? "md:ml-20" : "md:ml-64")}>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Onboarding Tour - appears after completing onboarding */}
            <OnboardingTour />
        </div>
    );
};
