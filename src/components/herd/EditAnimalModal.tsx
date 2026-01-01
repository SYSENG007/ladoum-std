import React, { useState } from 'react';
import { X, User, Hash, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { AnimalService } from '../../services/AnimalService';
import { useAnimals } from '../../hooks/useAnimals';
import type { Animal, Gender } from '../../types';

interface EditAnimalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: Animal;
}

export const EditAnimalModal: React.FC<EditAnimalModalProps> = ({ isOpen, onClose, onSuccess, animal }) => {
    const { animals } = useAnimals();

    // Get latest measurements if available
    const latestMeasurement = animal.measurements && animal.measurements.length > 0
        ? animal.measurements[animal.measurements.length - 1]
        : null;

    const [formData, setFormData] = useState({
        name: animal.name,
        tagId: animal.tagId,
        gender: animal.gender,
        birthDate: animal.birthDate,
        status: animal.status,
        weight: latestMeasurement?.weight?.toString() || '',
        height_hg: latestMeasurement?.height_hg?.toString() || '',
        length_lcs: latestMeasurement?.length_lcs?.toString() || '',
        chest_tp: latestMeasurement?.chest_tp?.toString() || '',
        photoUrl: animal.photoUrl || '',
        sireId: animal.sireId || '',
        damId: animal.damId || ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Prepare update data
            const updates: Partial<Animal> = {
                name: formData.name,
                tagId: formData.tagId,
                gender: formData.gender,
                birthDate: formData.birthDate,
                status: formData.status,
                photoUrl: formData.photoUrl || '/logo.png',
            };

            // Only set sireId/damId if they have values, otherwise don't include them
            if (formData.sireId) {
                updates.sireId = formData.sireId;
            }
            if (formData.damId) {
                updates.damId = formData.damId;
            }

            // Add new measurement if any values changed
            if (formData.weight || formData.height_hg || formData.length_lcs || formData.chest_tp) {
                const newMeasurement = {
                    date: new Date().toISOString().split('T')[0],
                    weight: formData.weight ? parseFloat(formData.weight) : 0,
                    height_hg: formData.height_hg ? parseFloat(formData.height_hg) : 0,
                    length_lcs: formData.length_lcs ? parseFloat(formData.length_lcs) : 0,
                    chest_tp: formData.chest_tp ? parseFloat(formData.chest_tp) : 0
                };
                updates.measurements = [...(animal.measurements || []), newMeasurement];
            }

            await AnimalService.update(animal.id, updates);
            onSuccess(); // Parent will handle closing and refreshing
        } catch (err) {
            console.error('Error updating animal:', err);
            setError('Erreur lors de la modification de l\'animal. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Modifier l'animal</h2>
                        <p className="text-sm text-text-muted">Mettez à jour les informations de {animal.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-overlay-hover rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-text-muted" />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-text-primary">Informations de base</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Nom <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Numéro d'identification <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.tagId}
                                        onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Sexe <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                >
                                    <option value="Male">Mâle</option>
                                    <option value="Female">Femelle</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Date de naissance <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Statut <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Sold' | 'Deceased' })}
                                className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                            >
                                <option value="Active">Actif</option>
                                <option value="Sold">Vendu</option>
                                <option value="Deceased">Décédé</option>
                            </select>
                        </div>
                    </div>

                    {/* Measurements */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-text-primary">Mensurations (optionnel)</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Poids (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Hauteur au garrot (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.height_hg}
                                    onChange={(e) => setFormData({ ...formData, height_hg: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Longueur corps (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.length_lcs}
                                    onChange={(e) => setFormData({ ...formData, length_lcs: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Tour de poitrine (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.chest_tp}
                                    onChange={(e) => setFormData({ ...formData, chest_tp: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pedigree Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-text-primary">Généalogie</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Père */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Père (Mâle)
                                </label>
                                <select
                                    value={formData.sireId}
                                    onChange={(e) => setFormData({ ...formData, sireId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                >
                                    <option value="">Aucun / Inconnu</option>
                                    {animals
                                        .filter(a => a.gender === 'Male' && a.status === 'Active' && a.id !== animal.id)
                                        .map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} ({a.tagId})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Mère */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Mère (Femelle)
                                </label>
                                <select
                                    value={formData.damId}
                                    onChange={(e) => setFormData({ ...formData, damId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                >
                                    <option value="">Aucune / Inconnue</option>
                                    {animals
                                        .filter(a => a.gender === 'Female' && a.status === 'Active' && a.id !== animal.id)
                                        .map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} ({a.tagId})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Photo */}
                    <ImageUpload
                        value={formData.photoUrl}
                        onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                        label="Photo de l'animal"
                        required={false}
                        farmId={animal.farmId}
                    />

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
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Modification en cours...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
