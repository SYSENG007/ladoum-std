import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CalendarDesktop } from './CalendarDesktop.tsx';
import { CalendarMobile } from './CalendarMobile.tsx';

/**
 * Calendar page wrapper - renders Mobile or Desktop version
 */
export const Calendar: React.FC = () => {
    const isMobile = useIsMobile(768);
    return isMobile ? <CalendarMobile /> : <CalendarDesktop />;
};

export default Calendar;
