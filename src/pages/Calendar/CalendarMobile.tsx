import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useTasks } from '../../hooks/useTasks';
import { useAnimals } from '../../hooks/useAnimals';
import clsx from 'clsx';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'task' | 'reproduction' | 'health';
    color: string;
}

export const CalendarMobile: React.FC = () => {
    const { tasks } = useTasks();
    const { animals } = useAnimals();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Aggregate events
    const allEvents = useMemo<CalendarEvent[]>(() => {
        const events: CalendarEvent[] = [];

        tasks.forEach(task => {
            events.push({
                id: `task-${task.id}`,
                title: task.title,
                date: task.date,
                type: 'task',
                color: 'bg-blue-500'
            });
        });

        animals.forEach(animal => {
            animal.reproductionRecords?.forEach(record => {
                events.push({
                    id: `repro-${animal.id}-${record.id}`,
                    title: `${record.type}: ${animal.name}`,
                    date: record.date,
                    type: 'reproduction',
                    color: 'bg-pink-500'
                });
            });

            animal.healthRecords?.forEach(record => {
                events.push({
                    id: `health-${animal.id}-${record.id}`,
                    title: `${record.type}: ${animal.name}`,
                    date: record.date,
                    type: 'health',
                    color: 'bg-green-500'
                });
            });
        });

        return events;
    }, [tasks, animals]);

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: Date[] = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(new Date(year, month, -startDayOfWeek + i + 1));
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const days = getDaysInMonth();

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return allEvents.filter(e => e.date === dateStr);
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-primary-600" />
                    Calendrier
                </h1>
            </div>

            {/* Navigation */}
            <Card className="p-3">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={previousMonth} className="p-2 hover:bg-overlay-hover rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-text-primary capitalize">
                        {monthName}
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-overlay-hover rounded-lg">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Week headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-text-muted">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayEvents = getEventsForDate(day);
                        const hasEvents = dayEvents.length > 0;

                        return (
                            <div
                                key={index}
                                className={clsx(
                                    'aspect-square p-1 rounded-lg text-center text-sm flex flex-col items-center justify-center',
                                    isCurrentMonth ? 'text-text-primary' : 'text-text-disabled opacity-40',
                                    isToday && 'bg-primary-100 text-primary-700 font-bold ring-2 ring-primary-500'
                                )}
                            >
                                <span>{day.getDate()}</span>
                                {hasEvents && isCurrentMonth && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                className={clsx('w-1 h-1 rounded-full', event.color)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Event summary */}
            <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 text-center">
                    <p className="text-xs text-text-muted">Tâches</p>
                    <p className="text-lg font-bold text-blue-600">{tasks.length}</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-xs text-text-muted">Repro</p>
                    <p className="text-lg font-bold text-pink-600">
                        {allEvents.filter(e => e.type === 'reproduction').length}
                    </p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-xs text-text-muted">Santé</p>
                    <p className="text-lg font-bold text-green-600">
                        {allEvents.filter(e => e.type === 'health').length}
                    </p>
                </Card>
            </div>
        </div>
    );
};
