import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { DashboardMobile } from './DashboardMobile';
import { DashboardDesktop } from './DashboardDesktop';

/**
 * Dashboard component that renders Mobile or Desktop version
 * based on viewport width (breakpoint: 768px)
 */
export const Dashboard: React.FC = () => {
    const isMobile = useIsMobile(768);

    return isMobile ? <DashboardMobile /> : <DashboardDesktop />;
};

export default Dashboard;
