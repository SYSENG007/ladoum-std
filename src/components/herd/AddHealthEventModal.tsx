import React, { useState } from 'react';
import { X, Syringe, Pill, Stethoscope, Activity } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnimalService } from '../../services/AnimalService';
import { useToast } from '../../context/ToastContext';
import type { Animal, HealthRecord } from '../../types';

interface AddHealthEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: Animal;
}

const EVENT_TYPES: { id: HealthRecord['type']; label: string; icon: React.ReactNode }[] = [
    { id: 'Vaccination', label: 'Vaccination', icon: <Syringe className="w-5 h-5" /> },
    { id: 'Treatment', label: 'Traitement', icon: <Pill className="w-5 h-5" /> },
    { id: 'Vitamin', label: 'Vitamines', icon: <Pill className="w-5 h-5" /> },
    { id: 'Checkup', label: 'Examen', icon: <Stethoscope className="w-5 h-5" /> },
];

export const AddHealthEventModal: React.FC<AddHealthEventModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    animal
}) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [eventType, setEventType] = useState<HealthRecord['type']>('Vaccination');
    const [description, setDescription] = useState('');
    const [dose, setDose] = useState('');
    const [performer, setPerformer] = useState('');
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [nextDueDate, setNextDueDate] = useState('');

    const resetForm = () => {
        setEventType('Vaccination');
        setDescription('');
        setDose('');
        setPerformer('');
        setEventDate(new Date().toISOString().split('T')[0]);
        setNextDueDate('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Veuillez entrer une description');
            return;
        }

        if (!performer.trim()) {
            toast.error('Veuillez indiquer qui a effectué l\'intervention');
            return;
        }

        setLoading(true);

        try {
            const newRecord: HealthRecord = {
                id: `health-${Date.now()}`,
                date: eventDate,
                type: eventType,
                description: description.trim(),
                performer: performer.trim(),
            };

            // Add optional fields
            if (dose.trim()) {
                newRecord.dose = dose.trim();
            }
            if (nextDueDate) {
                newRecord.nextDueDate = nextDueDate;
            }

            // Get current health records and add new one
            const existingRecords = animal.healthRecords || [];
            const updatedRecords = [...existingRecords, newRecord];

            // Update animal with new health record
            await AnimalService.update(animal.id, {
                healthRecords: updatedRecords
            });

            toast.success('Événement de santé enregistré');
            resetForm();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding health event:', error);
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
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Nouvel événement santé</h2>
                            <p className="text-sm text-blue-100">{animal.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Type d'événement *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {EVENT_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setEventType(type.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${eventType === type.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {type.icon}
                                    <span className="font-medium text-sm">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Vaccin contre la fièvre aphteuse"
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            required
                        />
                    </div>

                    {/* Dose (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Dosage (optionnel)
                        </label>
                        <input
                            type="text"
                            value={dose}
                            onChange={(e) => setDose(e.target.value)}
                            placeholder="Ex: 5ml"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Performer */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Effectué par *
                        </label>
                        <input
                            type="text"
                            value={performer}
                            onChange={(e) => setPerformer(e.target.value)}
                            placeholder="Ex: Dr. Diallo"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Next Due Date (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Prochaine échéance (optionnel)
                        </label>
                        <input
                            type="date"
                            value={nextDueDate}
                            onChange={(e) => setNextDueDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Si défini, un rappel sera affiché sur le tableau de bord
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
