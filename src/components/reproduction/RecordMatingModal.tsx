import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { ReproductionService } from '../../services/ReproductionService';
import { TaskService } from '../../services/TaskService';
import { useAnimals } from '../../hooks/useAnimals';
import { useToast } from '../../context/ToastContext';
import type { Animal } from '../../types';

interface RecordMatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: Animal;
}

export const RecordMatingModal: React.FC<RecordMatingModal Props> = ({
    isOpen,
    onClose,
    onSuccess,
    animal
}) => {
    const toast = useToast();
    const { animals } = useAnimals();
    const [loading, setLoading] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [maleId, setMaleId] = useState('');
    const [matingType, setMatingType] = useState<'Natural' | 'AI'>('Natural');
    const [notes, setNotes] = useState('');

    // Filter active males
    const males = animals.filter(a => a.gender === 'Male' && a.status === 'Active');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!maleId) {
            toast.error('Veuillez sélectionner un mâle');
            return;
        }

        setLoading(true);

        try {
            // 1. Calculer la date attendue de mise bas (+150j pour Ladoum)
            const expectedDueDate = ReproductionService.calculateExpectedDueDate(date);

            // 2. Enregistrer l'événement Mating
            await ReproductionService.addEvent({
                farmId: animal.farmId,
                animalId: animal.id,
                type: 'Mating',
                date,
                maleId,
                matingType,
                expectedDueDate,
                notes: notes || undefined
            });

            // 3. Créer tâche échographie (+45j)
            const echoDate = new Date(date);
            echoDate.setDate(echoDate.getDate() + 45);

            await TaskService.add({
                farmId: animal.farmId,
                title: `Échographie - ${animal.name}`,
                description: `Confirmation gestation suite à saillie du ${new Date(date).toLocaleDateString()}`,
                date: echoDate.toISOString().split('T')[0],
                status: 'Todo',
                priority: 'High',
                type: 'Reproduction',
                animalId: animal.id,
            });

            toast.success(`Saillie enregistrée. Mise bas prévue le ${new Date(expectedDueDate).toLocaleDateString()}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Enregistrer Saillie</h2>
                            <p className="text-sm text-rose-100">{animal.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Date de saillie *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mâle reproducteur *
                        </label>
                        <select
                            value={maleId}
                            onChange={(e) => setMaleId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                            required
                        >
                            <option value="">Sélectionner un mâle</option>
                            {males.map(male => (
                                <option key={male.id} value={male.id}>
                                    {male.name} ({male.tagId})
                                </option>
                            ))}
                        </select>
                        {males.length === 0 && (
                            <p className="text-sm text-amber-600 mt-2">
                                ⚠️ Aucun mâle actif disponible dans le troupeau
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Type *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Natural', 'AI'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setMatingType(type)}
                                    className={`p-3 rounded-xl border-2 transition-all ${matingType === type
                                            ? 'border-rose-500 bg-rose-50 text-rose-700'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <span className="text-sm font-medium">
                                        {type === 'Natural' ? 'Naturelle' : 'Insémination'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Notes (optionnel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observations..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 resize-none"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-sm text-blue-800">
                            📅 <strong>Automatisations:</strong>
                        </p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-1 ml-4 list-disc">
                            <li>Échographie planifiée dans 45 jours</li>
                            <li>Mise bas prévue dans 150 jours</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !maleId}
                            className="flex-1 bg-rose-600 hover:bg-rose-700"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
