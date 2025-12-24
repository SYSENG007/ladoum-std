import React, { useState } from 'react';
import { X, User, Hash, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { AnimalService } from '../../services/AnimalService';
import { AccountingService } from '../../services/AccountingService';
import { useAnimals } from '../../hooks/useAnimals';
import { useFarm } from '../../context/FarmContext';
import type { Animal, Gender } from '../../types';

interface AddAnimalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

import { useData } from '../../context/DataContext';

export const AddAnimalModal: React.FC<AddAnimalModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentFarm } = useFarm();
    const { animals } = useAnimals();
    const { refreshData } = useData();
    const [formData, setFormData] = useState({
        name: '',
        tagId: '',
        gender: '' as Gender | '',
        birthDate: '',
        breed: 'Ladoum',
        weight: '',
        height: '',
        length: '',
        chestGirth: '',
        photoUrl: '',
        sireId: '',
        damId: '',
        // Purchase tracking
        wasPurchased: false,
        purchasePrice: '',
        purchaseDate: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log('Submitting animal form...', formData);

        try {
            // Build measurements object only with defined values
            const measurementData = {
                date: new Date().toISOString().split('T')[0],
                weight: formData.weight ? parseFloat(formData.weight) : 0,
                height_hg: formData.height ? parseFloat(formData.height) : 0,
                length_lcs: formData.length ? parseFloat(formData.length) : 0,
                chest_tp: formData.chestGirth ? parseFloat(formData.chestGirth) : 0
            };

            // Only include measurements if there's actual data beyond the date
            const hasMeasurements = formData.weight || formData.height || formData.length || formData.chestGirth;

            const animalData: Omit<Animal, 'id'> = {
                name: formData.name,
                tagId: formData.tagId,
                gender: formData.gender as Gender,
                birthDate: formData.birthDate,
                breed: formData.breed,
                status: 'Active',
                weight: formData.weight ? parseFloat(formData.weight) : 0,
                height: formData.height ? parseFloat(formData.height) : 0,
                length: formData.length ? parseFloat(formData.length) : 0,
                chestGirth: formData.chestGirth ? parseFloat(formData.chestGirth) : 0,
                photoUrl: formData.photoUrl || '',
                measurements: hasMeasurements ? [measurementData] : [],
                farmId: currentFarm?.id || '',
                ...(formData.sireId && { sireId: formData.sireId }),
                ...(formData.damId && { damId: formData.damId })
            };

            console.log('Animal data to save:', animalData);

            const result = await AnimalService.add(animalData);
            console.log('Animal added successfully:', result.id);

            // If Dam is selected, automatically register a Birth event if not generic purchase
            if (formData.damId && !formData.wasPurchased) {
                const dam = animals.find(a => a.id === formData.damId);
                if (dam) {
                    // Check if birth already recorded for this date (basic debounce)
                    const hasBirth = dam.reproductionRecords?.some(
                        r => r.type === 'Birth' && r.date === formData.birthDate
                    );

                    if (!hasBirth) {
                        try {
                            const newRecord = {
                                id: `rep-birth-${Date.now()}`,
                                date: formData.birthDate,
                                type: 'Birth' as const,
                                offspringCount: 1, // Default to 1, user can edit later
                                notes: `Naissance de ${formData.name} (${formData.tagId})`,
                                mateId: formData.sireId || undefined
                            };

                            await AnimalService.update(dam.id, {
                                reproductionRecords: [...(dam.reproductionRecords || []), newRecord]
                            });
                            console.log('Dam updated with birth event');
                        } catch (damErr) {
                            console.error('Failed to update Dam record:', damErr);
                        }
                    }
                }
            }

            if (refreshData) await refreshData();

            // Auto-create purchase transaction if animal was purchased
            if (formData.wasPurchased && formData.purchasePrice) {
                try {
                    await AccountingService.add({
                        type: 'Expense',
                        category: 'Purchase',
                        amount: parseFloat(formData.purchasePrice),
                        description: `Achat de ${formData.name} (${formData.tagId})`,
                        date: formData.purchaseDate || new Date().toISOString().split('T')[0],
                        farmId: currentFarm?.id || '',
                        animalId: result.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    console.log('Purchase transaction created');
                } catch (transErr) {
                    console.error('Failed to create purchase transaction:', transErr);
                    // Continue anyway, animal was added
                }
            }

            onSuccess();
            onClose();

            // Reset form
            setFormData({
                name: '',
                tagId: '',
                gender: '',
                birthDate: '',
                breed: 'Ladoum',
                weight: '',
                height: '',
                length: '',
                chestGirth: '',
                photoUrl: '',
                sireId: '',
                damId: '',
                wasPurchased: false,
                purchasePrice: '',
                purchaseDate: ''
            });
        } catch (err: any) {
            console.error('Error adding animal:', err);
            const errorMessage = err?.message || err?.code || 'Erreur inconnue';
            setError(`Erreur: ${errorMessage}. Vérifiez la console pour plus de détails.`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-modal rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="bg-surface-modal border-b border-border-subtle p-6 flex items-center justify-between rounded-t-3xl flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Ajouter un animal</h2>
                        <p className="text-sm text-text-muted">Enregistrez un nouvel animal dans le cheptel</p>
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
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
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
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Ex: Bella"
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
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Ex: LAD-001"
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
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">Sélectionner...</option>
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
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Race <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.breed}
                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                                <option value="Ladoum">Ladoum</option>
                                <option value="Bali-Bali">Bali-Bali</option>
                                <option value="Touabire">Touabire</option>
                                <option value="Peul-Peul">Peul-Peul</option>
                                <option value="Mixed">Mixte</option>
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
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="0.0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Hauteur (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Hauteur au garrot"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Longueur (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.length}
                                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Longueur corps"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Tour de poitrine (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.chestGirth}
                                    onChange={(e) => setFormData({ ...formData, chestGirth: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Tour de poitrine"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Photo */}
                    <ImageUpload
                        value={formData.photoUrl}
                        onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                        label="Photo de l'animal"
                        required={false}
                        farmId={currentFarm?.id}
                    />

                    {/* Purchase Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="wasPurchased"
                                checked={formData.wasPurchased}
                                onChange={(e) => setFormData({ ...formData, wasPurchased: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="wasPurchased" className="font-medium text-slate-700">
                                Cet animal a été acheté (non né dans la bergerie)
                            </label>
                        </div>

                        {formData.wasPurchased && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
                                <p className="text-sm text-orange-700 font-medium">
                                    💰 Une transaction sera automatiquement créée dans la comptabilité
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Prix d'achat (FCFA) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required={formData.wasPurchased}
                                            value={formData.purchasePrice}
                                            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Ex: 500000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Date d'achat
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
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
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Ajout en cours...' : 'Ajouter l\'animal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div >
    );
};
