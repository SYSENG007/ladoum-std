import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../../hooks/useAnimals';
import { useTasks } from '../../hooks/useTasks';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import { useData } from '../../context/DataContext';
import { useTranslation } from '../../context/SettingsContext';
import { Card } from '../../components/ui/Card';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import {
    Users,
    ChevronRight,
    Heart,
    DollarSign,
    Baby,
    Stethoscope,
    Package
} from 'lucide-react';
import clsx from 'clsx';

type CarouselFilter = 'all' | 'males' | 'females' | 'certified';

export const DashboardMobile: React.FC = () => {
    const navigate = useNavigate();
    const { animals } = useAnimals();
    const { tasks } = useTasks();
    const { lowStockItems } = useInventory();
    const { user, userProfile } = useAuth();
    const { currentFarm } = useFarm();
    const { transactions } = useData();
    const { t } = useTranslation();

    const [carouselFilter, setCarouselFilter] = useState<CarouselFilter>('all');

    const userInitials = useMemo(() => {
        if (!userProfile?.displayName) return user?.email?.charAt(0).toUpperCase() || 'U';
        const names = userProfile.displayName.split(' ');
        if (names.length >= 2) {
            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
        }
        return userProfile.displayName.charAt(0).toUpperCase();
    }, [userProfile?.displayName, user?.email]);

    const stats = useMemo(() => {
        const nonExternalAnimals = animals.filter(a => a.status !== 'External');
        const totalAnimals = nonExternalAnimals.length;
        const recentBirths = nonExternalAnimals.filter(a => {
            const birthDate = new Date(a.birthDate);
            const now = new Date();
            const diffDays = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 90;
        }).length;

        const revenue = transactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);

        return { total: totalAnimals, births: recentBirths, revenue };
    }, [animals, transactions]);

    const filteredAnimals = useMemo(() => {
        let result = [...animals];
        switch (carouselFilter) {
            case 'males': result = result.filter(a => a.gender === 'Male'); break;
            case 'females': result = result.filter(a => a.gender === 'Female'); break;
            case 'certified': result = result.filter(a => a.certification); break;
        }
        return result;
    }, [animals, carouselFilter]);

    const heatAlertsCount = useMemo(() => {
        return animals.filter(a => a.gender === 'Female' && a.reproductionRecords?.length).length;
    }, [animals]);

    const healthRemindersCount = useMemo(() => {
        const healthTasksCount = tasks.filter(t => t.type === 'Health' && t.status !== 'Done').length;
        const healthRecordsCount = animals.reduce((count, animal) => {
            const recordsWithDueDate = (animal.healthRecords || []).filter(r => r.nextDueDate);
            return count + recordsWithDueDate.length;
        }, 0);
        return healthTasksCount + healthRecordsCount;
    }, [tasks, animals]);

    const activeAlertsCount = heatAlertsCount + healthRemindersCount + lowStockItems.length;

    const getFilterLabel = (filter: CarouselFilter) => {
        switch (filter) {
            case 'all': return t('dashboard.filter.all');
            case 'males': return t('dashboard.filter.males');
            case 'females': return t('dashboard.filter.females');
            case 'certified': return t('dashboard.filter.certified');
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">{t('page.dashboard')}</h1>
                    <p className="text-sm text-text-muted">{t('dashboard.welcome')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    >
                        {userInitials}
                    </button>
                </div>
            </div>

            {/* Farm Card - Clean horizontal design */}
            <Card className="p-4 mb-3 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {currentFarm?.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-lg text-text-primary mb-1">{currentFarm?.name || t('dashboard.myFarm')}</h2>
                        <p className="text-sm text-text-muted leading-snug">{t('dashboard.subtitle')}</p>
                    </div>
                </div>
            </Card>

            {/* Stats - 2 cols top, 1 full bottom */}
            <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
                {/* Total Sujets */}
                <Card className="p-3" onClick={() => navigate('/herd')}>
                    <div className="flex items-start justify-between">
                        <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">+12%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary mt-2">{stats.total}</h3>
                    <p className="text-sm text-text-muted">{t('dashboard.totalAnimals')}</p>
                </Card>

                {/* Naissances */}
                <Card className="p-3" onClick={() => navigate('/herd')}>
                    <div className="flex items-start justify-between">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Baby className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800">+12%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary mt-2">{stats.births}</h3>
                    <p className="text-sm text-text-muted">{t('dashboard.births90d')}</p>
                </Card>

                {/* Revenus - Full width */}
                <Card className="p-3 col-span-2" onClick={() => navigate('/accounting')}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-text-primary">{stats.revenue}</h3>
                                <p className="text-sm text-text-muted">{t('dashboard.revenue')}</p>
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-text-disabled">0%</span>
                    </div>
                </Card>
            </div>

            {/* Rappels & Alertes - Clean Design */}
            <div className="mb-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-text-primary">{t('dashboard.reminders')}</h2>
                    <span className={clsx(
                        "text-sm font-semibold px-3 py-1.5 rounded-full",
                        activeAlertsCount > 0
                            ? "bg-red-100 text-red-500"
                            : "bg-pink-100 text-pink-500"
                    )}>
                        {activeAlertsCount} {activeAlertsCount !== 1 ? t('dashboard.actives') : t('dashboard.active')}
                    </span>
                </div>
                <Card className="p-0 overflow-hidden">
                    {/* Chaleurs à surveiller */}
                    <button
                        onClick={() => navigate('/reproduction')}
                        className="w-full p-4 border-b border-slate-100 text-left hover:bg-pink-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Heart className="w-5 h-5 text-pink-500" />
                            <p className="text-sm font-bold text-text-primary uppercase tracking-wide">{t('dashboard.heats')}</p>
                        </div>
                        <p className="text-sm text-text-muted pl-7">
                            {heatAlertsCount > 0
                                ? `${heatAlertsCount} ${t('dashboard.heatsToWatch')}`
                                : t('dashboard.noHeats')}
                        </p>
                    </button>

                    {/* Santé à venir */}
                    <button
                        onClick={() => navigate('/tasks')}
                        className="w-full p-4 border-b border-slate-100 text-left hover:bg-blue-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Stethoscope className="w-5 h-5 text-primary-500" />
                            <p className="text-sm font-bold text-text-primary uppercase tracking-wide">{t('dashboard.health')}</p>
                        </div>
                        <p className="text-sm text-text-muted pl-7">
                            {healthRemindersCount > 0
                                ? `${healthRemindersCount} ${t('dashboard.healthReminders')}`
                                : t('dashboard.noHealth')}
                        </p>
                    </button>

                    {/* Alertes Stock */}
                    <button
                        onClick={() => navigate('/inventory')}
                        className="w-full p-4 text-left hover:bg-blue-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Package className="w-5 h-5 text-primary-500" />
                            <p className="text-sm font-bold text-text-primary uppercase tracking-wide">{t('dashboard.stockAlerts')}</p>
                        </div>
                        <p className="text-sm text-text-muted pl-7">
                            {lowStockItems.length > 0
                                ? `${lowStockItems.length} ${t('dashboard.lowStock')}`
                                : t('dashboard.noStock')}
                        </p>
                    </button>
                </Card>
            </div>

            {/* Sujets en Vedette - Flexible space */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <h2 className="text-base font-bold text-text-primary">{t('dashboard.featuredAnimals')}</h2>
                    <button onClick={() => navigate('/herd')} className="text-sm text-slate-900 font-medium flex items-center gap-1">
                        {t('dashboard.viewAll')} <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-2 flex-shrink-0">
                    {(['all', 'males', 'females', 'certified'] as CarouselFilter[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setCarouselFilter(filter)}
                            className={clsx(
                                "px-3 py-1.5 text-sm rounded-full font-medium",
                                carouselFilter === filter ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600"
                            )}
                        >
                            {getFilterLabel(filter)}
                        </button>
                    ))}
                </div>

                {/* Carousel horizontal scroll */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-3 h-full pb-2">
                        {filteredAnimals.length > 0 ? filteredAnimals.map(animal => (
                            <div
                                key={animal.id}
                                onClick={() => navigate(`/herd/${animal.id}`)}
                                className="w-36 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100"
                            >
                                <div className="h-24 relative overflow-hidden">
                                    <img src={animal.photoUrl || '/logo.png'} alt={animal.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                        <p className="text-white font-semibold text-sm">{animal.name}</p>
                                        <p className="text-white/80 text-xs">{animal.tagId || `LAD-${animal.id?.slice(-3)}`}</p>
                                    </div>
                                </div>
                                <div className="p-2 grid grid-cols-3 gap-1 text-center">
                                    <div><p className="text-xs text-text-muted">HG</p><p className="text-sm font-semibold text-text-primary">{animal.height || '-'}</p></div>
                                    <div><p className="text-xs text-text-muted">LCS</p><p className="text-sm font-semibold text-text-primary">{animal.length || '-'}</p></div>
                                    <div><p className="text-xs text-text-muted">TP</p><p className="text-sm font-semibold text-text-primary">{animal.chestGirth || '-'}</p></div>
                                </div>
                            </div>
                        )) : (
                            <div className="w-full flex items-center justify-center text-text-muted">
                                <p className="text-sm">{t('dashboard.noAnimals')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom padding for fixed nav */}
            <div className="h-16 flex-shrink-0" />
        </div>
    );
};
