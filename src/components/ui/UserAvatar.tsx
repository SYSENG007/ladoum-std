import React from 'react';
import clsx from 'clsx';

interface UserAvatarProps {
    photoUrl?: string;
    displayName?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
    photoUrl,
    displayName,
    size = 'md',
    className = '',
}) => {
    const initial = displayName?.charAt(0).toUpperCase() || 'U';

    return photoUrl ? (
        <img
            src={photoUrl}
            alt={displayName || 'User'}
            className={clsx(
                'rounded-full object-cover border-2 border-slate-200',
                sizeClasses[size],
                className
            )}
        />
    ) : (
        <div
            className={clsx(
                'bg-primary-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-slate-200',
                sizeClasses[size],
                className
            )}
        >
            {initial}
        </div>
    );
};
