import React, { useMemo, useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, Heart, Plus, Baby } from 'lucide-react';
import { ReproductionEventModal } from './ReproductionEventModal';
import clsx from 'clsx';
import {
    getUpcomingHeats,
    getUpcomingBirths,
    predictNextHeat,
    predictBirthDate,
    formatReproductiveStatus,
    getStatusColor
} from '../../utils/heatPrediction';
import type { Animal, HeatPrediction, GestationPrediction, ReproductionRecord } from '../../types';

interface CalendarEvent {
    type: 'heat' | 'mating' | 'birth' | 'abortion' | 'ultrasound' | 'birth_prediction';
    animal: Animal;
    date: string;
    record?: ReproductionRecord;
    prediction?: HeatPrediction;
    gestationPrediction?: GestationPrediction;
    isInWindow?: boolean;
    mate?: Animal; // For mating events: the partner
}

interface DayData {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}

export const HeatCalendar: React.FC = () => {
    const { animals, loading } = useAnimals();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const females = useMemo(() =>
        animals.filter(a => a.gender === 'Female' && a.status === 'Active'),
        [animals]
    );

    // Get all events for the current month
    const monthData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDay = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        // Calculate heat predictions
        const heatPredictions = females.map(animal => ({
            animal,
            prediction: predictNextHeat(animal)
        })).filter(p => p.prediction !== null) as Array<{
            animal: Animal;
            prediction: HeatPrediction;
        }>;

        // Calculate birth predictions for pregnant females
        const birthPredictions = females.map(animal => ({
            animal,
            prediction: predictBirthDate(animal)
        })).filter(p => p.prediction !== null) as Array<{
            animal: Animal;
            prediction: GestationPrediction;
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
                events: []
            });
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const events: CalendarEvent[] = [];

            // Add heat predictions
            heatPredictions.forEach(p => {
                const windowStart = p.prediction.windowStart;
                const windowEnd = p.prediction.windowEnd;
                if (dateStr >= windowStart && dateStr <= windowEnd) {
                    events.push({
                        type: 'heat',
                        animal: p.animal,
                        date: dateStr,
                        prediction: p.prediction,
                        isInWindow: dateStr === p.prediction.nextHeatDate
                    });
                }
            });

            // Add reproduction events from all animals
            animals.forEach(animal => {
                if (!animal.reproductionRecords) return;

                animal.reproductionRecords.forEach(record => {
                    if (record.date.startsWith(dateStr)) {
                        // For mating: only show from female's perspective to avoid duplicates
                        if (record.type === 'Mating') {
                            // Only add if this is the female animal
                            if (animal.gender === 'Female') {
                                const mate = record.mateId ? animals.find(a => a.id === record.mateId) : undefined;
                                events.push({
                                    type: 'mating',
                                    animal,
                                    date: dateStr,
                                    record,
                                    mate
                                });
                            }
                            return; // Skip adding duplicate for male
                        }

                        const eventType = record.type === 'Birth' ? 'birth' :
                            record.type === 'Abortion' ? 'abortion' :
                                record.type === 'Ultrasound' ? 'ultrasound' : null;

                        if (eventType) {
                            events.push({
                                type: eventType as any,
                                animal,
                                date: dateStr,
                                record
                            });
                        }
                    }
                });
            });

            // Add birth predictions (gestation surveillance window)
            birthPredictions.forEach(p => {
                const windowStart = p.prediction.windowStart;
                const windowEnd = p.prediction.windowEnd;
                if (dateStr >= windowStart && dateStr <= windowEnd) {
                    events.push({
                        type: 'birth_prediction',
                        animal: p.animal,
                        date: dateStr,
                        gestationPrediction: p.prediction,
                        isInWindow: dateStr === p.prediction.expectedBirthDate
                    });
                }
            });

            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                events
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
                events: []
            });
        }

        return days;
    }, [currentMonth, females, animals]);

    // Upcoming heats in next 7 days
    const upcomingHeats = useMemo(() =>
        getUpcomingHeats(animals, 7),
        [animals]
    );

    // Upcoming births in next 14 days
    const upcomingBirths = useMemo(() =>
        getUpcomingBirths(animals, 14),
        [animals]
    );

    const navigateMonth = (direction: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const handleDayClick = (day: DayData) => {
        if (day.isCurrentMonth) {
            setSelectedDate(day.date);
            setShowEventModal(true);
        }
    };

    const getEventColor = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'heat': return { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500' };
            case 'mating': return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' };
            case 'birth': return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
            case 'abortion': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
            case 'ultrasound': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
            case 'birth_prediction': return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' };
        }
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
            {/* Top Cards - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Heats Alert */}
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
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {upcomingHeats.length === 0 ? (
                            <p className="text-center text-slate-400 py-4">Aucune chaleur prévue</p>
                        ) : (
                            upcomingHeats.slice(0, 5).map(({ animal, prediction }) => {
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
                            })
                        )}
                    </div>
                </Card>

                {/* Upcoming Births Alert */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Baby className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Mises-bas à surveiller</h4>
                            <p className="text-sm text-slate-500">Prochains 14 jours (±5j)</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {upcomingBirths.length === 0 ? (
                            <p className="text-center text-slate-400 py-4">Aucune mise-bas prévue</p>
                        ) : (
                            upcomingBirths.slice(0, 5).map(({ animal, prediction }) => {
                                const daysRemaining = prediction.daysRemaining;

                                return (
                                    <div
                                        key={animal.id}
                                        className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl"
                                    >
                                        <img
                                            src={animal.photoUrl}
                                            alt={animal.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{animal.name}</p>
                                            <p className="text-xs text-slate-500">
                                                Fenêtre: {new Date(prediction.windowStart).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short'
                                                })} - {new Date(prediction.windowEnd).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short'
                                                })}
                                            </p>
                                        </div>
                                        <Badge variant={daysRemaining <= 5 ? 'warning' : 'info'}>
                                            {daysRemaining <= 0 ? 'Imminent' :
                                                daysRemaining === 1 ? 'Demain' :
                                                    `J-${daysRemaining}`}
                                        </Badge>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>

            {/* Second Row: Females Status */}
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        Statut Reproducteur des Brebis
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                            onClick={() => handleDayClick(day)}
                            className={clsx(
                                "min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer",
                                day.isCurrentMonth
                                    ? "bg-white border-slate-100 hover:border-primary-300 hover:shadow-sm"
                                    : "bg-slate-50 border-slate-50",
                                day.isToday && "border-primary-300 bg-primary-50 ring-2 ring-primary-200"
                            )}
                        >
                            <div className={clsx(
                                "text-xs font-medium mb-1 flex items-center justify-between",
                                day.isCurrentMonth ? "text-slate-700" : "text-slate-400",
                                day.isToday && "text-primary-700 font-bold"
                            )}>
                                <span>{day.date.getDate()}</span>
                                {day.isCurrentMonth && day.events.length === 0 && (
                                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                {day.events.slice(0, 4).map((event, idx) => {
                                    const colors = getEventColor(event.type);
                                    const isHeatPeak = event.type === 'heat' && event.isInWindow;
                                    const isBirthPeak = event.type === 'birth_prediction' && event.isInWindow;
                                    const isPeak = isHeatPeak || isBirthPeak;

                                    // Build display name - for mating show "Female x Male"
                                    let displayName = event.animal.name.split(' ')[0];
                                    let titleText = `${event.animal.name} - ${event.type === 'birth_prediction' ? 'Mise-bas prévue' : event.type}`;

                                    if (event.type === 'mating' && event.mate) {
                                        displayName = `${event.animal.name.split(' ')[0]} x ${event.mate.name.split(' ')[0]}`;
                                        titleText = `Saillie: ${event.animal.name} x ${event.mate.name}`;
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={clsx(
                                                "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 truncate",
                                                isPeak ? `${colors.dot} text-white font-medium` : `${colors.bg} ${colors.text}`
                                            )}
                                            title={titleText}
                                        >
                                            <div className={clsx("w-1 h-1 rounded-full flex-shrink-0", colors.dot)} />
                                            <span className="truncate">{displayName}</span>
                                        </div>
                                    );
                                })}
                                {day.events.length > 4 && (
                                    <div className="text-[10px] text-slate-400 px-1.5">
                                        +{day.events.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-pink-500"></div>
                        <span>Chaleur (pic)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-pink-100"></div>
                        <span>Fenêtre surveillance</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-purple-500"></div>
                        <span>Saillie</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>Mise bas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>Avortement</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span>Échographie</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-orange-500"></div>
                        <span>Mise-bas (pic)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-orange-100"></div>
                        <span>Fenêtre mise-bas (±5j)</span>
                    </div>
                </div>
            </Card>

            {/* Event Modal */}
            <ReproductionEventModal
                isOpen={showEventModal}
                onClose={() => {
                    setShowEventModal(false);
                    setSelectedDate(null);
                }}
                initialDate={selectedDate}
            />
        </div>
    );
};
