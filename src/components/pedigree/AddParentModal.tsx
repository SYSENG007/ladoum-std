import React, { useState } from 'react';
import { X, User, Hash, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { AnimalService } from '../../services/AnimalService';
import type { Animal } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useFarm } from '../../context/FarmContext';

interface AddParentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    childAnimal: Animal;
    role: 'sire' | 'dam';
}

export const AddParentModal: React.FC<AddParentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    childAnimal,
    role
}) => {
    const toast = useToast();
    const { currentFarm } = useFarm();

    const gender = role === 'sire' ? 'Male' : 'Female';
    const parentLabel = role === 'sire' ? 'Père' : 'Mère';

    const [formData, setFormData] = useState({
        name: '',
        tagId: `EXT-${Date.now()}`, // Auto-generated tag for external
        birthDate: '',
        photoUrl: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!currentFarm) {
                throw new Error('Ferme non sélectionnée');
            }

            // Create the parent animal with External status
            const newParent: Omit<Animal, 'id'> = {
                farmId: currentFarm.id,
                name: formData.name,
                tagId: formData.tagId,
                photoUrl: formData.photoUrl || '/logo.png',
                gender,
                birthDate: formData.birthDate,
                breed: childAnimal.breed, // Inherit breed from child
                status: 'External', // Always External
                weight: 0,
                height: 0,
                length: 0,
                chestGirth: 0,
            };

            const parentRef = await AnimalService.add(newParent);
            const parentId = parentRef.id; // Extract ID from DocumentReference

            // Update child animal to link to new parent
            const updateData: Partial<Animal> = {};
            if (role === 'sire') {
                updateData.sireId = parentId;
            } else {
                updateData.damId = parentId;
            }

            await AnimalService.update(childAnimal.id, updateData);

            toast.success(`${parentLabel} ajouté avec succès`);
            onSuccess();
        } catch (err) {
            console.error('Error adding parent:', err);
            setError(`Erreur lors de l'ajout du ${parentLabel.toLowerCase()}. Veuillez réessayer.`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Ajouter {parentLabel}</h2>
                        <p className="text-sm text-text-muted">Pour {childAnimal.name}</p>
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
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Info: External status */}
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
                        <strong>Animal externe</strong> : Ce parent sera créé avec le statut "Externe" et ne comptera pas dans l'effectif du troupeau.
                    </div>

                    {/* Name */}
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
                                placeholder={`Nom du ${parentLabel.toLowerCase()}`}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Tag ID - auto-generated */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Numéro d'identification
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input
                                type="text"
                                value={formData.tagId}
                                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                            />
                        </div>
                        <p className="text-xs text-text-muted mt-1">Auto-généré. Vous pouvez le modifier si nécessaire.</p>
                    </div>

                    {/* Birth Date */}
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
                    </div>

                    {/* Photo */}
                    <ImageUpload
                        value={formData.photoUrl}
                        onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                        label={`Photo du ${parentLabel.toLowerCase()}`}
                        required={false}
                        farmId={currentFarm?.id}
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
                            {loading ? 'Ajout en cours...' : `Ajouter ${parentLabel}`}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
