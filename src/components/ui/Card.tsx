import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, noPadding = false, ...props }) => {
    return (
        <div
            className={clsx(
                'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-200 hover:shadow-md',
                className
            )}
            {...props}
        >
            <div className={clsx(!noPadding && 'p-6')}>
                {children}
            </div>
        </div>
    );
};
