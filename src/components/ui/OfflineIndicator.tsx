import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import clsx from 'clsx';

export const OfflineIndicator: React.FC = () => {
    const { isOnline, isOffline, wasOffline } = useOfflineStatus();
    const [showBanner, setShowBanner] = useState(false);

    // Afficher la bannière quand on passe offline, puis la cacher après 30s
    useEffect(() => {
        if (isOffline) {
            setShowBanner(true);
            const timer = setTimeout(() => {
                setShowBanner(false);
            }, 30000); // 30 secondes
            return () => clearTimeout(timer);
        } else {
            setShowBanner(false);
        }
    }, [isOffline]);

    // Si online et jamais été offline, ne rien afficher
    if (isOnline && !wasOffline) {
        return null;
    }

    return (
        <>
            {/* Banner en haut si offline - disparaît après 30s */}
            {isOffline && showBanner && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg animate-fade-in">
                    <div className="flex items-center justify-center gap-2">
                        <WifiOff className="w-4 h-4" />
                        <span>Mode hors-ligne - Les modifications seront synchronisées</span>
                        <button
                            onClick={() => setShowBanner(false)}
                            className="ml-4 p-1 hover:bg-amber-600 rounded transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Toast de reconnexion */}
            {isOnline && wasOffline && (
                <div className="fixed top-4 right-4 z-[100] animate-slide-in">
                    <div className="bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <Wifi className="w-5 h-5" />
                        <span className="font-medium">Connexion rétablie</span>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                </div>
            )}

            {/* Indicateur permanent flottant si offline - reste tant qu'on est offline */}
            {isOffline && (
                <div className="fixed bottom-4 right-4 z-[99]">
                    <div className={clsx(
                        "bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg",
                        "flex items-center gap-2 text-sm font-medium"
                    )}>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        <span>Hors-ligne</span>
                    </div>
                </div>
            )}
        </>
    );
};
