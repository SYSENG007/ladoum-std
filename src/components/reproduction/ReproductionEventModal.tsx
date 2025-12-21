import React, { useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { useData } from '../../context/DataContext';
import { AnimalService } from '../../services/AnimalService';
import { Button } from '../ui/Button';
import { X, Calendar, Heart, Baby, AlertTriangle, Milk, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Animal, ReproductionEventType, ReproductionRecord } from '../../types';

interface ReproductionEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedAnimal?: Animal;
    initialDate?: Date | null;
}

const EVENT_TYPES: Array<{
    type: ReproductionEventType;
    label: string;
    icon: React.ElementType;
    color: string;
    forGender?: 'Female' | 'Male';
}> = [
        { type: 'Heat', label: 'Chaleur', icon: Heart, color: 'pink', forGender: 'Female' },
        { type: 'Mating', label: 'Saillie', icon: Heart, color: 'red' },
        { type: 'Ultrasound', label: 'Échographie', icon: CheckCircle, color: 'blue', forGender: 'Female' },
        { type: 'Birth', label: 'Mise bas', icon: Baby, color: 'green', forGender: 'Female' },
        { type: 'Abortion', label: 'Avortement', icon: AlertTriangle, color: 'orange', forGender: 'Female' },
        { type: 'Weaning', label: 'Sevrage', icon: Milk, color: 'purple', forGender: 'Female' },
        { type: 'Lactation', label: 'Allaitement', icon: Milk, color: 'cyan', forGender: 'Female' },
    ];

