import { useState, useEffect } from 'react';

export const useDeviceType = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const userAgent = navigator.userAgent.toLowerCase();

            // Check if mobile device
            const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
            const isMobileDevice = mobileRegex.test(userAgent) || width < 768;

            // Check if tablet
            const tabletRegex = /ipad|android(?!.*mobile)/i;
            const isTabletDevice = tabletRegex.test(userAgent) || (width >= 768 && width < 1024);

            setIsMobile(isMobileDevice);
            setIsTablet(isTabletDevice);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);

        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return {
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
    };
};
