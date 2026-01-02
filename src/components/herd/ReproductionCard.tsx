import React from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { HeatCyclePredictor } from '../reproduction/HeatCyclePredictor';
import type { Animal } from '../../types';

interface ReproductionCardProps {
    animal: Animal;
}

export const ReproductionCard: React.FC<ReproductionCardProps> = ({ animal }) => {
    // Only relevant for females
    if (animal.gender !== 'Female') return null;

    // 1. Determine Pregnancy Status
    // Look for last Mating event that is NOT followed by Birth or Abortion
    // This is a simplified logic, ideally verified by Ultrasound
    const sortedRepro = [...(animal.reproductionRecords || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastEvent = sortedRepro[0];
    const isPotentiallyPregnant = lastEvent?.type === 'Mating' || (lastEvent?.type === 'Ultrasound' && lastEvent?.ultrasoundResult === 'Positive');

    let gestationDays = 0;
    let progress = 0;
    const totalGestation = 152; // Average for sheep

    if (isPotentiallyPregnant && lastEvent) {
        const matingDate = new Date(lastEvent.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - matingDate.getTime());
        gestationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        progress = Math.min((gestationDays / totalGestation) * 100, 100);
    }

    // Find last calving date
    const lastBirth = sortedRepro.find(r => r.type === 'Birth');
    const intervalDays = lastBirth ? Math.ceil((new Date().getTime() - new Date(lastBirth.date).getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-amber-600">
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-bold text-slate-900">Reproduction</h3>
                </div>
            </div>

            {isPotentiallyPregnant ? (
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-sm">Gestante ?</span>
                        <span className="font-bold text-slate-900">{gestationDays} Jours</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Saillie: {new Date(lastEvent.date).toLocaleDateString('fr-FR')}</span>
                        <span>Terme: ~{new Date(new Date(lastEvent.date).getTime() + (152 * 24 * 60 * 60 * 1000)).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {lastEvent.type === 'Mating' && (
                        <div className="mt-2 text-xs text-orange-500 font-medium bg-orange-50 p-1.5 rounded text-center">
                            En attente confirmation écho.
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-6">
                    <HeatCyclePredictor animal={animal} compact />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Lactation</p>
                    <p className="font-bold text-slate-900">
                        {/* Determine lactation rank by count of births */}
                        Rang {sortedRepro.filter(r => r.type === 'Birth').length || '-'}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Intervalles Vêl.</p>
                    <p className="font-bold text-slate-900">{intervalDays ? `${intervalDays} j` : '-'}</p>
                </div>
            </div>
        </Card>
    );
};
