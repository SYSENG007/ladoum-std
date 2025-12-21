import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../../hooks/useAnimals';
import { useTasks } from '../../hooks/useTasks';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import { useData } from '../../context/DataContext';
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
        const totalAnimals = animals.length;
        const recentBirths = animals.filter(a => {
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
        // Count health tasks not done
        const healthTasksCount = tasks.filter(t => t.type === 'Health' && t.status !== 'Done').length;

        // Count healthRecords with nextDueDate (upcoming vaccinations, treatments)
        const healthRecordsCount = animals.reduce((count, animal) => {
            const recordsWithDueDate = (animal.healthRecords || []).filter(r => r.nextDueDate);
            return count + recordsWithDueDate.length;
        }, 0);

        return healthTasksCount + healthRecordsCount;
    }, [tasks, animals]);

    const activeAlertsCount = heatAlertsCount + healthRemindersCount + lowStockItems.length;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Tableau de bord</h1>
                    <p className="text-xs text-slate-500">Bienvenue sur Ladoum STD</p>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    >
                        {userInitials}
                    </button>
                </div>
            </div>

            {/* Farm Card */}
            <Card className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 mb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold">
                        {currentFarm?.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                    <div className="text-white">
                        <h2 className="font-bold text-sm">{currentFarm?.name || 'Ma Bergerie'}</h2>
                        <p className="text-[10px] text-white/80">Planifiez, priorisez et gérez votre élevage avec facilité.</p>
                    </div>
                </div>
            </Card>

            {/* Stats - 2 cols top, 1 full bottom */}
            <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
                {/* Total Sujets */}
                <Card className="p-3" onClick={() => navigate('/herd')}>
                    <div className="flex items-start justify-between">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-500">+12%</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-2">{stats.total}</h3>
                    <p className="text-xs text-slate-500">Total Sujets</p>
                </Card>

                {/* Naissances */}
                <Card className="p-3" onClick={() => navigate('/herd')}>
                    <div className="flex items-start justify-between">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Baby className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-500">+12%</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-2">{stats.births}</h3>
                    <p className="text-xs text-slate-500">Naissances (90j)</p>
                </Card>

                {/* Revenus - Full width */}
                <Card className="p-3 col-span-2" onClick={() => navigate('/accounting')}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{stats.revenue}</h3>
                                <p className="text-xs text-slate-500">Revenus</p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">0%</span>
                    </div>
                </Card>
            </div>

            {/* Rappels & Alertes - Clean Design */}
            <div className="mb-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-slate-900">Rappels & Alertes</h2>
                    <span className={clsx(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        activeAlertsCount > 0
                            ? "bg-red-100 text-red-500"
                            : "bg-pink-100 text-pink-500"
                    )}>
                        {activeAlertsCount} Actif{activeAlertsCount !== 1 ? 's' : ''}
                    </span>
                </div>
                <Card className="p-0 overflow-hidden">
                    {/* Chaleurs à surveiller - Click to go to reproduction */}
                    <button
                        onClick={() => navigate('/reproduction')}
                        className="w-full p-4 border-b border-slate-100 text-left hover:bg-pink-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Chaleurs à surveiller</p>
                        </div>
                        <p className="text-xs text-slate-400 italic pl-6">
                            {heatAlertsCount > 0
                                ? `${heatAlertsCount} brebis à surveiller`
                                : 'Aucune chaleur prévue.'}
                        </p>
                    </button>

                    {/* Santé à venir - Click to go to tasks */}
                    <button
                        onClick={() => navigate('/tasks')}
                        className="w-full p-4 border-b border-slate-100 text-left hover:bg-blue-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Stethoscope className="w-4 h-4 text-blue-500" />
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Santé à venir</p>
                        </div>
                        <p className="text-xs text-slate-400 italic pl-6">
                            {healthRemindersCount > 0
                                ? `${healthRemindersCount} rappel${healthRemindersCount > 1 ? 's' : ''} sanitaire${healthRemindersCount > 1 ? 's' : ''}`
                                : 'Aucun rappel sanitaire.'}
                        </p>
                    </button>

                    {/* Alertes Stock - Click to go to inventory */}
                    <button
                        onClick={() => navigate('/inventory')}
                        className="w-full p-4 text-left hover:bg-blue-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-blue-500" />
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Alertes Stock</p>
                        </div>
                        <p className="text-xs text-slate-400 italic pl-6">
                            {lowStockItems.length > 0
                                ? `${lowStockItems.length} article${lowStockItems.length > 1 ? 's' : ''} en stock critique`
                                : 'Aucune alerte stock.'}
                        </p>
                    </button>
                </Card>
            </div>

            {/* Sujets en Vedette - Flexible space */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <h2 className="text-sm font-bold text-slate-900">Sujets en Vedette</h2>
                    <button onClick={() => navigate('/herd')} className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                        Voir tout <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-2 flex-shrink-0">
                    {(['all', 'males', 'females', 'certified'] as CarouselFilter[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setCarouselFilter(filter)}
                            className={clsx(
                                "px-2.5 py-1 text-xs rounded-full",
                                carouselFilter === filter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                            )}
                        >
                            {filter === 'all' ? 'Tous' : filter === 'males' ? 'Mâles' : filter === 'females' ? 'Femelles' : 'Certifiés'}
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
                                    <img src={animal.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'} alt={animal.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                        <p className="text-white font-semibold text-xs">{animal.name}</p>
                                        <p className="text-white/70 text-[10px]">{animal.tagId || `LAD-${animal.id?.slice(-3)}`}</p>
                                    </div>
                                </div>
                                <div className="p-2 grid grid-cols-3 gap-1 text-center">
                                    <div><p className="text-[8px] text-slate-400">HG</p><p className="text-[10px] font-medium">{animal.height || '-'}</p></div>
                                    <div><p className="text-[8px] text-slate-400">LCS</p><p className="text-[10px] font-medium">{animal.length || '-'}</p></div>
                                    <div><p className="text-[8px] text-slate-400">TP</p><p className="text-[10px] font-medium">{animal.chestGirth || '-'}</p></div>
                                </div>
                            </div>
                        )) : (
                            <div className="w-full flex items-center justify-center text-slate-400">
                                <p className="text-xs">Aucun animal</p>
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