export const ReproductionEventModal: React.FC<ReproductionEventModalProps> = ({
    isOpen,
    onClose,
    preselectedAnimal,
    initialDate
}) => {
    const { animals } = useAnimals();
    const { refreshData } = useData();

    const [selectedAnimalId, setSelectedAnimalId] = useState(preselectedAnimal?.id || '');
    const [eventType, setEventType] = useState<ReproductionEventType | ''>('');
    const [eventDate, setEventDate] = useState(
        initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    );
    const [mateId, setMateId] = useState('');
    const [notes, setNotes] = useState('');
    const [heatIntensity, setHeatIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [offspringCount, setOffspringCount] = useState(1);
    const [outcome, setOutcome] = useState('');
    const [saving, setSaving] = useState(false);

    const selectedAnimal = animals.find(a => a.id === selectedAnimalId);

    const females = animals.filter(a => a.gender === 'Female' && a.status === 'Active');
    const males = animals.filter(a => a.gender === 'Male' && a.status === 'Active');

    const availableEventTypes = EVENT_TYPES.filter(et =>
        !et.forGender || et.forGender === selectedAnimal?.gender
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAnimalId || !eventType) return;

        setSaving(true);

        try {
            const animal = animals.find(a => a.id === selectedAnimalId);
            if (!animal) throw new Error('Animal not found');

            const newRecord: ReproductionRecord = {
                id: `rep-${Date.now()}`,
                date: eventDate,
                type: eventType,
            };

            // Add optional notes only if provided
            if (notes && notes.trim()) {
                newRecord.notes = notes.trim();
            }

            // Add type-specific fields
            if (eventType === 'Heat') {
                newRecord.heatIntensity = heatIntensity;
            }

            if (eventType === 'Mating' && mateId) {
                newRecord.mateId = mateId;
            }

            if (eventType === 'Birth') {
                newRecord.offspringCount = offspringCount;
                if (outcome && outcome.trim()) {
                    newRecord.outcome = outcome.trim();
                }
                if (mateId) {
                    newRecord.mateId = mateId;
                }
            }

            if (eventType === 'Ultrasound' && mateId) {
                newRecord.mateId = mateId;
            }

            // Update animal with new record
            const existingRecords = animal.reproductionRecords || [];
            await AnimalService.update(selectedAnimalId, {
                reproductionRecords: [...existingRecords, newRecord]
            });

            // Also add record to mate if mating event
            if (eventType === 'Mating' && mateId) {
                const mate = animals.find(a => a.id === mateId);
                if (mate) {
                    const mateRecords = mate.reproductionRecords || [];
                    await AnimalService.update(mateId, {
                        reproductionRecords: [...mateRecords, {
                            ...newRecord,
                            mateId: selectedAnimalId
                        }]
                    });
                }
            }

            await refreshData();
            onClose();

            // Reset form
            setSelectedAnimalId('');
            setEventType('');
            setEventDate(new Date().toISOString().split('T')[0]);
            setMateId('');
            setNotes('');
            setHeatIntensity('Medium');
            setOffspringCount(1);
            setOutcome('');

        } catch (error) {
            console.error('Error saving reproduction event:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        Enregistrer un événement reproducteur
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Animal Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Animal concerné
                        </label>
                        <select
                            value={selectedAnimalId}
                            onChange={(e) => {
                                setSelectedAnimalId(e.target.value);
                                setEventType('');
                            }}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                            required
                        >
                            <option value="">Sélectionner un animal</option>
                            <optgroup label="Femelles">
                                {females.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.tagId})</option>
                                ))}
                            </optgroup>
                            <optgroup label="Mâles">
                                {males.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.tagId})</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Event Type Selection */}
                    {selectedAnimalId && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Type d'événement
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {availableEventTypes.map(({ type, label, icon: Icon, color }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setEventType(type)}
                                        className={clsx(
                                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                                            eventType === type
                                                ? `border-${color}-500 bg-${color}-50`
                                                : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <Icon className={`w-5 h-5 text-${color}-500`} />
                                        <span className="text-sm font-medium text-slate-700">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    {eventType && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Date de l'événement
                            </label>
                            <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                                required
                            />
                        </div>
                    )}

                    {/* Heat-specific: Intensity */}
                    {eventType === 'Heat' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Intensité des chaleurs
                            </label>
                            <div className="flex gap-2">
                                {(['Low', 'Medium', 'High'] as const).map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setHeatIntensity(level)}
                                        className={clsx(
                                            "flex-1 py-2 px-4 rounded-xl border-2 text-sm font-medium transition-colors",
                                            heatIntensity === level
                                                ? "border-pink-500 bg-pink-50 text-pink-700"
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        {level === 'Low' ? 'Faible' : level === 'Medium' ? 'Moyenne' : 'Forte'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mating/Ultrasound/Birth: Mate Selection */}
                    {(eventType === 'Mating' || eventType === 'Ultrasound' || eventType === 'Birth') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {eventType === 'Mating' ? 'Partenaire' : 'Père'}
                            </label>
                            <select
                                value={mateId}
                                onChange={(e) => setMateId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                            >
                                <option value="">
                                    {eventType === 'Mating' ? 'Sélectionner le partenaire' : 'Sélectionner le père (optionnel)'}
                                </option>
                                {(selectedAnimal?.gender === 'Female' ? males : females).map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.tagId})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Birth-specific: Offspring Count */}
                    {eventType === 'Birth' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nombre d'agneaux
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(count => (
                                    <button
                                        key={count}
                                        type="button"
                                        onClick={() => setOffspringCount(count)}
                                        className={clsx(
                                            "w-12 h-12 rounded-xl border-2 font-bold transition-colors",
                                            offspringCount === count
                                                ? "border-green-500 bg-green-50 text-green-700"
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Birth-specific: Outcome */}
                    {eventType === 'Birth' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Détail des naissances
                            </label>
                            <input
                                type="text"
                                value={outcome}
                                onChange={(e) => setOutcome(e.target.value)}
                                placeholder="Ex: 1 mâle, 1 femelle"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    {eventType && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Notes (optionnel)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Ajoutez des notes..."
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50 resize-none"
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedAnimalId || !eventType || saving}
                            className="flex-1"
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
