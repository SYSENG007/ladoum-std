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
                'bg-surface-card rounded-xl shadow-sm border border-border-subtle transition-all duration-200 hover:shadow-md',
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
