import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, AlertTriangle, Heart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useInventory } from '../../hooks/useInventory';
import { useTasks } from '../../hooks/useTasks';
import { getUpcomingHeats } from '../../utils/heatPrediction';
import type { Animal } from '../../types';

interface RemindersCardProps {
    animals: Animal[];
}

interface HealthReminder {
    id: string;
    animalId?: string;
    animalName?: string;
    type: string;
    date: string;
    description: string;
    source: 'healthRecord' | 'task';
}

export const RemindersCard: React.FC<RemindersCardProps> = ({ animals }) => {
    const navigate = useNavigate();
    const { lowStockItems } = useInventory();
    const { tasks } = useTasks();

    // Calculate health reminders from MULTIPLE sources
    const healthReminders = useMemo(() => {
        const reminders: HealthReminder[] = [];

        // 1. Health records with nextDueDate (vaccinations, treatments scheduled)
        animals.forEach(animal => {
            (animal.healthRecords || [])
                .filter(record => record.nextDueDate)
                .forEach(record => {
                    reminders.push({
                        id: record.id,
                        animalId: animal.id,
                        animalName: animal.name,
                        type: record.type,
                        date: record.nextDueDate!,
                        description: record.description,
                        source: 'healthRecord'
                    });
                });
        });

        // 2. Health tasks not done
        tasks
            .filter(task => task.type === 'Health' && task.status !== 'Done')
            .forEach(task => {
                const animal = task.animalId ? animals.find(a => a.id === task.animalId) : undefined;
                reminders.push({
                    id: task.id,
                    animalId: task.animalId,
                    animalName: animal?.name,
                    type: 'Tâche santé',
                    date: task.date,
                    description: task.title,
                    source: 'task'
                });
            });

        // Sort by date and return top items
        return reminders
            .sort((a, b) => (a.date > b.date ? 1 : -1))
            .slice(0, 5);
    }, [animals, tasks]);

    // Heat cycle reminders - upcoming heats in next 5 days
    const heatReminders = useMemo(() => {
        return getUpcomingHeats(animals, 5).slice(0, 3);
    }, [animals]);

    const totalReminders = healthReminders.length + lowStockItems.length + heatReminders.length;

    const handleHealthReminderClick = (animalId: string) => {
        navigate(`/herd/${animalId}`);
    };

    const handleHeatReminderClick = () => {
        navigate('/reproduction');
    };

    const handleStockClick = () => {
        navigate('/inventory');
    };

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rappels & Alertes</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Santé, Reproduction et Stock</p>
                    </div>
                </div>
                <Badge variant={totalReminders > 0 ? "warning" : "neutral"}>
                    {totalReminders} Actif{totalReminders !== 1 ? 's' : ''}
                </Badge>
            </div>

            <div className="space-y-6">
                {/* Heat Cycle Section */}
                {heatReminders.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                            Chaleurs à surveiller
                        </h3>
                        <div className="space-y-3">
                            {heatReminders.map(({ animal, prediction }) => {
                                const daysUntil = Math.ceil(
                                    (new Date(prediction.nextHeatDate).getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                );

                                return (
                                    <button
                                        key={animal.id}
                                        onClick={handleHeatReminderClick}
                                        className="w-full flex items-start gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800 hover:border-pink-200 dark:hover:border-pink-700 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all text-left"
                                    >
                                        <Heart className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between gap-2">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                    {animal.name}
                                                </p>
                                                <Badge variant={daysUntil <= 2 ? 'warning' : 'info'} className="text-xs">
                                                    {daysUntil === 0 ? "Aujourd'hui" :
                                                        daysUntil === 1 ? 'Demain' :
                                                            `Dans ${daysUntil}j`}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
                                                Fenêtre: {new Date(prediction.windowStart).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short'
                                                })} - {new Date(prediction.windowEnd).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Health Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Santé à venir</h3>
                    <div className="space-y-3">
                        {healthReminders.map((reminder) => (
                            <button
                                key={reminder.id}
                                onClick={() => reminder.animalId ? handleHealthReminderClick(reminder.animalId) : navigate('/tasks')}
                                className="w-full flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
                            >
                                <Calendar className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between gap-2">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{reminder.type}</p>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">{reminder.date}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        <span className="font-semibold">{reminder.animalName}</span>: {reminder.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {healthReminders.length === 0 && (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">Aucun rappel sanitaire.</p>
                        )}
                    </div>
                </div>

                {/* Inventory Section - Now using REAL data */}
                {lowStockItems.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Alertes Stock</h3>
                        <div className="space-y-3">
                            {lowStockItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-red-900 dark:text-red-300 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-red-700 dark:text-red-400">
                                            Stock critique: {item.quantity} {item.unit} (Min: {item.minThreshold})
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-8 flex-shrink-0"
                                        onClick={handleStockClick}
                                    >
                                        Voir
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No reminders state */}
                {totalReminders === 0 && (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucune alerte pour le moment</p>
                        <p className="text-xs mt-1">Tout est sous contrôle! 🎉</p>
                    </div>
                )}
            </div>
        </Card>
    );
};
