import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { Task } from '../../types';
import clsx from 'clsx';

interface TaskCalendarProps {
    tasks: Task[];
}

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year';

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('Month');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get start day of week (0-6)
    const getStartDay = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start
    };

    // Format date to YYYY-MM-DD
    const formatDateStr = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Get week start (Monday)
    const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'Month') newDate.setMonth(newDate.getMonth() - 1);
        else if (viewMode === 'Week') newDate.setDate(newDate.getDate() - 7);
        else if (viewMode === 'Day') newDate.setDate(newDate.getDate() - 1);
        else if (viewMode === 'Year') newDate.setFullYear(newDate.getFullYear() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'Month') newDate.setMonth(newDate.getMonth() + 1);
        else if (viewMode === 'Week') newDate.setDate(newDate.getDate() + 7);
        else if (viewMode === 'Day') newDate.setDate(newDate.getDate() + 1);
        else if (viewMode === 'Year') newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDate(newDate);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-secondary-100 text-primary-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Day View - Show tasks for single day with timeline
    const renderDayView = () => {
        const dateStr = formatDateStr(currentDate);
        const dayTasks = tasks.filter(t => t.date === dateStr);

        return (
            <div className="space-y-4">
                <div className="text-center py-4 bg-gradient-to-r from-slate-100 to-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900">
                        {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>

                {dayTasks.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Aucune tâche pour ce jour
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dayTasks.map(task => (
                            <div key={task.id} className={clsx(
                                "p-4 rounded-xl border-l-4 bg-white shadow-sm",
                                task.priority === 'High' ? 'border-l-red-500' :
                                    task.priority === 'Medium' ? 'border-l-amber-500' : 'border-l-blue-500'
                            )}>
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-slate-900">{task.title}</h4>
                                    <span className={clsx("text-xs px-2 py-1 rounded-full", getPriorityColor(task.priority))}>
                                        {task.priority === 'High' ? 'Haute' : task.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                                    <span>{task.type}</span>
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded",
                                        task.status === 'Done' ? 'bg-green-100 text-green-700' :
                                            task.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                    )}>
                                        {task.status === 'Done' ? 'Terminé' : task.status === 'In Progress' ? 'En cours' : 'À faire'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Week View - 7-day grid
    const renderWeekView = () => {
        const weekStart = getWeekStart(currentDate);
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });

        return (
            <div className="grid grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="text-center text-sm font-bold text-slate-500 py-2">{d}</div>
                ))}
                {days.map(day => {
                    const dateStr = formatDateStr(day);
                    const dayTasks = tasks.filter(t => t.date === dateStr);
                    const isToday = dateStr === formatDateStr(new Date());

                    return (
                        <div key={dateStr} className={clsx(
                            "min-h-[180px] bg-white border rounded-lg p-2 overflow-y-auto",
                            isToday ? "border-primary-500 ring-2 ring-primary-100" : "border-slate-100"
                        )}>
                            <div className={clsx(
                                "text-right text-sm font-medium mb-2",
                                isToday ? "text-primary-600" : "text-slate-400"
                            )}>
                                {day.getDate()}
                            </div>
                            <div className="space-y-1">
                                {dayTasks.slice(0, 4).map(task => (
                                    <div key={task.id} className={clsx(
                                        "text-xs px-2 py-1 rounded truncate",
                                        task.priority === 'High' ? "bg-red-100 text-red-700" :
                                            task.priority === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-secondary-100 text-primary-700"
                                    )}>
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > 4 && (
                                    <div className="text-xs text-slate-400 text-center">
                                        +{dayTasks.length - 4} autres
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Month View
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = getStartDay(year, month);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: startDay }, (_, i) => i);

        return (
            <div className="grid grid-cols-7 gap-1">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="text-center text-sm font-bold text-slate-500 py-2">{d}</div>
                ))}
                {blanks.map(b => <div key={`blank-${b}`} className="h-24 bg-slate-50/50 rounded-lg" />)}
                {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayTasks = tasks.filter(t => t.date === dateStr);

                    return (
                        <div key={day} className="h-24 bg-white border border-slate-100 rounded-lg p-1 hover:border-primary-300 transition-colors overflow-y-auto">
                            <div className="text-right text-xs font-medium text-slate-400 mb-1">{day}</div>
                            <div className="space-y-1">
                                {dayTasks.map(task => (
                                    <div key={task.id} className={clsx(
                                        "text-[10px] px-1 py-0.5 rounded truncate",
                                        task.priority === 'High' ? "bg-red-100 text-red-700" : "bg-secondary-100 text-primary-700"
                                    )}>
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Year View - 12 month overview
    const renderYearView = () => {
        const year = currentDate.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => i);

        return (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {months.map(month => {
                    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}`;
                    const monthTasks = tasks.filter(t => t.date.startsWith(monthStart));
                    const highPriority = monthTasks.filter(t => t.priority === 'High').length;
                    const pending = monthTasks.filter(t => t.status !== 'Done').length;

                    return (
                        <div
                            key={month}
                            onClick={() => {
                                setCurrentDate(new Date(year, month, 1));
                                setViewMode('Month');
                            }}
                            className="p-4 bg-white border border-slate-100 rounded-xl hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="font-bold text-slate-900 capitalize mb-2">
                                {new Date(year, month).toLocaleDateString('fr-FR', { month: 'long' })}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-primary-600">{monthTasks.length}</span>
                                <span className="text-xs text-slate-500">tâches</span>
                            </div>
                            {monthTasks.length > 0 && (
                                <div className="mt-2 flex gap-2 text-xs">
                                    {highPriority > 0 && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                            {highPriority} urgentes
                                        </span>
                                    )}
                                    {pending > 0 && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                            {pending} en attente
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const getTitle = () => {
        if (viewMode === 'Day') {
            return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } else if (viewMode === 'Week') {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        } else if (viewMode === 'Year') {
            return currentDate.getFullYear().toString();
        }
        return currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 capitalize">
                        {getTitle()}
                    </h2>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={handlePrev} />
                        <Button variant="ghost" size="sm" icon={ChevronRight} onClick={handleNext} />
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['Day', 'Week', 'Month', 'Year'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={clsx(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {mode === 'Day' ? 'Jour' : mode === 'Week' ? 'Semaine' : mode === 'Month' ? 'Mois' : 'Année'}
                        </button>
                    ))}
                </div>
            </div>

            {viewMode === 'Day' && renderDayView()}
            {viewMode === 'Week' && renderWeekView()}
            {viewMode === 'Month' && renderMonthView()}
            {viewMode === 'Year' && renderYearView()}
        </Card>
    );
};
