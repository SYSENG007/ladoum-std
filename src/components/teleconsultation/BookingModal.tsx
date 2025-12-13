import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Search, Check, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { VeterinarianCard } from './VeterinarianCard';
import type { Veterinarian, ConsultationType, Consultation } from '../../types/consultation';
import type { Animal } from '../../types';
import clsx from 'clsx';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    veterinarians: Veterinarian[];
    animals: Animal[];
    onBook: (booking: Omit<Consultation, 'id' | 'createdAt'>) => Promise<void>;
    farmerId: string;
}

type Step = 'type' | 'vet' | 'animals' | 'schedule' | 'confirm';

const CONSULTATION_PRICE = 5000; // FCFA

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    veterinarians,
    animals,
    onBook,
    farmerId
}) => {
    const [currentStep, setCurrentStep] = useState<Step>('type');
    const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
    const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
    const [useFirstAvailable, setUseFirstAvailable] = useState(false);
    const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [animalSearch, setAnimalSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form when opened
            setCurrentStep('type');
            setConsultationType(null);
            setSelectedVet(null);
            setUseFirstAvailable(false);
            setSelectedAnimals([]);
            setScheduledDate('');
            setScheduledTime('');
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const steps: { id: Step; label: string }[] = [
        { id: 'type', label: 'Type' },
        { id: 'vet', label: 'Vétérinaire' },
        { id: 'animals', label: 'Animaux' },
        { id: 'schedule', label: 'Horaire' },
        { id: 'confirm', label: 'Confirmation' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const consultationTypes: { id: ConsultationType; label: string; description: string; icon: string }[] = [
        { id: 'Health', label: 'Santé', description: 'Symptômes, maladies, blessures', icon: '🩺' },
        { id: 'Reproduction', label: 'Reproduction', description: 'Chaleurs, gestation, mise-bas', icon: '🐑' },
        { id: 'Nutrition', label: 'Nutrition', description: 'Alimentation, régime, suppléments', icon: '🌾' }
    ];

    const filteredAnimals = animals.filter(a =>
        a.name.toLowerCase().includes(animalSearch.toLowerCase()) ||
        a.tagId.toLowerCase().includes(animalSearch.toLowerCase())
    );

    const toggleAnimal = (animalId: string) => {
        setSelectedAnimals(prev =>
            prev.includes(animalId)
                ? prev.filter(id => id !== animalId)
                : [...prev, animalId]
        );
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'type': return consultationType !== null;
            case 'vet': return selectedVet !== null || useFirstAvailable;
            case 'animals': return selectedAnimals.length > 0;
            case 'schedule': return scheduledDate && scheduledTime;
            case 'confirm': return true;
        }
    };

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleConfirm = async () => {
        if (!consultationType || selectedAnimals.length === 0) return;
        if (!scheduledDate || !scheduledTime) {
            alert('Veuillez sélectionner une date et une heure');
            return;
        }

        setLoading(true);
        try {
            const firstAvailableVet = useFirstAvailable
                ? veterinarians.find(v => v.availability === 'Available')
                : selectedVet;

            // Build consultation data with no undefined values
            const consultationData = {
                farmerId: farmerId || '',
                veterinarianId: firstAvailableVet?.id || '',
                veterinarianName: firstAvailableVet?.name || 'Vétérinaire',
                animalIds: selectedAnimals,
                type: consultationType,
                status: 'Scheduled' as const,
                scheduledDate: scheduledDate,
                scheduledTime: scheduledTime,
                notes: notes || '',
                paymentStatus: 'Pending' as const,
                amount: CONSULTATION_PRICE
            };

            console.log('Sending consultation data:', consultationData);

            await onBook(consultationData);
            // Modal will be closed by parent after successful booking
        } catch (error: any) {
            console.error('Booking failed:', error);
            alert(`Erreur: ${error?.message || 'Impossible de créer la consultation'}`);
            // Keep modal open on error so user can retry
        } finally {
            setLoading(false);
        }
    };

    const availableVets = veterinarians.filter(v => v.availability === 'Available');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">Nouvelle Consultation</h2>
                    <p className="text-primary-100 mt-1">Prenez rendez-vous avec un vétérinaire</p>
                </div>

                {/* Progress steps */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                        idx <= currentStepIndex
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    )}>
                                        {idx < currentStepIndex ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className={clsx(
                                        'text-sm font-medium hidden sm:inline',
                                        idx <= currentStepIndex ? 'text-primary-600' : 'text-slate-400'
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={clsx(
                                        'flex-1 h-0.5 mx-2',
                                        idx < currentStepIndex ? 'bg-primary-600' : 'bg-slate-200'
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step: Type */}
                    {currentStep === 'type' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Type de consultation</h3>
                            <div className="space-y-3">
                                {consultationTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setConsultationType(type.id)}
                                        className={clsx(
                                            'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                                            consultationType === type.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        <span className="text-3xl">{type.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">{type.label}</p>
                                            <p className="text-sm text-slate-500">{type.description}</p>
                                        </div>
                                        <div className={clsx(
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                            consultationType === type.id
                                                ? 'border-primary-500 bg-primary-500'
                                                : 'border-slate-300'
                                        )}>
                                            {consultationType === type.id && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step: Vet */}
                    {currentStep === 'vet' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Choisir un vétérinaire</h3>

                            {/* First available option */}
                            <button
                                onClick={() => {
                                    setUseFirstAvailable(true);
                                    setSelectedVet(null);
                                }}
                                className={clsx(
                                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                                    useFirstAvailable
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                )}
                            >
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-slate-900">Premier disponible</p>
                                    <p className="text-sm text-slate-500">
                                        {availableVets.length} vétérinaire(s) disponible(s)
                                    </p>
                                </div>
                                {useFirstAvailable && <Check className="w-5 h-5 text-primary-600" />}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">ou choisir</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {veterinarians.map(vet => (
                                    <VeterinarianCard
                                        key={vet.id}
                                        vet={vet}
                                        selected={!useFirstAvailable && selectedVet?.id === vet.id}
                                        onSelect={(v) => {
                                            setSelectedVet(v);
                                            setUseFirstAvailable(false);
                                        }}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step: Animals */}
                    {currentStep === 'animals' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Sélectionner les animaux</h3>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom ou tag..."
                                    value={animalSearch}
                                    onChange={(e) => setAnimalSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filteredAnimals.map(animal => (
                                    <button
                                        key={animal.id}
                                        onClick={() => toggleAnimal(animal.id)}
                                        className={clsx(
                                            'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                                            selectedAnimals.includes(animal.id)
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        <img
                                            src={animal.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(animal.name)}&background=10b981&color=fff`}
                                            alt={animal.name}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{animal.name}</p>
                                            <p className="text-xs text-slate-500">{animal.tagId} • {animal.gender === 'Male' ? 'Mâle' : 'Femelle'}</p>
                                        </div>
                                        <div className={clsx(
                                            'w-5 h-5 rounded border-2 flex items-center justify-center',
                                            selectedAnimals.includes(animal.id)
                                                ? 'border-primary-500 bg-primary-500'
                                                : 'border-slate-300'
                                        )}>
                                            {selectedAnimals.includes(animal.id) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {selectedAnimals.length > 0 && (
                                <p className="text-sm text-slate-600">
                                    {selectedAnimals.length} animal(aux) sélectionné(s)
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step: Schedule */}
                    {currentStep === 'schedule' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Choisir la date et l'heure</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Heure
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Décrivez brièvement le problème ou vos questions..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step: Confirm */}
                    {currentStep === 'confirm' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Résumé de la consultation</h3>

                            <Card className="bg-slate-50">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Type</span>
                                        <span className="font-medium text-slate-900">
                                            {consultationTypes.find(t => t.id === consultationType)?.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Vétérinaire</span>
                                        <span className="font-medium text-slate-900">
                                            {useFirstAvailable ? 'Premier disponible' : selectedVet?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Animaux</span>
                                        <span className="font-medium text-slate-900">
                                            {animals.filter(a => selectedAnimals.includes(a.id)).map(a => a.name).join(', ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-medium text-slate-900">
                                            {new Date(scheduledDate).toLocaleDateString('fr-FR')} à {scheduledTime}
                                        </span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                                        <span className="text-slate-700 font-medium">Total</span>
                                        <span className="font-bold text-primary-600 text-lg">
                                            {CONSULTATION_PRICE.toLocaleString()} FCFA
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            <p className="text-sm text-slate-500 text-center">
                                Le paiement sera demandé après la consultation
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-white flex gap-3">
                    {currentStepIndex > 0 && (
                        <Button
                            variant="secondary"
                            onClick={goBack}
                            icon={ChevronLeft}
                        >
                            Retour
                        </Button>
                    )}
                    <div className="flex-1" />
                    {currentStep === 'confirm' ? (
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Réservation...' : 'Confirmer la réservation'}
                        </Button>
                    ) : (
                        <Button
                            onClick={goNext}
                            disabled={!canProceed()}
                        >
                            Suivant
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
