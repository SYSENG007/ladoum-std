import React, { useState } from 'react';
<parameter name="X, Flame } from 'lucide-react';
import { Button } from '../ui/Button';
import { ReproductionService } from '../../services/ReproductionService';
import { useToast } from '../../context/ToastContext';
import type { Animal } from '../../types';

interface RecordHeatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: Animal;
}

export const RecordHeatModal: React.FC<RecordHeatModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    animal
}) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [duration, setDuration] = useState('24');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await ReproductionService.addEvent({
                farmId: animal.farmId,
                animalId: animal.id,
                type: 'Heat',
                date,
                intensity,
                duration: parseInt(duration),
                notes: notes || undefined
            });

            toast.success('Chaleur enregistrée');
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
            className="fixed inset-0 bg-black /50 backdrop - blur - sm z - 50 flex items - center justify - center p - 4"
onClick = {(e) => e.target === e.currentTarget && onClose()}
        >
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Enregistrer Chaleur</h2>
                    <p className="text-sm text-orange-100">{animal.name}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5 text-white" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date observée *
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Intensité *
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {(['Low', 'Medium', 'High'] as const).map(level => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => setIntensity(level)}
                            className={`p-3 rounded-xl border-2 transition-all ${intensity === level
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <span className="text-sm font-medium">
                                {level === 'Low' ? 'Faible' : level === 'Medium' ? 'Moyenne' : 'Forte'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Durée estimée (heures)
                </label>
                <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (optionnel)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observations complémentaires..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 resize-none"
                />
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
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>
        </form>
    </div>
        </div >
    );
};
