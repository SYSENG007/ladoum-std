import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import {
    Users,
    TrendingUp,
    Bell,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Heart,
    DollarSign,
    Baby
} from 'lucide-react';
import clsx from 'clsx';

// New simplified StatCard
interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendPositive?: boolean;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    trend,
    trendPositive = true,
    icon: Icon,
    iconBg,
    iconColor,
    onClick
}) => {
    return (
        <Card
            className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
                    <Icon className={clsx("w-6 h-6", iconColor)} />
                </div>
                {trend && (
                    <span className={clsx(
                        "text-sm font-semibold",
                        trendPositive ? "text-emerald-500" : "text-red-500"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
                <p className="text-sm text-slate-500 mt-1">{title}</p>
            </div>
        </Card>
    );
};

// Animal Card for carousel
interface AnimalCardProps {
    name: string;
    tagId: string;
    photoUrl: string;
    hg?: number;
    lcs?: number;
    tp?: number;
    weight?: number;
    onClick?: () => void;
}

const AnimalCard: React.FC<AnimalCardProps> = ({
    name,
    tagId,
    photoUrl,
    hg,
    lcs,
    tp,
    weight,
    onClick
}) => {
    return (
        <div
            className="w-44 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
        >
            <div className="h-32 relative overflow-hidden">
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
            <div className="p-3 grid grid-cols-4 gap-1 text-center">
                <div>
                    <p className="text-[10px] text-slate-400">HG</p>
                    <p className="text-xs font-medium text-slate-700">{hg || '-'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400">LCS</p>
                    <p className="text-xs font-medium text-slate-700">{lcs || '-'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400">TP</p>
                    <p className="text-xs font-medium text-slate-700">{tp || '-'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400">Masse</p>
                    <p className="text-xs font-medium text-slate-700">{weight || '-'}</p>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { animals } = useAnimals();
    useTasks(); // Keep for potential future use
    const { user, userProfile } = useAuth();

    // Carousel state
    const [carouselFilter, setCarouselFilter] = useState<'all' | 'certified' | 'recent'>('all');
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

        return {
            total: totalAnimals,
            births: recentBirths,
            sales: 0,
            revenue: 0
        };
    }, [animals]);

    // Filter animals for carousel
    const filteredAnimals = useMemo(() => {
        let result = [...animals];
        if (carouselFilter === 'certified') {
            result = result.filter(a => a.certification);
        } else if (carouselFilter === 'recent') {
            result = result.sort((a, b) =>
                new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime()
            ).slice(0, 10);
        }
        return result;
    }, [animals, carouselFilter]);

    const canScrollLeft = carouselIndex > 0;
    const canScrollRight = carouselIndex < filteredAnimals.length - 3;

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (direction === 'left' && canScrollLeft) {
            setCarouselIndex(prev => prev - 1);
        } else if (direction === 'right' && canScrollRight) {
            setCarouselIndex(prev => prev + 1);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header - Farm Info + User Profile */}
            <div className="flex items-center justify-between mb-8">
                {/* Left - Farm Logo + Name */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        B
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Ma Bergerie</h1>
                        <p className="text-sm text-slate-500">
                            Planifiez, priorisez et gérez votre élevage avec facilité.
                        </p>
                    </div>
                </div>

                {/* Right - Notifications + User Profile */}
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

            {/* Main Content */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Side */}
                <div className="flex-1 space-y-6 overflow-y-auto">
                    {/* Stats Grid - New Style */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard
                            title="Total Sujets"
                            value={stats.total}
                            trend="+12%"
                            trendPositive={true}
                            icon={Users}
                            iconBg="bg-blue-100"
                            iconColor="text-blue-600"
                            onClick={() => navigate('/herd')}
                        />
                        <StatCard
                            title="Naissances (90j)"
                            value={stats.births}
                            trend="+12%"
                            trendPositive={true}
                            icon={Baby}
                            iconBg="bg-purple-100"
                            iconColor="text-purple-600"
                            onClick={() => navigate('/herd')}
                        />
                        <StatCard
                            title="Ventes"
                            value={stats.sales}
                            icon={TrendingUp}
                            iconBg="bg-emerald-100"
                            iconColor="text-emerald-600"
                            onClick={() => navigate('/accounting')}
                        />
                        <StatCard
                            title="Revenus"
                            value={stats.revenue}
                            trend="0%"
                            trendPositive={false}
                            icon={DollarSign}
                            iconBg="bg-amber-100"
                            iconColor="text-amber-600"
                            onClick={() => navigate('/accounting')}
                        />
                    </div>

                    {/* Sujets en Vedette */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold text-slate-900">Sujets en Vedette</h2>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => { setCarouselFilter('all'); setCarouselIndex(0); }}
                                        className={clsx(
                                            "px-3 py-1 text-sm rounded-md transition-colors",
                                            carouselFilter === 'all' ? "bg-white shadow-sm font-medium" : "text-slate-600"
                                        )}
                                    >
                                        Tous
                                    </button>
                                    <button
                                        onClick={() => { setCarouselFilter('certified'); setCarouselIndex(0); }}
                                        className={clsx(
                                            "px-3 py-1 text-sm rounded-md transition-colors",
                                            carouselFilter === 'certified' ? "bg-white shadow-sm font-medium" : "text-slate-600"
                                        )}
                                    >
                                        Certifiés
                                    </button>
                                    <button
                                        onClick={() => { setCarouselFilter('recent'); setCarouselIndex(0); }}
                                        className={clsx(
                                            "px-3 py-1 text-sm rounded-md transition-colors",
                                            carouselFilter === 'recent' ? "bg-white shadow-sm font-medium" : "text-slate-600"
                                        )}
                                    >
                                        Récents
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => scrollCarousel('left')}
                                    disabled={!canScrollLeft}
                                    className={clsx(
                                        "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors",
                                        canScrollLeft ? "border-slate-300 hover:bg-slate-100" : "border-slate-200 text-slate-300"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollCarousel('right')}
                                    disabled={!canScrollRight}
                                    className={clsx(
                                        "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors",
                                        canScrollRight ? "border-slate-300 hover:bg-slate-100" : "border-slate-200 text-slate-300"
                                    )}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => navigate('/herd')}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 ml-2"
                                >
                                    Voir tout
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Carousel */}
                        <div className="overflow-hidden">
                            <div
                                className="flex gap-4 transition-transform duration-300"
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
                                            weight={animal.weight}
                                            onClick={() => navigate(`/herd/${animal.id}`)}
                                        />
                                    ))
                                ) : (
                                    <div className="w-full text-center py-12 text-slate-400">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Aucun animal trouvé</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Rappels & Alertes (Simplified) */}
                <div className="w-80 flex-shrink-0">
                    <Card className="h-full flex flex-col">
                        {/* Header - Simplified */}
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
                                <span className="text-sm font-semibold text-red-500">
                                    4 Actifs
                                </span>
                            </div>
                        </div>

                        {/* Content - Simple list style */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {/* CHALEURS À SURVEILLER */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Chaleurs à surveiller
                                </h4>
                                <div className="space-y-3">
                                    {/* Item 1 */}
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-pink-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm">Bella</p>
                                            <p className="text-xs text-slate-500">Fenêtre: 19 déc. - 23 déc.</p>
                                        </div>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                            Dans 7j
                                        </span>
                                    </div>

                                    {/* Item 2 */}
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-pink-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm">Fatoumata Binetou</p>
                                            <p className="text-xs text-slate-500">Fenêtre: 19 déc. - 23 déc.</p>
                                        </div>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                            Dans 7j
                                        </span>
                                    </div>

                                    {/* Item 3 */}
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-pink-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm">PIX</p>
                                            <p className="text-xs text-slate-500">Fenêtre: 19 déc. - 23 déc.</p>
                                        </div>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                            Dans 7j
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* SANTÉ À VENIR */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Santé à venir
                                </h4>
                                <p className="text-sm text-slate-400 italic text-center py-4">
                                    Aucun rappel sanitaire.
                                </p>
                            </div>

                            {/* ALERTES STOCK */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Alertes stock
                                </h4>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 text-sm">Aliment Concentré</p>
                                        <p className="text-xs text-red-500">Stock critique: 50 kg (Min: 100)</p>
                                    </div>
                                    <button className="px-3 py-1 border border-emerald-500 text-emerald-600 text-xs font-medium rounded-full hover:bg-emerald-50 transition-colors">
                                        Voir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
