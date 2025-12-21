import React, { useState } from 'react';
import { Activity, Syringe, Pill, Stethoscope, Plus, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddHealthEventModal } from './AddHealthEventModal';
import type { Animal, HealthRecord } from '../../types';

interface HealthTabProps {
    records?: HealthRecord[];
    animal?: Animal;
    onUpdate?: () => void;
}

export const HealthTab: React.FC<HealthTabProps> = ({ records = [], animal, onUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const getIcon = (type: HealthRecord['type']) => {
        switch (type) {
            case 'Vaccination': return Syringe;
            case 'Treatment': return Pill;
            case 'Vitamin': return Pill;
            case 'Checkup': return Stethoscope;
            default: return Activity;
        }
    };

    const getColor = (type: HealthRecord['type']) => {
        switch (type) {
            case 'Vaccination': return 'text-blue-600 bg-blue-50';
            case 'Treatment': return 'text-red-600 bg-red-50';
            case 'Vitamin': return 'text-green-600 bg-green-50';
            case 'Checkup': return 'text-purple-600 bg-purple-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        onUpdate?.();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Historique Médical</h3>
                {animal && (
                    <Button
                        icon={Plus}
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Ajouter un événement
                    </Button>
                )}
            </div>

            {records.length === 0 ? (
                <Card className="p-8 text-center text-slate-500 border-dashed">
                    Aucun historique médical enregistré.
                </Card>
            ) : (
                <div className="space-y-4">
                    {records.map((record) => {
                        const Icon = getIcon(record.type);
                        return (
                            <Card key={record.id} className="flex gap-4 p-4" noPadding>
                                <div className={`p-3 rounded-xl h-fit ${getColor(record.type)}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{record.type}</h4>
                                            <p className="text-slate-600 text-sm">{record.description}</p>
                                        </div>
                                        <span className="text-sm text-slate-400 font-medium">{record.date}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mt-3 text-sm">
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Stethoscope className="w-4 h-4" />
                                            <span>{record.performer}</span>
                                        </div>
                                        {record.dose && (
                                            <Badge variant="neutral" className="text-xs">
                                                Dose: {record.dose}
                                            </Badge>
                                        )}
                                        {record.nextDueDate && (
                                            <div className="flex items-center gap-1 text-amber-600 font-medium ml-auto">
                                                <Calendar className="w-4 h-4" />
                                                <span>Rappel: {record.nextDueDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add Health Event Modal */}
            {animal && (
                <AddHealthEventModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={handleAddSuccess}
                    animal={animal}
                />
            )}
        </div>
    );
};
