/**
 * Alert component for warnings, info, and error messages
 */

import React from 'react';
import clsx from 'clsx';

interface AlertProps {
    children: React.ReactNode;
    variant?: 'info' | 'warning' | 'error' | 'success';
    className?: string;
}

export const Alert: React.FC<AlertProps> = ({
    children,
    variant = 'info',
    className
}) => {
    const variantClasses = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-orange-50 border-orange-200 text-orange-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800',
    };

    return (
        <div className={clsx(
            'rounded-lg border p-4',
            variantClasses[variant],
            className
        )}>
            {children}
        </div>
    );
};
