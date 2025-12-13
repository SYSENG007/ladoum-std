import React, { useMemo, useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, Heart } from 'lucide-react';
import clsx from 'clsx';
import {
    getUpcomingHeats,
    predictNextHeat,
    formatReproductiveStatus,
    getStatusColor
} from '../../utils/heatPrediction';
import type { Animal, HeatPrediction } from '../../types';

interface DayData {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    heats: Array<{ animal: Animal; prediction: HeatPrediction; isInWindow: boolean }>;
}

export const HeatCalendar: React.FC = () => {
    const { animals, loading } = useAnimals();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const females = useMemo(() =>
        animals.filter(a => a.gender === 'Female' && a.status === 'Active'),
        [animals]
    );

    // Get all predictions for the current month
    const monthData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Get starting day (Sunday = 0)
        const startDay = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        // Calculate predictions for all females
        const predictions = females.map(animal => ({
            animal,
            prediction: predictNextHeat(animal)
        })).filter(p => p.prediction !== null) as Array<{
            animal: Animal;
            prediction: HeatPrediction;
        }>;

        // Build calendar grid
        const days: DayData[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonth.getDate() - i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                heats: []
            });
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];

            const heats = predictions
                .filter(p => {
                    const windowStart = p.prediction.windowStart;
                    const windowEnd = p.prediction.windowEnd;
                    return dateStr >= windowStart && dateStr <= windowEnd;
                })
                .map(p => ({
                    animal: p.animal,
                    prediction: p.prediction,
                    isInWindow: dateStr === p.prediction.nextHeatDate
                }));

            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                heats
            });
        }

        // Next month days to fill grid
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                heats: []
            });
        }

        return days;
    }, [currentMonth, females]);

    // Upcoming heats in next 7 days
    const upcomingHeats = useMemo(() =>
        getUpcomingHeats(animals, 7),
        [animals]
    );

    const navigateMonth = (direction: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array(35).fill(0).map((_, i) => (
                            <div key={i} className="h-20 bg-slate-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Upcoming Heats Alert */}
            {upcomingHeats.length > 0 && (
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Chaleurs à surveiller</h4>
                            <p className="text-sm text-slate-500">Prochains 7 jours</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {upcomingHeats.slice(0, 5).map(({ animal, prediction }) => {
                            const daysUntil = Math.ceil(
                                (new Date(prediction.nextHeatDate).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            );

                            return (
                                <div
                                    key={animal.id}
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                                >
                                    <img
                                        src={animal.photoUrl}
                                        alt={animal.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{animal.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(prediction.windowStart).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short'
                                            })} - {new Date(prediction.windowEnd).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short'
                                            })}
                                        </p>
                                    </div>
                                    <Badge variant={daysUntil <= 2 ? 'warning' : 'info'}>
                                        {daysUntil === 0 ? "Aujourd'hui" :
                                            daysUntil === 1 ? 'Demain' :
                                                `Dans ${daysUntil}j`}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Calendar */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 capitalize">{monthName}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                            onClick={() => setCurrentMonth(new Date())}
                            className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {monthData.map((day, index) => (
                        <div
                            key={index}
                            className={clsx(
                                "min-h-[80px] p-1 rounded-lg border transition-colors",
                                day.isCurrentMonth
                                    ? "bg-white border-slate-100"
                                    : "bg-slate-50 border-slate-50",
                                day.isToday && "border-primary-300 bg-primary-50"
                            )}
                        >
                            <div className={clsx(
                                "text-xs font-medium mb-1",
                                day.isCurrentMonth ? "text-slate-700" : "text-slate-400",
                                day.isToday && "text-primary-700"
                            )}>
                                {day.date.getDate()}
                            </div>
                            <div className="space-y-0.5">
                                {day.heats.slice(0, 3).map(({ animal, isInWindow }) => (
                                    <div
                                        key={animal.id}
                                        className={clsx(
                                            "text-[10px] px-1 py-0.5 rounded truncate",
                                            isInWindow
                                                ? "bg-pink-500 text-white font-medium"
                                                : "bg-pink-100 text-pink-700"
                                        )}
                                        title={animal.name}
                                    >
                                        {animal.name.split(' ')[0]}
                                    </div>
                                ))}
                                {day.heats.length > 3 && (
                                    <div className="text-[10px] text-slate-400 px-1">
                                        +{day.heats.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-pink-500"></div>
                        <span>Jour prévu</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-pink-100"></div>
                        <span>Fenêtre surveillance</span>
                    </div>
                </div>
            </Card>

            {/* All Females Status */}
            <Card>
                <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Statut Reproducteur des Brebis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {females.map(animal => {
                        const prediction = predictNextHeat(animal);
                        const status = formatReproductiveStatus(
                            prediction?.reproductiveStatus || 'Available'
                        );
                        const statusColor = getStatusColor(
                            prediction?.reproductiveStatus || 'Available'
                        );

                        return (
                            <div
                                key={animal.id}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                            >
                                <img
                                    src={animal.photoUrl}
                                    alt={animal.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">{animal.name}</p>
                                    {prediction && prediction.reproductiveStatus !== 'Pregnant' && (
                                        <p className="text-xs text-slate-500">
                                            Prochaine: {new Date(prediction.nextHeatDate).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </p>
                                    )}
                                </div>
                                <Badge variant={statusColor as any}>
                                    {status}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};
