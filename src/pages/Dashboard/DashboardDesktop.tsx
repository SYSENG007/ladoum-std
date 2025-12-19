import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../../hooks/useAnimals';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import { Card } from '../../components/ui/Card';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import { ExpertCard } from '../../components/dashboard/ExpertCard';
import { RemindersCard } from '../../components/dashboard/RemindersCard';
import {
    Users,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import clsx from 'clsx';

type CarouselFilter = 'all' | 'males' | 'females' | 'certified' | 'recent';

export const DashboardDesktop: React.FC = () => {
    const navigate = useNavigate();
    const { animals } = useAnimals();
    const { user, userProfile } = useAuth();
    const { currentFarm } = useFarm();

    const [carouselFilter, setCarouselFilter] = useState<CarouselFilter>('all');
    const [carouselIndex, setCarouselIndex] = useState(0);

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
        const males = animals.filter(a => a.gender === 'Male').length;
        const females = animals.filter(a => a.gender === 'Female').length;

        return { total: totalAnimals, males, females };
    }, [animals]);

    const filteredAnimals = useMemo(() => {
        let result = [...animals];
        switch (carouselFilter) {
            case 'males': result = result.filter(a => a.gender === 'Male'); break;
            case 'females': result = result.filter(a => a.gender === 'Female'); break;
            case 'certified': result = result.filter(a => a.certification); break;
            case 'recent': result = result.sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime()).slice(0, 10); break;
        }
        return result;
    }, [animals, carouselFilter]);



    const canScrollLeft = carouselIndex > 0;
    const canScrollRight = carouselIndex < Math.max(0, filteredAnimals.length - 4);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {currentFarm?.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{currentFarm?.name || 'Ma Bergerie'}</h1>
                        <p className="text-sm text-slate-500">Planifiez, priorisez et gérez votre élevage avec facilité.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <button onClick={() => navigate('/profile')} className="flex items-center gap-3 hover:bg-white/50 rounded-xl px-3 py-2 transition-colors">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">{userProfile?.displayName || 'Utilisateur'}</p>
                            <p className="text-xs text-slate-500">
                                {userProfile?.role === 'owner' ? 'Propriétaire' : userProfile?.role === 'manager' ? 'Manager' : userProfile?.role === 'worker' ? 'Employé' : 'Utilisateur'}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {userInitials}
                        </div>
                    </button>
                </div>
            </div>

            {/* Main Content - Flex row, no scroll */}
            <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Left Side */}
                <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-hidden">
                    {/* KPI Row - Total Sujets (1 col) + ExpertCard (2 cols) */}
                    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                        {/* Total Sujets Card */}
                        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/herd')}>
                            <div className="flex items-start justify-between">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
                                <p className="text-sm text-slate-500">Total Sujets</p>
                                <div className="flex gap-3 mt-2 text-xs">
                                    <span className="text-blue-600 font-medium">♂ {stats.males} Mâles</span>
                                    <span className="text-pink-600 font-medium">♀ {stats.females} Femelles</span>
                                </div>
                            </div>
                        </Card>

                        {/* ExpertCard - Certification Progress (spans 2 columns) */}
                        <div className="col-span-2">
                            <ExpertCard animals={animals} />
                        </div>
                    </div>

                    {/* Sujets en Vedette - Fills remaining space */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-slate-900">Sujets en Vedette</h2>
                                <div className="flex gap-1">
                                    {(['all', 'males', 'females', 'certified', 'recent'] as CarouselFilter[]).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => { setCarouselFilter(filter); setCarouselIndex(0); }}
                                            className={clsx(
                                                "px-3 py-1 text-sm rounded-md transition-colors",
                                                carouselFilter === filter ? "bg-slate-100 font-medium text-slate-900" : "text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            {filter === 'all' ? 'Tous' : filter === 'males' ? 'Mâles' : filter === 'females' ? 'Femelles' : filter === 'certified' ? 'Certifiés' : 'Récents'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => navigate('/herd')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                                Voir tout <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Carousel with arrows */}
                        <div className="flex items-center gap-2 flex-1 min-h-0">
                            <button
                                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                                disabled={!canScrollLeft}
                                className={clsx("w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0", canScrollLeft ? "border-slate-300 hover:bg-slate-100" : "border-slate-200 text-slate-300")}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex-1 overflow-hidden">
                                <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${carouselIndex * 176}px)` }}>
                                    {filteredAnimals.length > 0 ? filteredAnimals.map(animal => (
                                        <div key={animal.id} onClick={() => navigate(`/herd/${animal.id}`)} className="w-40 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md">
                                            <div className="h-28 relative overflow-hidden">
                                                <img src={animal.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'} alt={animal.name} className="w-full h-full object-cover" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                    <p className="text-white font-semibold text-sm">{animal.name}</p>
                                                    <p className="text-white/70 text-xs">{animal.tagId || `LAD-${animal.id?.slice(-3)}`}</p>
                                                </div>
                                            </div>
                                            <div className="p-2 grid grid-cols-3 gap-1 text-center">
                                                <div><p className="text-[9px] text-slate-400">HG</p><p className="text-xs font-medium text-slate-700">{animal.height || '-'}</p></div>
                                                <div><p className="text-[9px] text-slate-400">LCS</p><p className="text-xs font-medium text-slate-700">{animal.length || '-'}</p></div>
                                                <div><p className="text-[9px] text-slate-400">TP</p><p className="text-xs font-medium text-slate-700">{animal.chestGirth || '-'}</p></div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="w-full text-center py-8 text-slate-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Aucun animal trouvé</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setCarouselIndex(prev => Math.min(filteredAnimals.length - 4, prev + 1))}
                                disabled={!canScrollRight}
                                className={clsx("w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0", canScrollRight ? "border-slate-300 hover:bg-slate-100" : "border-slate-200 text-slate-300")}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side - RemindersCard */}
                <div className="w-80 flex-shrink-0">
                    <RemindersCard animals={animals} />
                </div>
            </div>
        </div>
    );
};
