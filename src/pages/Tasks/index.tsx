import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { TasksMobile } from './TasksMobile';
import { TasksDesktop } from './TasksDesktop';

/**
 * Tasks page wrapper - renders Mobile or Desktop version
 */
export const Tasks: React.FC = () => {
    const isMobile = useIsMobile(768);
    return isMobile ? <TasksMobile /> : <TasksDesktop />;
};

export default Tasks;
