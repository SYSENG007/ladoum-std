import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, AlertTriangle, Heart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MOCK_INVENTORY } from '../../utils/constants';
import { getUpcomingHeats } from '../../utils/heatPrediction';
import type { Animal } from '../../types';

interface RemindersCardProps {
    animals: Animal[];
}

export const RemindersCard: React.FC<RemindersCardProps> = ({ animals }) => {
    const navigate = useNavigate();

    // Calculate health reminders from real animal data
    const healthReminders = useMemo(() => {
        return animals.flatMap(animal =>
            (animal.healthRecords || [])
                .filter(record => record.nextDueDate)
                .map(record => ({
                    id: record.id,
                    animalId: animal.id,
                    animalName: animal.name,
                    type: record.type,
                    date: record.nextDueDate,
                    description: record.description
                }))
        )
            .sort((a, b) => (a.date! > b.date! ? 1 : -1))
            .slice(0, 3); // Top 3 upcoming
    }, [animals]);

    // Heat cycle reminders - upcoming heats in next 5 days
    const heatReminders = useMemo(() => {
        return getUpcomingHeats(animals, 5).slice(0, 3);
    }, [animals]);

    // Inventory alerts
    const lowStockItems = useMemo(() =>
        MOCK_INVENTORY.filter(item => item.quantity <= item.minThreshold),
        []
    );

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
                    <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Rappels & Alertes</h2>
                        <p className="text-slate-500 text-sm">Santé, Reproduction et Stock</p>
                    </div>
                </div>
                {totalReminders > 0 && (
                    <Badge variant="warning">{totalReminders} Actif{totalReminders > 1 ? 's' : ''}</Badge>
                )}
            </div>

            <div className="space-y-6">
                {/* Heat Cycle Section */}
                {heatReminders.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
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
                                        className="w-full flex items-start gap-3 p-3 bg-pink-50 rounded-xl border border-pink-100 hover:border-pink-200 hover:bg-pink-100 transition-all text-left"
                                    >
                                        <Heart className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between gap-2">
                                                <p className="font-bold text-slate-900 text-sm truncate">
                                                    {animal.name}
                                                </p>
                                                <Badge variant={daysUntil <= 2 ? 'warning' : 'info'} className="text-xs">
                                                    {daysUntil === 0 ? "Aujourd'hui" :
                                                        daysUntil === 1 ? 'Demain' :
                                                            `Dans ${daysUntil}j`}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-pink-700 mt-1">
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
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Santé à venir</h3>
                    <div className="space-y-3">
                        {healthReminders.map((reminder) => (
                            <button
                                key={reminder.id}
                                onClick={() => handleHealthReminderClick(reminder.animalId)}
                                className="w-full flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-all text-left"
                            >
                                <Calendar className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between gap-2">
                                        <p className="font-bold text-slate-900 text-sm truncate">{reminder.type}</p>
                                        <span className="text-xs font-medium text-slate-500 flex-shrink-0">{reminder.date}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">
                                        <span className="font-semibold">{reminder.animalName}</span>: {reminder.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {healthReminders.length === 0 && (
                            <p className="text-sm text-slate-400 italic text-center py-4">Aucun rappel sanitaire.</p>
                        )}
                    </div>
                </div>

                {/* Inventory Section */}
                {lowStockItems.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alertes Stock</h3>
                        <div className="space-y-3">
                            {lowStockItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-red-900 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-red-700">
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
                    <div className="text-center py-8 text-slate-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucune alerte pour le moment</p>
                        <p className="text-xs mt-1">Tout est sous contrôle! 🎉</p>
                    </div>
                )}
            </div>
        </Card>
    );
};
