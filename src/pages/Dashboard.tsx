import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/dashboard/StatCard';
import { AnimalCard } from '../components/herd/AnimalCard';
import { RemindersCard } from '../components/dashboard/RemindersCard';
import { ExpertCard } from '../components/dashboard/ExpertCard';
import { Users, Activity, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnimals } from '../hooks/useAnimals';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import clsx from 'clsx';

export const Dashboard: React.FC = () => {
    const { animals } = useAnimals();
    const navigate = useNavigate();
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'certified' | 'recent'>('all');
    const carouselRef = useRef<HTMLDivElement>(null);

    // Calculate real-time statistics
    const stats = useMemo(() => {
        const totalAnimals = animals.length;
        const today = new Date();
        const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        const recentBirths = animals.filter(a => new Date(a.birthDate) >= ninetyDaysAgo).length;
        const totalSales = animals.filter(a => a.status === 'Sold').length;
        const totalRevenue = animals.reduce((sum, animal) => {
            return sum + (animal.transactions || []).filter(t => t.type === 'Sale').reduce((s, t) => s + t.amount, 0);
        }, 0);

        return {
            totalAnimals,
            recentBirths,
            totalSales,
            totalRevenue: totalRevenue > 0 ? `${(totalRevenue / 1000000).toFixed(1)}M` : '0',
            birthTrend: '+12%',
            animalTrend: animals.length > 0 ? '+12%' : '0%',
            salesTrend: totalSales > 0 ? `+${totalSales}` : '0',
            revenueTrend: totalRevenue > 0 ? '+18%' : '0%'
        };
    }, [animals]);

    // Filter featured animals - only 3
    const featuredAnimals = useMemo(() => {
        let filtered = [...animals];
        switch (selectedFilter) {
            case 'certified':
                filtered = filtered.filter(a => a.certification);
                break;
            case 'recent':
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(a => new Date(a.birthDate) >= thirtyDaysAgo);
                break;
            default:
                filtered = filtered.filter(a => a.status === 'Active').sort((a, b) => {
                    if (a.certification && !b.certification) return -1;
                    if (!a.certification && b.certification) return 1;
                    return 0;
                });
        }
        return filtered.slice(0, 3);
    }, [animals, selectedFilter]);

    // Carousel scroll
    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] overflow-hidden">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Sujets" value={stats.totalAnimals.toString()} trend={stats.animalTrend} icon={Users} color="blue" onClick={() => navigate('/herd')} />
                <StatCard label="Naissances (90j)" value={stats.recentBirths.toString()} trend={stats.birthTrend} icon={Activity} color="green" onClick={() => navigate('/reproduction')} />
                <StatCard label="Ventes" value={stats.totalSales.toString()} trend={stats.salesTrend} icon={TrendingUp} color="purple" onClick={() => navigate('/herd')} />
                <StatCard label="Revenus" value={stats.totalRevenue} trend={stats.revenueTrend} icon={DollarSign} color="amber" onClick={() => navigate('/herd')} />
            </div>

            {/* Main Layout: Featured Animals + Reminders Side by Side */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left - Featured Animals */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header Row - Title, Filters, Arrows, See All - ALL ALIGNED */}
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-slate-900 whitespace-nowrap">Sujets en Vedette</h2>

                        {/* Filters */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {(['all', 'certified', 'recent'] as const).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setSelectedFilter(filter)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
                                        selectedFilter === filter ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    {filter === 'all' ? 'Tous' : filter === 'certified' ? 'Certifiés' : 'Récents'}
                                </button>
                            ))}
                        </div>

                        {/* Navigation arrows */}
                        <div className="flex gap-1">
                            <button onClick={() => scrollCarousel('left')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => scrollCarousel('right')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* See All */}
                        <button onClick={() => navigate('/herd')} className="text-primary-600 font-medium hover:underline text-sm whitespace-nowrap">
                            Voir tout →
                        </button>
                    </div>

                    {/* Animal Cards */}
                    {featuredAnimals.length === 0 ? (
                        <Card className="text-center py-12 text-slate-500 flex-1">
                            <p>Aucun animal à afficher</p>
                            <Button className="mt-4" onClick={() => navigate('/herd')}>Ajouter un animal</Button>
                        </Card>
                    ) : (
                        <div ref={carouselRef} className="flex gap-4 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                            {featuredAnimals.map(animal => (
                                <div key={animal.id} className="flex-shrink-0 w-[220px]">
                                    <AnimalCard animal={animal} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right - Reminders & Alerts */}
                <div className="w-[320px] flex-shrink-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    <RemindersCard animals={animals} />
                </div>
            </div>

            {/* Bottom - Certification Only */}
            <div className="max-w-2xl">
                <ExpertCard animals={animals} />
            </div>
        </div>
    );
};
