import React from 'react';
import { PedigreeViewer } from '../components/pedigree/PedigreeViewer';

/**
 * Pedigree Page V1
 * Unified view supporting global/individual/grouped modes
 */
export const Pedigree: React.FC = () => {
    return (
        <div className="relative w-full" style={{ height: 'calc(100vh - 8rem)' }}>
            <PedigreeViewer />
        </div>
    );
};
