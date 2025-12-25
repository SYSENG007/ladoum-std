import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnimalService } from '../../services/AnimalService';
import type { Animal, Measurement } from '../../types';

interface AddMeasurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: Animal;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    animal
}) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        height_hg: '',
        length_lcs: '',
        chest_tp: '',
        weight: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate that at least one measurement is provided
            if (!formData.height_hg && !formData.length_lcs && !formData.chest_tp && !formData.weight) {
                setError('Veuillez saisir au moins une mesure');
                setLoading(false);
                return;
            }

            // Build the measurement object (no 'notes' field in Measurement type)
            const newMeasurement: Measurement = {
                date: formData.date,
                height_hg: formData.height_hg ? parseFloat(formData.height_hg) : 0,
                length_lcs: formData.length_lcs ? parseFloat(formData.length_lcs) : 0,
                chest_tp: formData.chest_tp ? parseFloat(formData.chest_tp) : 0,
                weight: formData.weight ? parseFloat(formData.weight) : 0
            };

            // Get existing measurements or initialize empty array
            const existingMeasurements = animal.measurements || [];

            // Add new measurement
            const updatedMeasurements = [...existingMeasurements, newMeasurement];

            // Prepare update data - avoid undefined to prevent Firestore errors
            const updateData: Record<string, any> = {
                measurements: updatedMeasurements
            };

            // Only update direct properties if they have valid non-zero values
            if (newMeasurement.height_hg > 0) updateData.height = newMeasurement.height_hg;
            if (newMeasurement.length_lcs > 0) updateData.length = newMeasurement.length_lcs;
            if (newMeasurement.chest_tp > 0) updateData.chestGirth = newMeasurement.chest_tp;
            if (newMeasurement.weight > 0) updateData.weight = newMeasurement.weight;

            // Update animal
            await AnimalService.update(animal.id, updateData);

            onSuccess();
            onClose();

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                height_hg: '',
                length_lcs: '',
                chest_tp: '',
                weight: '',
                notes: ''
            });
        } catch (err) {
            console.error('Error adding measurement:', err);
            setError('Erreur lors de l\'ajout de la mesure. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 p-6 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Ajouter une mesure</h2>
                        <p className="text-sm text-primary-100">{animal.name} • {animal.tagId}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Date de mesure <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Morphometric Measurements */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Ruler className="w-5 h-5 text-primary-600" />
                            Mesures Morphométriques
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* HG - Hauteur au Garrot */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    HG - Hauteur (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="200"
                                    value={formData.height_hg}
                                    onChange={(e) => setFormData({ ...formData, height_hg: e.target.value })}
                                    placeholder="Ex: 98.5"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">Hauteur au garrot</p>
                            </div>

                            {/* LCS - Longueur Corps */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    LCS - Longueur (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="200"
                                    value={formData.length_lcs}
                                    onChange={(e) => setFormData({ ...formData, length_lcs: e.target.value })}
                                    placeholder="Ex: 108.0"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">Longueur scapulo-ischiale</p>
                            </div>

                            {/* TP - Tour de Poitrine */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    TP - Poitrine (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="200"
                                    value={formData.chest_tp}
                                    onChange={(e) => setFormData({ ...formData, chest_tp: e.target.value })}
                                    placeholder="Ex: 102.5"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">Tour de poitrine</p>
                            </div>
                        </div>
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Masse (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="200"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="Ex: 45.5"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Notes (optionnel)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            placeholder="Ex: Mesure prise après tonte..."
                        />
                    </div>

                    {/* Helper Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Astuce:</strong> Ces mesures sont utilisées pour les prédictions de reproduction et l'analyse génétique. Mesurez régulièrement pour suivre la croissance.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
