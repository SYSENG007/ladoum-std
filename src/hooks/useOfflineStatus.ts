import { useState, useEffect, useCallback } from 'react';

interface OfflineStatus {
    isOnline: boolean;
    isOffline: boolean;
    wasOffline: boolean;
    lastOnlineAt: Date | null;
}

export const useOfflineStatus = (): OfflineStatus => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
        navigator.onLine ? new Date() : null
    );

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        setLastOnlineAt(new Date());

        // Si on était offline avant, marquer comme "was offline"
        setWasOffline(prev => {
            if (!prev && !navigator.onLine) return true;
            return prev;
        });
    }, []);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setWasOffline(true);
    }, []);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    // Reset wasOffline après quelques secondes de connexion
    useEffect(() => {
        if (isOnline && wasOffline) {
            const timer = setTimeout(() => {
                setWasOffline(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    return {
        isOnline,
        isOffline: !isOnline,
        wasOffline,
        lastOnlineAt
    };
};
