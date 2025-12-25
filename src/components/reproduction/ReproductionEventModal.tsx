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
    const [ultrasoundResult, setUltrasoundResult] = useState<'Positive' | 'Negative'>('Positive');
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

            // === VALIDATION LOGIC ===
            const eventDateObj = new Date(eventDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            eventDateObj.setHours(0, 0, 0, 0);

            // 1. No future events
            if (eventDateObj > today) {
                alert('❌ Impossible d\'enregistrer un événement dans le futur.');
                setSaving(false);
                return;
            }

            // 2. Event must be after animal's birth
            const birthDate = new Date(animal.birthDate);
            birthDate.setHours(0, 0, 0, 0);
            if (eventDateObj < birthDate) {
                alert(`❌ L'événement ne peut pas se produire avant la naissance de ${animal.name} (${new Date(animal.birthDate).toLocaleDateString('fr-FR')}).`);
                setSaving(false);
                return;
            }

            // 3. Cannot register events on deceased animals
            if (animal.status === 'Deceased') {
                alert(`❌ Impossible d'enregistrer un événement pour ${animal.name} qui est décédé(e).`);
                setSaving(false);
                return;
            }

            // 4. Cannot register events on sold animals (except past events)
            if (animal.status === 'Sold') {
                alert(`❌ Impossible d'enregistrer un événement pour ${animal.name} qui a été vendu(e).`);
                setSaving(false);
                return;
            }

            // 5. Mating-specific validations
            if (eventType === 'Mating' && mateId) {
                const mate = animals.find(a => a.id === mateId);
                if (!mate) {
                    alert('❌ Partenaire non trouvé.');
                    setSaving(false);
                    return;
                }

                // Cannot mate with deceased animal
                if (mate.status === 'Deceased') {
                    alert(`❌ Impossible d'enregistrer une saillie avec ${mate.name} qui est décédé(e).`);
                    setSaving(false);
                    return;
                }

                // Cannot mate with sold animal
                if (mate.status === 'Sold') {
                    alert(`❌ Impossible d'enregistrer une saillie avec ${mate.name} qui a été vendu(e).`);
                    setSaving(false);
                    return;
                }

                // Check if mate was alive at event date (if we track death dates in future)
                // For now, deceased animals are excluded from selection
            }

            // 6. Birth-specific validations
            if (eventType === 'Birth') {
                const existingRecords = animal.reproductionRecords || [];

                // Find most recent mating before this birth
                const previousMatings = existingRecords
                    .filter(r => r.type === 'Mating' && new Date(r.date) < eventDateObj)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (previousMatings.length > 0) {
                    const lastMating = previousMatings[0];
                    const matingDate = new Date(lastMating.date);
                    const daysSinceMating = Math.floor((eventDateObj.getTime() - matingDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Gestation too short (< 140 days)
                    if (daysSinceMating < 140) {
                        alert(`❌ Gestation trop courte: ${daysSinceMating} jours depuis la dernière saillie. Minimum: 140 jours.`);
                        setSaving(false);
                        return;
                    }

                    // Gestation too long (> 160 days)
                    if (daysSinceMating > 160) {
                        const proceed = confirm(`⚠️ Gestation très longue: ${daysSinceMating} jours depuis la dernière saillie (normal: 140-150 jours). Continuer quand même?`);
                        if (!proceed) {
                            setSaving(false);
                            return;
                        }
                    }
                }
            }

            // 7. Ultrasound-specific validations
            if (eventType === 'Ultrasound') {
                const existingRecords = animal.reproductionRecords || [];

                // Find most recent mating before this ultrasound
                const previousMatings = existingRecords
                    .filter(r => r.type === 'Mating' && new Date(r.date) < eventDateObj)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (previousMatings.length > 0) {
                    const lastMating = previousMatings[0];
                    const matingDate = new Date(lastMating.date);
                    const daysSinceMating = Math.floor((eventDateObj.getTime() - matingDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Ultrasound too early (< 20 days)
                    if (daysSinceMating < 20) {
                        alert(`❌ Échographie trop tôt: ${daysSinceMating} jours après la saillie. Attendez au moins 20 jours pour un résultat fiable.`);
                        setSaving(false);
                        return;
                    }
                }
            }

            // 8. Weaning-specific validations
            if (eventType === 'Weaning') {
                const existingRecords = animal.reproductionRecords || [];

                // Must have a birth before weaning
                const previousBirths = existingRecords
                    .filter(r => r.type === 'Birth' && new Date(r.date) < eventDateObj)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (previousBirths.length === 0) {
                    alert('❌ Impossible d\'enregistrer un sevrage sans naissance préalable.');
                    setSaving(false);
                    return;
                }

                const lastBirth = previousBirths[0];
                const birthDate = new Date(lastBirth.date);
                const daysSinceBirth = Math.floor((eventDateObj.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

                // Weaning too early (< 30 days)
                if (daysSinceBirth < 30) {
                    alert(`❌ Sevrage trop tôt: ${daysSinceBirth} jours après la naissance. Minimum recommandé: 30 jours.`);
                    setSaving(false);
                    return;
                }
            }

            // === END VALIDATION ===

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

            if (eventType === 'Ultrasound') {
                newRecord.ultrasoundResult = ultrasoundResult;
                if (mateId) {
                    newRecord.mateId = mateId;
                }
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
            setUltrasoundResult('Positive');

        } catch (error) {
            console.error('Error saving reproduction event:', error);
            alert('❌ Erreur lors de l\'enregistrement. Veuillez réessayer.');
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
                                max={new Date().toISOString().split('T')[0]}
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

                    {/* Ultrasound-specific: Result */}
                    {eventType === 'Ultrasound' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Résultat de l'échographie
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setUltrasoundResult('Positive')}
                                    className={clsx(
                                        "flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-colors flex items-center justify-center gap-2",
                                        ultrasoundResult === 'Positive'
                                            ? "border-green-500 bg-green-50 text-green-700"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                                    )}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Positive (Gestante)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUltrasoundResult('Negative')}
                                    className={clsx(
                                        "flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-colors flex items-center justify-center gap-2",
                                        ultrasoundResult === 'Negative'
                                            ? "border-red-500 bg-red-50 text-red-700"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                                    )}
                                >
                                    <X className="w-5 h-5" />
                                    Négative (Non Gestante)
                                </button>
                            </div>
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
