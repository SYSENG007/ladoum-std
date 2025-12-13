import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types/settings';
import { defaultAppSettings, translations } from '../types/settings';

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;
    t: (key: string) => string; // Translation function
}

const STORAGE_KEY = 'ladoum_std_settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        // Charger les settings depuis le localStorage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultAppSettings, ...JSON.parse(stored) };
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
        return defaultAppSettings;
    });

    // Sauvegarder les settings dans le localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    }, [settings]);

    // Appliquer le thème
    useEffect(() => {
        const root = document.documentElement;

        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else if (settings.theme === 'light') {
            root.classList.remove('dark');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [settings.theme]);

    // Appliquer la langue au document
    useEffect(() => {
        document.documentElement.lang = settings.language;
    }, [settings.language]);

    const updateSettings = useCallback((updates: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultAppSettings);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Fonction de traduction
    const t = useCallback((key: string): string => {
        const lang = settings.language;
        const langTranslations = translations[lang] || translations['fr'];
        return langTranslations[key] || key;
    }, [settings.language]);

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            resetSettings,
            t,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// Hook pour accéder uniquement à la fonction de traduction
export const useTranslation = () => {
    const { t, settings } = useSettings();
    return { t, language: settings.language };
};
