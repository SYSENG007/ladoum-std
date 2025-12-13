import React, { useState } from 'react';
import {
    Settings as SettingsIcon,
    Globe,
    Palette,
    Bell,
    Database,
    Ruler,
    RotateCcw,
    Check,
    Moon,
    Sun,
    Monitor
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSettings } from '../context/SettingsContext';
import type { Language, ThemeMode, DateFormat, Currency } from '../types/settings';
import clsx from 'clsx';

export const Settings: React.FC = () => {
    const { settings, updateSettings, resetSettings } = useSettings();
    const [saved, setSaved] = useState(false);

    const showSavedMessage = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        updateSettings({ [key]: value });
        showSavedMessage();
    };

    const languages: { value: Language; label: string; flag: string }[] = [
        { value: 'fr', label: 'Français', flag: '🇫🇷' },
        { value: 'en', label: 'English', flag: '🇬🇧' },
        { value: 'wo', label: 'Wolof', flag: '🇸🇳' },
    ];

    const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Clair', icon: <Sun className="w-4 h-4" /> },
        { value: 'dark', label: 'Sombre', icon: <Moon className="w-4 h-4" /> },
        { value: 'system', label: 'Système', icon: <Monitor className="w-4 h-4" /> },
    ];

    const dateFormats: { value: DateFormat; label: string }[] = [
        { value: 'DD/MM/YYYY', label: '31/12/2024' },
        { value: 'MM/DD/YYYY', label: '12/31/2024' },
        { value: 'YYYY-MM-DD', label: '2024-12-31' },
    ];

    const currencies: { value: Currency; label: string; symbol: string }[] = [
        { value: 'XOF', label: 'Franc CFA', symbol: 'FCFA' },
        { value: 'EUR', label: 'Euro', symbol: '€' },
        { value: 'USD', label: 'Dollar US', symbol: '$' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-emerald-600" />
                        Paramètres
                    </h1>
                    <p className="text-slate-500 mt-1">Personnalisez votre expérience</p>
                </div>

                {saved && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Enregistré</span>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Langue */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Langue</h2>
                            <p className="text-sm text-slate-500">Choisissez votre langue préférée</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {languages.map(lang => (
                            <button
                                key={lang.value}
                                onClick={() => handleChange('language', lang.value)}
                                className={clsx(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    settings.language === lang.value
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className={clsx(
                                    "text-sm font-medium",
                                    settings.language === lang.value ? "text-emerald-700" : "text-slate-700"
                                )}>
                                    {lang.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Thème */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Palette className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Thème</h2>
                            <p className="text-sm text-slate-500">Apparence de l'application</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {themes.map(theme => (
                            <button
                                key={theme.value}
                                onClick={() => handleChange('theme', theme.value)}
                                className={clsx(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    settings.theme === theme.value
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {theme.icon}
                                <span className={clsx(
                                    "text-sm font-medium",
                                    settings.theme === theme.value ? "text-emerald-700" : "text-slate-700"
                                )}>
                                    {theme.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Notifications */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Bell className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Notifications</h2>
                            <p className="text-sm text-slate-500">Gérez vos alertes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between">
                            <span className="text-slate-700">Notifications activées</span>
                            <input
                                type="checkbox"
                                checked={settings.notificationsEnabled}
                                onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-slate-700">Notifications push</span>
                            <input
                                type="checkbox"
                                checked={settings.pushNotifications}
                                onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                                disabled={!settings.notificationsEnabled}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 disabled:opacity-50"
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-slate-700">Alertes stock bas</span>
                            <input
                                type="checkbox"
                                checked={settings.lowStockAlertEnabled}
                                onChange={(e) => handleChange('lowStockAlertEnabled', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                        </label>

                        <div>
                            <label className="text-slate-700 text-sm">Rappel tâches (jours avant)</label>
                            <input
                                type="number"
                                min="1"
                                max="7"
                                value={settings.taskReminderDays}
                                onChange={(e) => handleChange('taskReminderDays', parseInt(e.target.value))}
                                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </Card>

                {/* Formats */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Database className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Formats</h2>
                            <p className="text-sm text-slate-500">Dates et devises</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Format de date</label>
                            <div className="grid grid-cols-3 gap-2">
                                {dateFormats.map(format => (
                                    <button
                                        key={format.value}
                                        onClick={() => handleChange('dateFormat', format.value)}
                                        className={clsx(
                                            "py-2 px-3 rounded-lg text-sm font-medium transition-all border-2",
                                            settings.dateFormat === format.value
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        {format.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Devise</label>
                            <div className="grid grid-cols-3 gap-2">
                                {currencies.map(curr => (
                                    <button
                                        key={curr.value}
                                        onClick={() => handleChange('currency', curr.value)}
                                        className={clsx(
                                            "py-2 px-3 rounded-lg text-sm font-medium transition-all border-2",
                                            settings.currency === curr.value
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        {curr.symbol}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Unités */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <Ruler className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Unités</h2>
                            <p className="text-sm text-slate-500">Poids et mesures</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Unité de poids</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleChange('weightUnit', 'kg')}
                                    className={clsx(
                                        "py-2 px-4 rounded-lg font-medium transition-all border-2",
                                        settings.weightUnit === 'kg'
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-600"
                                    )}
                                >
                                    Kilogrammes (kg)
                                </button>
                                <button
                                    onClick={() => handleChange('weightUnit', 'lb')}
                                    className={clsx(
                                        "py-2 px-4 rounded-lg font-medium transition-all border-2",
                                        settings.weightUnit === 'lb'
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-600"
                                    )}
                                >
                                    Livres (lb)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Unité de mesure</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleChange('measurementUnit', 'cm')}
                                    className={clsx(
                                        "py-2 px-4 rounded-lg font-medium transition-all border-2",
                                        settings.measurementUnit === 'cm'
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-600"
                                    )}
                                >
                                    Centimètres (cm)
                                </button>
                                <button
                                    onClick={() => handleChange('measurementUnit', 'in')}
                                    className={clsx(
                                        "py-2 px-4 rounded-lg font-medium transition-all border-2",
                                        settings.measurementUnit === 'in'
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-600"
                                    )}
                                >
                                    Pouces (in)
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Reproduction */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-pink-100 rounded-lg">
                            <span className="text-pink-600 text-lg">🐑</span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Reproduction</h2>
                            <p className="text-sm text-slate-500">Paramètres pour les moutons</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600">Durée du cycle (jours)</label>
                            <input
                                type="number"
                                min="14"
                                max="21"
                                value={settings.heatCycleLength}
                                onChange={(e) => handleChange('heatCycleLength', parseInt(e.target.value))}
                                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Moyenne: 17 jours</p>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600">Durée de gestation (jours)</label>
                            <input
                                type="number"
                                min="140"
                                max="160"
                                value={settings.gestationLength}
                                onChange={(e) => handleChange('gestationLength', parseInt(e.target.value))}
                                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Moyenne: 150 jours</p>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600">Race par défaut</label>
                            <input
                                type="text"
                                value={settings.defaultBreed}
                                onChange={(e) => handleChange('defaultBreed', e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
                <Button
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => {
                        if (confirm('Réinitialiser tous les paramètres ?')) {
                            resetSettings();
                            showSavedMessage();
                        }
                    }}
                >
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};
