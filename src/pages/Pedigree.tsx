import React from 'react';
import { PedigreeViewer } from '../components/pedigree/PedigreeViewer';
import { useSidebar } from '../context/SidebarContext';

/**
 * Pedigree Page V1
 * Unified view supporting global/individual/grouped modes
 * Full screen layout - responsive to sidebar toggle
 */
export const Pedigree: React.FC = () => {
    const { isCollapsed } = useSidebar();

    return (
        <div
            className="fixed transition-all duration-300"
            style={{
                top: 0,
                right: 0,
                bottom: 0,
                left: isCollapsed ? '5rem' : '16rem', // 80px (collapsed) : 256px (expanded)
            }}
        >
            <PedigreeViewer />
        </div>
    );
};
