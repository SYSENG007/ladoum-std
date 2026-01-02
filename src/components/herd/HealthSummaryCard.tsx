import React from 'react';
import { Activity, AlertTriangle, Calendar, Stethoscope, ClipboardList } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { HealthRecord, Task } from '../../types';

interface HealthSummaryCardProps {
    records?: HealthRecord[];
    tasks?: Task[];
    onPlanTask: () => void;
    onAddEvent: () => void;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
    records = [],
    tasks = [],
    onPlanTask,
    onAddEvent
}) => {
    // Determine status based on recent records
    const isSick = records.some(r => r.type === 'Treatment' && new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const statusColor = isSick ? 'text-orange-500' : 'text-green-500';

    // Filter upcoming health tasks - limit to 2 for height consistency
    const upcomingTasks = tasks
        .filter(t => t.type === 'Health' && t.status !== 'Done')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2); // Reduced to 2 for better height control

    return (
        <Card className="h-full flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-rose-600">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-bold text-slate-900">Santé & Soins</h3>
                </div>
                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs px-2 py-1 h-auto"
                        icon={AlertTriangle}
                        onClick={onAddEvent}
                    >
                        Maladie
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs px-2 py-1 h-auto"
                        icon={Calendar}
                        onClick={onPlanTask}
                    >
                        Planifier
                    </Button>
                </div>
            </div>

            <div className="flex items-start gap-4 mb-6">
                <div className={`relative w-16 h-16 rounded-full border-4 border-current flex items-center justify-center ${statusColor} shrink-0`}>
                    <Stethoscope className="w-8 h-8" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-lg">
                        {isSick ? 'Sous Surveillance' : 'État Excellent'}
                    </p>
                    <p className="text-sm text-slate-500 leading-snug mt-1">
                        {isSick
                            ? 'Traitement en cours. Surveillance requise.'
                            : 'Aucun problème de santé signalé récemment.'}
                    </p>
                </div>
            </div>

            {/* Upcoming Tasks Section */}
            <div className="mt-auto space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-3 h-3" />
                    Soins à venir
                </h4>

                {upcomingTasks.length > 0 ? (
                    <div className="space-y-2">
                        {upcomingTasks.map(task => (
                            <div key={task.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 text-sm truncate">{task.title}</p>
                                    <p className="text-xs text-slate-500">
                                        Prévu le {new Date(task.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic py-2">Aucun soin planifié prochainement.</p>
                )}
            </div>
        </Card>
    );
};
