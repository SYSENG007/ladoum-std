import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import {
    Users,
    Bell,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Heart,
    DollarSign,
    Baby,
    Stethoscope,
    Home,
    PawPrint,
    Plus,
    CheckSquare,
    Settings,
    Package
} from 'lucide-react';
import clsx from 'clsx';

// Simplified StatCard - responsive
interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendPositive?: boolean;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    onClick?: () => void;
    fullWidth?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    trend,
    trendPositive = true,
    icon: Icon,
    iconBg,
    iconColor,
    onClick,
    fullWidth = false
}) => {
    return (
        <Card
            className={clsx(
                "p-4 cursor-pointer hover:shadow-md transition-shadow",
                fullWidth && "col-span-2"
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className={clsx("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center", iconBg)}>
                    <Icon className={clsx("w-5 h-5 md:w-6 md:h-6", iconColor)} />
                </div>
                {trend && (
                    <span className={clsx(
                        "text-xs md:text-sm font-semibold",
                        trendPositive ? "text-emerald-500" : "text-red-500"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-3">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{value}</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">{title}</p>
            </div>
        </Card>
    );
};

// Animal Card for carousel - responsive
interface AnimalCardProps {
    name: string;
    tagId: string;
    photoUrl: string;
    hg?: number;
    lcs?: number;
    tp?: number;
    onClick?: () => void;
}

const AnimalCard: React.FC<AnimalCardProps> = ({
    name,
    tagId,
    photoUrl,
    hg,
    lcs,
    tp,
    onClick
}) => {
    return (
        <div
            className="w-40 md:w-44 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
        >
            <div className="h-28 md:h-32 relative overflow-hidden">
                <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-white/70 text-xs">{tagId}</p>
                </div>
            </div>
            <div className="p-2 md:p-3 grid grid-cols-3 gap-1 text-center">
                <div>
                    <p className="text-[9px] md:text-[10px] text-slate-400">HG</p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-700">{hg || '-'}</p>
                </div>
                <div>
                    <p className="text-[9px] md:text-[10px] text-slate-400">LCS</p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-700">{lcs || '-'}</p>
                </div>
                <div>
                    <p className="text-[9px] md:text-[10px] text-slate-400">TP</p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-700">{tp || '-'}</p>
                </div>
            </div>
        </div>
    );
};

// Heat alert item
interface HeatAlertProps {
    name: string;
    window: string;
    daysUntil: number;
}

const HeatAlertItem: React.FC<HeatAlertProps> = ({ name, window, daysUntil }) => (
    <div className="flex items-center gap-3">
        <Heart className="w-5 h-5 text-pink-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 text-sm">{name}</p>
            <p className="text-xs text-slate-500">Fenêtre: {window}</p>
        </div>
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded whitespace-nowrap">
            Dans {daysUntil}j
        </span>
    </div>
);

// Stock alert item
interface StockAlertProps {
    name: string;
    current: number;
    minimum: number;
    unit: string;
    onClick?: () => void;
}

const StockAlertItem: React.FC<StockAlertProps> = ({ name, current, minimum, unit, onClick }) => (
    <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 text-sm">{name}</p>
            <p className="text-xs text-red-500">Stock critique: {current} {unit} (Min: {minimum})</p>
        </div>
        <button
            onClick={onClick}
            className="px-3 py-1 border border-emerald-500 text-emerald-600 text-xs font-medium rounded-full hover:bg-emerald-50 transition-colors"
        >
            Voir
        </button>
    </div>
);

// Mobile Bottom Navigation
const MobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = window.location.pathname;

    const navItems = [
        { icon: Home, label: 'Accueil', path: '/' },
        { icon: PawPrint, label: 'Troupeau', path: '/herd' },
        { icon: Plus, label: '', path: '/herd', isCenter: true },
        { icon: CheckSquare, label: 'Tâches', path: '/tasks' },
        { icon: Settings, label: 'Réglages', path: '/settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden z-50">
            <div className="flex items-center justify-around">
                {navItems.map((item, idx) => (
                    item.isCenter ? (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-6"
                        >
                            <Plus className="w-6 h-6 text-white" />
                        </button>
                    ) : (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                "flex flex-col items-center gap-1 py-1 px-3",
                                location === item.path ? "text-emerald-600" : "text-slate-400"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px]">{item.label}</span>
                        </button>
                    )
                ))}
            </div>
        </div>
    );
};

type CarouselFilter = 'all' | 'males' | 'females' | 'certified' | 'recent';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { animals } = useAnimals();
    const { tasks } = useTasks();
    const { user, userProfile } = useAuth();
    const { currentFarm } = useFarm();
    const { transactions } = useData();

    // Carousel state
    const [carouselFilter, setCarouselFilter] = useState<CarouselFilter>('all');
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Get user initials
    const userInitials = useMemo(() => {
        if (!userProfile?.displayName) return user?.email?.charAt(0).toUpperCase() || 'U';
        const names = userProfile.displayName.split(' ');
        if (names.length >= 2) {
            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
        }
        return userProfile.displayName.charAt(0).toUpperCase();
    }, [userProfile?.displayName, user?.email]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalAnimals = animals.length;
        const recentBirths = animals.filter(a => {
            const birthDate = new Date(a.birthDate);
            const now = new Date();
            const diffDays = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 90;
        }).length;

        // Calculate revenue from transactions
        const revenue = transactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            total: totalAnimals,
            births: recentBirths,
            revenue: revenue
        };
    }, [animals, transactions]);

    // Filter animals for carousel
    const filteredAnimals = useMemo(() => {
        let result = [...animals];
        switch (carouselFilter) {
            case 'males':
                result = result.filter(a => a.gender === 'Male');
                break;
            case 'females':
                result = result.filter(a => a.gender === 'Female');
                break;
            case 'certified':
                result = result.filter(a => a.certification);
                break;
            case 'recent':
                result = result.sort((a, b) =>
                    new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime()
                ).slice(0, 10);
                break;
        }
        return result;
    }, [animals, carouselFilter]);

    // Calculate heat alerts from female animals
    const heatAlerts = useMemo(() => {
        const females = animals.filter(a => a.gender === 'Female');
        const alerts: HeatAlertProps[] = [];

        females.forEach(female => {
            if (female.reproductionRecords && female.reproductionRecords.length > 0) {
                const lastEvent = female.reproductionRecords
                    .filter(r => r.type === 'Heat' || r.type === 'Mating')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                if (lastEvent) {
                    const lastDate = new Date(lastEvent.date);
                    const cycleLength = 17;
                    const nextHeatDate = new Date(lastDate.getTime() + cycleLength * 24 * 60 * 60 * 1000);
                    const now = new Date();
                    const daysUntil = Math.ceil((nextHeatDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysUntil > 0 && daysUntil <= 14) {
                        const startDate = new Date(nextHeatDate.getTime() - 2 * 24 * 60 * 60 * 1000);
                        const endDate = new Date(nextHeatDate.getTime() + 2 * 24 * 60 * 60 * 1000);
                        alerts.push({
                            name: female.name,
                            window: `${startDate.getDate()} ${startDate.toLocaleString('fr', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('fr', { month: 'short' })}`,
                            daysUntil
                        });
                    }
                }
            }
        });

        return alerts.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
    }, [animals]);

    // Stock alerts placeholder
    const stockAlerts = useMemo((): StockAlertProps[] => {
        return [];
    }, []);

    // Health reminders from tasks
    const healthReminders = useMemo(() => {
        return tasks.filter(t =>
            t.type === 'Health' &&
            t.status !== 'Done' &&
            new Date(t.date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ).slice(0, 3);
    }, [tasks]);

    // Total active alerts count
    const activeAlertsCount = heatAlerts.length + stockAlerts.length + healthReminders.length;

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}K`;
        }
        return amount.toString();
    };

    return (
        <>
            <div className="h-full flex flex-col pb-20 md:pb-0">
                {/* Mobile Header */}
                <div className="md:hidden mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Tableau de bord</h1>
                            <p className="text-xs text-slate-500">Bienvenue sur Ladoum STD</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationCenter />
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            >
                                {userInitials}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Header - Hidden on mobile */}
                <div className="hidden md:flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {currentFarm?.name?.charAt(0).toUpperCase() || 'B'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {currentFarm?.name || 'Ma Bergerie'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                Planifiez, priorisez et gérez votre élevage avec facilité.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-3 hover:bg-white/50 rounded-xl px-3 py-2 transition-colors"
                        >
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">
                                    {userProfile?.displayName || 'Utilisateur'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {userProfile?.role === 'owner' ? 'Propriétaire' :
                                        userProfile?.role === 'manager' ? 'Manager' :
                                            userProfile?.role === 'worker' ? 'Employé' : 'Utilisateur'}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {userInitials}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Farm Card */}
                <div className="md:hidden mb-4">
                    <Card className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {currentFarm?.name?.charAt(0).toUpperCase() || 'B'}
                            </div>
                            <div className="text-white">
                                <h2 className="font-bold">{currentFarm?.name || 'Ma Bergerie'}</h2>
                                <p className="text-xs text-white/80">Planifiez, priorisez et gérez votre élevage avec facilité.</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0 overflow-y-auto md:overflow-visible">
                    {/* Left Side */}
                    <div className="flex-1 space-y-4 md:space-y-6">
                        {/* Stats Grid - 2 cols on mobile, 3 on desktop */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            <StatCard
                                title="Total Sujets"
                                value={stats.total}
                                trend={stats.total > 0 ? "+12%" : undefined}
                                trendPositive={true}
                                icon={Users}
                                iconBg="bg-blue-100"
                                iconColor="text-blue-600"
                                onClick={() => navigate('/herd')}
                            />
                            <StatCard
                                title="Naissances (90j)"
                                value={stats.births}
                                trend={stats.births > 0 ? "+12%" : undefined}
                                trendPositive={true}
                                icon={Baby}
                                iconBg="bg-purple-100"
                                iconColor="text-purple-600"
                                onClick={() => navigate('/herd')}
                            />
                            <StatCard
                                title="Revenus"
                                value={formatCurrency(stats.revenue)}
                                trend={stats.revenue > 0 ? "+8%" : "0%"}
                                trendPositive={stats.revenue > 0}
                                icon={DollarSign}
                                iconBg="bg-amber-100"
                                iconColor="text-amber-600"
                                onClick={() => navigate('/accounting')}
                                fullWidth={false}
                            />
                        </div>

                        {/* Rappels & Alertes - Mobile first, then moved to right on desktop */}
                        <div className="md:hidden">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-base font-bold text-slate-900">Rappels & Alertes</h2>
                                <span className={clsx(
                                    "text-xs font-semibold px-2 py-1 rounded-full",
                                    activeAlertsCount > 0
                                        ? "text-red-500"
                                        : "bg-emerald-100 text-emerald-600"
                                )}>
                                    {activeAlertsCount} Actifs
                                </span>
                            </div>

                            {/* Compact alerts for mobile */}
                            <div className="space-y-3">
                                {/* Chaleurs */}
                                <div className="flex items-start gap-3">
                                    <Heart className="w-4 h-4 text-pink-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700 uppercase">Chaleurs à surveiller</p>
                                        <p className="text-xs text-slate-500 italic">
                                            {heatAlerts.length > 0
                                                ? `${heatAlerts.length} à surveiller`
                                                : 'Aucune chaleur prévue.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Santé */}
                                <div className="flex items-start gap-3">
                                    <Stethoscope className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700 uppercase">Santé à venir</p>
                                        <p className="text-xs text-slate-500 italic">
                                            {healthReminders.length > 0
                                                ? `${healthReminders.length} rappels`
                                                : 'Aucun rappel sanitaire.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stock */}
                                <div className="flex items-start gap-3">
                                    <Package className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700 uppercase">Alertes stock</p>
                                        <p className="text-xs text-slate-500 italic">
                                            {stockAlerts.length > 0
                                                ? `${stockAlerts.length} alertes`
                                                : 'Aucune alerte stock.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sujets en Vedette */}
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-base md:text-lg font-bold text-slate-900">Sujets en Vedette</h2>
                                    {/* Tabs inline with title */}
                                    <div className="flex gap-2 overflow-x-auto">
                                        {(['all', 'males', 'females', 'certified', 'recent'] as CarouselFilter[]).map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setCarouselFilter(filter)}
                                                className={clsx(
                                                    "px-3 py-1 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap",
                                                    carouselFilter === filter
                                                        ? "bg-slate-100 font-medium text-slate-900"
                                                        : "text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                {filter === 'all' ? 'Tous' :
                                                    filter === 'males' ? 'Mâles' :
                                                        filter === 'females' ? 'Femelles' :
                                                            filter === 'certified' ? 'Certifiés' : 'Récents'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/herd')}
                                    className="text-xs md:text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                                >
                                    Voir tout
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Carousel with arrows on sides */}
                            <div className="relative flex items-center gap-2">
                                {/* Left Arrow */}
                                <button
                                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                                    disabled={carouselIndex === 0}
                                    className={clsx(
                                        "hidden md:flex w-8 h-8 rounded-lg border items-center justify-center transition-colors flex-shrink-0",
                                        carouselIndex > 0 ? "border-slate-300 hover:bg-slate-100" : "border-slate-200 text-slate-300"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {/* Carousel */}
                                <div className="flex-1 overflow-x-auto pb-2">
                                    <div
                                        className="flex gap-3 md:gap-4 transition-transform duration-300"
                                        style={{ transform: `translateX(-${carouselIndex * 184}px)` }}
                                    >
                                        {filteredAnimals.length > 0 ? (
                                            filteredAnimals.map(animal => (
                                                <AnimalCard
                                                    key={animal.id}
                                                    name={animal.name}
                                                    tagId={animal.tagId || `LAD-${animal.id?.slice(-3)}`}
                                                    photoUrl={animal.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'}
                                                    hg={animal.height}
                                                    lcs={animal.length}
                                                    tp={animal.chestGirth}
                                                    onClick={() => navigate(`/herd/${animal.id}`)}
                                                />
                                            ))
                                        ) : (
                                            <div className="w-full text-center py-8 text-slate-400">
                                                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Aucun animal trouvé</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Arrow */}
                                <button
                                    onClick={() => setCarouselIndex(prev => Math.min(filteredAnimals.length - 4, prev + 1))}
                                    disabled={carouselIndex >= filteredAnimals.length - 4}
                                    className={clsx(
                                        "hidden md:flex w-8 h-8 rounded-lg border items-center justify-center transition-colors flex-shrink-0",
                                        carouselIndex < filteredAnimals.length - 4 ? "border-slate-300 hover:bg-slate-100" : "border-slate-200 text-slate-300"
                                    )}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Desktop Only - Rappels & Alertes */}
                    <div className="hidden md:block w-96 flex-shrink-0">
                        <Card className="h-full flex flex-col">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Rappels & Alertes</h3>
                                            <p className="text-xs text-slate-500">Santé, Reproduction et Stock</p>
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "text-sm font-semibold px-2 py-1 rounded-full",
                                        activeAlertsCount > 0
                                            ? "text-red-500"
                                            : "bg-emerald-100 text-emerald-600"
                                    )}>
                                        {activeAlertsCount} Actifs
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* CHALEURS À SURVEILLER */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Chaleurs à surveiller
                                    </h4>
                                    {heatAlerts.length > 0 ? (
                                        <div className="space-y-3">
                                            {heatAlerts.map((alert, idx) => (
                                                <HeatAlertItem key={idx} {...alert} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic text-center py-4">
                                            Aucune chaleur prévue.
                                        </p>
                                    )}
                                </div>

                                {/* SANTÉ À VENIR */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Santé à venir
                                    </h4>
                                    {healthReminders.length > 0 ? (
                                        <div className="space-y-3">
                                            {healthReminders.map(task => (
                                                <div key={task.id} className="flex items-center gap-3">
                                                    <Stethoscope className="w-5 h-5 text-emerald-500" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                                                        <p className="text-xs text-slate-500">{new Date(task.date).toLocaleDateString('fr')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic text-center py-4">
                                            Aucun rappel sanitaire.
                                        </p>
                                    )}
                                </div>

                                {/* ALERTES STOCK */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Alertes stock
                                    </h4>
                                    {stockAlerts.length > 0 ? (
                                        <div className="space-y-3">
                                            {stockAlerts.map((alert, idx) => (
                                                <StockAlertItem
                                                    key={idx}
                                                    name={alert.name}
                                                    current={alert.current}
                                                    minimum={alert.minimum}
                                                    unit={alert.unit}
                                                    onClick={() => navigate('/inventory')}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic text-center py-4">
                                            Aucune alerte stock.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </>
    );
};
