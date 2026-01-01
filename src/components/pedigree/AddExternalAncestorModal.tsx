import React, { useState } from 'react';
import { X, User, Hash, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnimalService } from '../../services/AnimalService';
import { useFarm } from '../../context/FarmContext';
import type { Animal, Gender } from '../../types';

interface AddExternalAncestorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (ancestorId: string) => void;
    role: 'sire' | 'dam'; // Détermine automatiquement le sexe
    childAnimal: Animal; // Enfant pour lequel on crée l'ancêtre
}

export const AddExternalAncestorModal: React.FC<AddExternalAncestorModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    role,
    childAnimal
}) => {
    const { currentFarm } = useFarm();
    const gender: Gender = role === 'sire' ? 'Male' : 'Female';

    const [formData, setFormData] = useState({
        name: '',
        tagId: '',
        birthDate: '',
        breed: 'Ladoum'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Créer l'ancêtre externe
            const ancestorData: Omit<Animal, 'id'> = {
                name: formData.name,
                tagId: formData.tagId || `EXT-${Date.now()}`, // Auto-générer si vide
                gender: gender,
                birthDate: formData.birthDate || '2000-01-01', // Date approximative par défaut
                breed: formData.breed,
                status: 'Active',
                weight: 0,
                height: 0,
                length: 0,
                chestGirth: 0,
                photoUrl: '/logo.png',
                measurements: [],
                farmId: currentFarm?.id || ''
            };

            const result = await AnimalService.add(ancestorData);

            // Lier automatiquement l'ancêtre à l'enfant
            await AnimalService.update(childAnimal.id, {
                [role === 'sire' ? 'sireId' : 'damId']: result.id
            });

            onSuccess(result.id);

            // Reset form
            setFormData({
                name: '',
                tagId: '',
                birthDate: '',
                breed: 'Ladoum'
            });
        } catch (err: any) {
            console.error('Error adding external ancestor:', err);
            setError(`Erreur: ${err?.message || 'Erreur inconnue'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const roleLabel = role === 'sire' ? 'Père' : 'Mère';
    const genderLabel = gender === 'Male' ? 'Mâle' : 'Femelle';

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-modal rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-surface-modal border-b border-border-subtle p-6 flex items-center justify-between rounded-t-3xl flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">
                            Ajouter un {roleLabel} externe
                        </h2>
                        <p className="text-sm text-text-muted">
                            Pour {childAnimal.name} ({childAnimal.tagId})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-overlay-hover rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-text-muted" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            ℹ️ Cet animal ne fait pas partie de votre bergerie (parent externe, acheté ailleurs, etc.)
                        </p>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4">
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
                                    placeholder="Ex: Sultan"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Numéro d'identification (optionnel)
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                <input
                                    type="text"
                                    value={formData.tagId}
                                    onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                    placeholder="Laissez vide pour auto-génération"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Sexe
                            </label>
                            <input
                                type="text"
                                value={genderLabel}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border-default text-text-primary font-medium cursor-not-allowed"
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Automatiquement défini selon le rôle ({roleLabel})
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Date de naissance (approximative)
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                                />
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                                Optionnel - utilisé pour estimer l'âge
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Race
                            </label>
                            <select
                                value={formData.breed}
                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                            >
                                <option value="Ladoum">Ladoum</option>
                                <option value="Bali-Bali">Bali-Bali</option>
                                <option value="Touabire">Touabire</option>
                                <option value="Peul-Peul">Peul-Peul</option>
                                <option value="Mixed">Mixte</option>
                                <option value="Inconnue">Inconnue</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                            {loading ? 'Création...' : 'Créer et lier'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
