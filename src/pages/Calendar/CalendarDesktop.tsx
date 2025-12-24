import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTasks } from '../../hooks/useTasks';
import { useAnimals } from '../../hooks/useAnimals';
import { useTranslation } from '../../context/SettingsContext';
import clsx from 'clsx';

type EventType = 'task' | 'reproduction' | 'health' | 'all';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: EventType;
    color: string;
    description?: string;
}

export const CalendarDesktop: React.FC = () => {
    const { t } = useTranslation();
    const { tasks } = useTasks();
    const { animals } = useAnimals();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [eventFilter, setEventFilter] = useState<EventType>('all');

    // Aggregate all farm events
    const allEvents = useMemo<CalendarEvent[]>(() => {
        const events: CalendarEvent[] = [];

        // Tasks
        tasks.forEach(task => {
            events.push({
                id: `task-${task.id}`,
                title: task.title,
                date: task.date,
                type: 'task',
                color: 'bg-blue-500',
                description: task.description
            });
        });

        // Reproduction events from animals
        animals.forEach(animal => {
            animal.reproductionRecords?.forEach(record => {
                events.push({
                    id: `repro-${animal.id}-${record.id}`,
                    title: `${record.type}: ${animal.name}`,
                    date: record.date,
                    type: 'reproduction',
                    color: 'bg-pink-500',
                    description: record.notes
                });
            });
        });

        // Health events from animals
        animals.forEach(animal => {
            animal.healthRecords?.forEach(record => {
                events.push({
                    id: `health-${animal.id}-${record.id}`,
                    title: `${record.type}: ${animal.name}`,
                    date: record.date,
                    type: 'health',
                    color: 'bg-green-500',
                    description: record.description
                });

                // Add next due date if exists
                if (record.nextDueDate) {
                    events.push({
                        id: `health-due-${animal.id}-${record.id}`,
                        title: `${record.type} dû: ${animal.name}`,
                        date: record.nextDueDate,
                        type: 'health',
                        color: 'bg-amber-500'
                    });
                }
            });
        });

        return events;
    }, [tasks, animals]);

    // Filter events
    const filteredEvents = useMemo(() => {
        if (eventFilter === 'all') return allEvents;
        return allEvents.filter(e => e.type === eventFilter);
    }, [allEvents, eventFilter]);

    // Get days in current month
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: Date[] = [];

        // Add previous month's days
        for (let i = 0; i < startDayOfWeek; i++) {
            const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
            days.push(prevDate);
        }

        // Add current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        // Add next month's days to complete the grid
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    };

    // Get days in current week
    const getDaysInWeek = () => {
        const curr = new Date(currentDate);
        const first = curr.getDate() - curr.getDay(); // First day is Sunday
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            days.push(new Date(curr.getFullYear(), curr.getMonth(), first + i));
        }
        return days;
    };

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredEvents.filter(e => e.date === dateStr);
    };

    // Navigation
    const previous = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (view === 'week') {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentDate(newDate);
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 1);
            setCurrentDate(newDate);
        }
    };

    const next = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (view === 'week') {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentDate(newDate);
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 1);
            setCurrentDate(newDate);
        }
    };

    const today = () => {
        setCurrentDate(new Date());
    };

    const getDisplayTitle = () => {
        if (view === 'month') {
            return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        } else if (view === 'week') {
            const weekDays = getDaysInWeek();
            const start = weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const end = weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            return `${start} - ${end}`;
        } else {
            return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
    };

    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <CalendarIcon className="w-7 h-7 text-primary-600" />
                        {t('page.calendar')}
                    </h1>
                    <p className="text-text-muted">Vue d'ensemble de tous les événements de la bergerie</p>
                </div>

                {/* Event filters */}
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-text-muted" />
                    <select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value as EventType)}
                        className="px-4 py-2 rounded-lg bg-surface-input border border-border-default text-text-primary"
                    >
                        <option value="all">Tous les événements</option>
                        <option value="task">Tâches</option>
                        <option value="reproduction">Reproduction</option>
                        <option value="health">Santé</option>
                    </select>
                </div>
            </div>

            {/* View switcher and navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* View switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setView('month')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            view === 'month' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        Mois
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            view === 'week' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        Semaine
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            view === 'day' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        Jour
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={previous}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-lg sm:text-xl font-bold text-text-primary capitalize min-w-[200px] sm:min-w-[280px] text-center">
                        {getDisplayTitle()}
                    </h2>
                    <Button variant="ghost" onClick={next}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" onClick={today}>
                        Aujourd'hui
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-text-muted">Total événements</p>
                    <p className="text-2xl font-bold text-text-primary">{allEvents.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-text-muted">Tâches</p>
                    <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-text-muted">Reproduction</p>
                    <p className="text-2xl font-bold text-pink-600">
                        {allEvents.filter(e => e.type === 'reproduction').length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-text-muted">Santé</p>
                    <p className="text-2xl font-bold text-green-600">
                        {allEvents.filter(e => e.type === 'health').length}
                    </p>
                </Card>
            </div>

            {/* Calendar Views */}
            <Card className="flex-1 p-4 overflow-auto">
                {view === 'month' && (
                    <>
                        {/* Week day headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center font-semibold text-text-muted text-sm py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-2">
                            {getDaysInMonth().map((day, index) => {
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                const isToday = day.toDateString() === new Date().toDateString();
                                const dayEvents = getEventsForDate(day);

                                return (
                                    <div
                                        key={index}
                                        className={clsx(
                                            'min-h-[100px] p-2 rounded-lg border transition-colors',
                                            isCurrentMonth ? 'bg-surface-card border-border-default' : 'bg-bg-muted border-border-subtle opacity-50',
                                            isToday && 'ring-2 ring-primary-500 border-primary-500'
                                        )}
                                    >
                                        <div className={clsx(
                                            'text-sm font-medium mb-1',
                                            isToday ? 'text-primary-600 font-bold' : 'text-text-primary'
                                        )}>
                                            {day.getDate()}
                                        </div>

                                        {/* Events for this day */}
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={clsx(
                                                        'text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-80',
                                                        event.color
                                                    )}
                                                    title={event.title}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-xs text-text-muted px-2">
                                                    +{dayEvents.length - 3} plus
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {view === 'week' && (
                    <>
                        {/* Week day headers */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {getDaysInWeek().map((day, index) => {
                                const isToday = day.toDateString() === new Date().toDateString();
                                return (
                                    <div key={index} className="text-center">
                                        <div className={clsx(
                                            "font-semibold text-sm",
                                            isToday ? 'text-primary-600' : 'text-text-muted'
                                        )}>
                                            {weekDays[index]}
                                        </div>
                                        <div className={clsx(
                                            "text-2xl font-bold mt-1",
                                            isToday ? 'text-primary-600' : 'text-text-primary'
                                        )}>
                                            {day.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Week grid */}
                        <div className="grid grid-cols-7 gap-4">
                            {getDaysInWeek().map((day, index) => {
                                const isToday = day.toDateString() === new Date().toDateString();
                                const dayEvents = getEventsForDate(day);

                                return (
                                    <div
                                        key={index}
                                        className={clsx(
                                            'min-h-[400px] p-3 rounded-lg border',
                                            isToday ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-500' : 'bg-surface-card border-border-default'
                                        )}
                                    >
                                        <div className="space-y-2">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={clsx(
                                                        'text-sm px-3 py-2 rounded text-white cursor-pointer hover:opacity-90',
                                                        event.color
                                                    )}
                                                    title={event.description || event.title}
                                                >
                                                    <div className="font-medium">{event.title}</div>
                                                    {event.description && (
                                                        <div className="text-xs mt-1 opacity-90 line-clamp-2">{event.description}</div>
                                                    )}
                                                </div>
                                            ))}
                                            {dayEvents.length === 0 && (
                                                <div className="text-sm text-text-muted text-center py-8">
                                                    Aucun événement
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {view === 'day' && (
                    <div className="space-y-4">
                        {/* All day events */}
                        <div>
                            <h3 className="text-sm font-semibold text-text-secondary mb-3">Toute la journée</h3>
                            <div className="space-y-2">
                                {getEventsForDate(currentDate).map(event => (
                                    <div
                                        key={event.id}
                                        className={clsx(
                                            'px-4 py-3 rounded-lg text-white cursor-pointer hover:opacity-90',
                                            event.color
                                        )}
                                    >
                                        <div className="font-semibold">{event.title}</div>
                                        {event.description && (
                                            <div className="text-sm mt-1 opacity-90">{event.description}</div>
                                        )}
                                    </div>
                                ))}
                                {getEventsForDate(currentDate).length === 0 && (
                                    <div className="text-center py-8 text-text-muted">
                                        Aucun événement pour cette journée
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
