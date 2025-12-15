import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { HerdMobile } from './HerdMobile';
import { HerdDesktop } from './HerdDesktop';

/**
 * Herd page wrapper - renders Mobile or Desktop version
 */
export const Herd: React.FC = () => {
    const isMobile = useIsMobile(768);
    return isMobile ? <HerdMobile /> : <HerdDesktop />;
};

export default Herd;
