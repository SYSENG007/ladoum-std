import React from 'react';
import { History, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import type { Animal } from '../../types';

interface HistorySummaryCardProps {
    animal: Animal;
}

export const HistorySummaryCard: React.FC<HistorySummaryCardProps> = ({ animal }) => {
    // 1. Aggregate all events
    const allEvents = [
        ...(animal.healthRecords || []).map(r => ({
            id: `h-${r.id}`,
            date: new Date(r.date),
            title: r.type,
            subtitle: r.description,
            color: 'text-rose-500'
        })),
        ...(animal.measurements || []).map(m => ({
            id: `m-${m.date}`,
            date: new Date(m.date),
            title: 'Pesée / Mesure',
            subtitle: `${m.weight}kg • ${m.height_hg}cm`,
            color: 'text-blue-500'
        })),
        ...(animal.reproductionRecords || []).map(r => ({
            id: `r-${r.id}`,
            date: new Date(r.date),
            title: r.type === 'Mating' ? 'Saillie' : r.type === 'Birth' ? 'Mise bas' : r.type,
            subtitle: r.notes || (r.mateId ? `Avec ${r.mateId}` : ''),
            color: 'text-amber-500'
        }))
    ];

    // 2. Sort by date desc
    const sortedEvents = allEvents
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 4); // Keep top 4

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-amber-600">
                    <History className="w-5 h-5" />
                    <h3 className="font-bold text-slate-900">Historique Récent</h3>
                </div>
                <Link to="#" className="text-xs font-medium text-slate-400 hover:text-slate-600">
                    Tout voir
                </Link>
            </div>

            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-100" />

                {sortedEvents.length > 0 ? sortedEvents.map((event) => (
                    <div key={event.id} className="relative pl-6">
                        <Circle className={`w-3 h-3 ${event.color} fill-current absolute left-0 top-1.5 z-10 bg-white ring-4 ring-white`} />
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5 max-w-[180px] truncate">{event.subtitle}</p>
                            </div>
                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                {event.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                    </div>
                )) : (
                    <p className="pl-6 text-sm text-slate-400 italic">Aucun événement récent</p>
                )}
            </div>
        </Card>
    );
};
