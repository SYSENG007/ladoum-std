import React, { useState } from 'react';
import { X, Baby, Camera, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { AnimalService } from '../../services/AnimalService';
import { ReproductionService } from '../../services/ReproductionService';
import { TaskService } from '../../services/TaskService';
import { useToast } from '../../context/ToastContext';
import type { Animal } from '../../types';

interface RecordBirthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mother: Animal;
}

interface LambFormData {
    photo: string;
    name: string;
    gender: 'Male' | 'Female';
    birthWeight: number;
    status: 'Alive' | 'Stillborn';
    color: string;
    notes: string;
}

type Step = 'birthInfo' | 'lambsDeclaration' | 'summary';

export const RecordBirthModal: React.FC<RecordBirthModalProps> = ({
    isOpen,
    onClose,
    mother,
    onSuccess
}) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>('birthInfo');

    // Étape 1: Infos générales mise bas
    const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
    const [birthTime, setBirthTime] = useState('');
    const [litterSize, setLitterSize] = useState(1);
    const [complications, setComplications] = useState('');

    // Étape 2: Déclaration des agneaux
    const [currentLambIndex, setCurrentLambIndex] = useState(0);
    const [lambs, setLambs] = useState<LambFormData[]>([]);

    // Initialiser les agneaux quand le nombre change
    React.useEffect(() => {
        if (step === 'lambsDeclaration' && lambs.length !== litterSize) {
            const newLambs: LambFormData[] = Array.from({ length: litterSize }, (_, i) => ({
                photo: '',
                name: `Agneau de ${mother.name} #${i + 1}`,
                gender: 'Male',
                birthWeight: 0,
                status: 'Alive',
                color: '',
                notes: ''
            }));
            setLambs(newLambs);
            setCurrentLambIndex(0);
        }
    }, [step, litterSize, mother.name, lambs.length]);

    const resetForm = () => {
        setBirthDate(new Date().toISOString().split('T')[0]);
        setBirthTime('');
        setLitterSize(1);
        setComplications('');
        setLambs([]);
        setCurrentLambIndex(0);
        setStep('birthInfo');
    };

    const handleNextStep = () => {
        if (step === 'birthInfo') {
            setStep('lambsDeclaration');
        } else if (step === 'lambsDeclaration') {
            // Vérifier que l'agneau actuel a une photo
            if (!lambs[currentLambIndex]?.photo) {
                toast.error('La photo est obligatoire pour chaque agneau');
                return;
            }

            // Si c'est le dernier agneau, passer au récap
            if (currentLambIndex === litterSize - 1) {
                setStep('summary');
            } else {
                setCurrentLambIndex(currentLambIndex + 1);
            }
        }
    };

    const handlePrevStep = () => {
        if (step === 'summary') {
            setStep('lambsDeclaration');
            setCurrentLambIndex(litterSize - 1);
        } else if (step === 'lambsDeclaration' && currentLambIndex > 0) {
            setCurrentLambIndex(currentLambIndex - 1);
        } else {
            setStep('birthInfo');
        }
    };

    const updateCurrentLamb = (field: keyof LambFormData, value: any) => {
        const updated = [...lambs];
        updated[currentLambIndex] = { ...updated[currentLambIndex], [field]: value };
        setLambs(updated);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Récupérer le père depuis le dernier mating
            const lastMating = await ReproductionService.getLastMating(mother.id);
            const sireId = lastMating?.maleId;

            // 2. Créer les fiches des agneaux vivants
            const offspringIds: string[] = [];
            for (const lamb of lambs.filter(l => l.status === 'Alive')) {
                // Générer un TagID unique (simpliste pour l'exemple)
                const tagId = `${mother.farmId?.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

                const newLambId = await AnimalService.add({
                    farmId: mother.farmId,
                    name: lamb.name,
                    tagId,
                    photoUrl: lamb.photo,
                    gender: lamb.gender,
                    birthDate,
                    breed: mother.breed,
                    status: 'Active',
                    weight: lamb.birthWeight,
                    height: 0,
                    length: 0,
                    chestGirth: 0,
                    damId: mother.id,
                    sireId,
                    measurements: [],
                    healthRecords: [],
                });

                offspringIds.push(newLambId);
            }

            // 3. Enregistrer l'événement Birth
            await ReproductionService.addEvent({
                farmId: mother.farmId,
                animalId: mother.id,
                type: 'Birth',
                date: birthDate,
                notes: `${complications || 'Mise bas normale'}. ${birthTime ? `Heure: ${birthTime}` : ''}`,
                litterSize,
                offspringIds,
                complications: complications || undefined
            });

            // 4. Mettre à jour le statut de la mère
            await AnimalService.update(mother.id, {
                status: 'Active', // Ou créer un statut "Lactating" si vous le souhaitez
            });

            // 5. Planifier tâche de sevrage (+90j)
            const weaningDate = new Date(birthDate);
            weaningDate.setDate(weaningDate.getDate() + 90);

            await TaskService.add({
                farmId: mother.farmId,
                title: `Sevrage suggéré - ${mother.name}`,
                description: `Sevrage des ${litterSize} agneaux nés le ${new Date(birthDate).toLocaleDateString()}`,
                date: weaningDate.toISOString().split('T')[0],
                status: 'Todo',
                priority: 'Medium',
                type: 'Reproduction',
                animalId: mother.id,
            });

            toast.success(`Mise bas enregistrée ! ${offspringIds.length} agneaux créés.`);
            resetForm();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            toast.error('Erreur lors de l\'enregistrement de la mise bas');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentLamb = lambs[currentLambIndex];

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-600 to-pink-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Baby className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Déclaration de Mise Bas</h2>
                            <p className="text-sm text-pink-100">{mother.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="px-6 pt-4">
                    <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1 rounded ${step !== 'birthInfo' ? 'bg-pink-600' : 'bg-slate-200'}`} />
                        <div className={`flex-1 h-1 rounded ${step === 'summary' ? 'bg-pink-600' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-slate-500">
                        <span>Infos Générales</span>
                        <span>Agneaux ({currentLambIndex + 1}/{litterSize})</span>
                        <span>Récapitulatif</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* ÉTAPE 1: Infos Mise Bas */}
                    {step === 'birthInfo' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Date de mise bas *
                                    </label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Heure (optionnel)
                                    </label>
                                    <input
                                        type="time"
                                        value={birthTime}
                                        onChange={(e) => setBirthTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nombre d'agneaux *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={litterSize}
                                    onChange={(e) => setLitterSize(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Complications / Notes
                                </label>
                                <textarea
                                    value={complications}
                                    onChange={(e) => setComplications(e.target.value)}
                                    placeholder="Aucune complication particulière..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 2: Déclaration Agneaux */}
                    {step === 'lambsDeclaration' && currentLamb && (
                        <div className="space-y-4">
                            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
                                <p className="text-sm font-medium text-pink-900">
                                    Agneau {currentLambIndex + 1} sur {litterSize}
                                </p>
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Photo * <span className="text-pink-600">📸</span>
                                </label>
                                <ImageUpload
                                    value={currentLamb.photo}
                                    onChange={(url) => updateCurrentLamb('photo', url)}
                                    label="Photo de l'agneau"
                                    required
                                    farmId={mother.farmId}
                                />
                            </div>

                            {/* Nom */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nom *
                                </label>
                                <input
                                    type="text"
                                    value={currentLamb.name}
                                    onChange={(e) => updateCurrentLamb('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Sexe & Poids */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Sexe *
                                    </label>
                                    <select
                                        value={currentLamb.gender}
                                        onChange={(e) => updateCurrentLamb('gender', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    >
                                        <option value="Male">Mâle</option>
                                        <option value="Female">Femelle</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Poids (kg) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={currentLamb.birthWeight}
                                        onChange={(e) => updateCurrentLamb('birthWeight', parseFloat(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* État & Couleur */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        État
                                    </label>
                                    <select
                                        value={currentLamb.status}
                                        onChange={(e) => updateCurrentLamb('status', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    >
                                        <option value="Alive">Vivant</option>
                                        <option value="Stillborn">Mort-né</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Couleur
                                    </label>
                                    <input
                                        type="text"
                                        value={currentLamb.color}
                                        onChange={(e) => updateCurrentLamb('color', e.target.value)}
                                        placeholder="Blanc, Noir, Bicolore..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Particularités / Notes
                                </label>
                                <textarea
                                    value={currentLamb.notes}
                                    onChange={(e) => updateCurrentLamb('notes', e.target.value)}
                                    placeholder="Marques distinctives, observations..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 3: Récapitulatif */}
                    {step === 'summary' && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-900">Prêt à valider</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {litterSize} agneaux seront créés, {lambs.filter(l => l.status === 'Alive').length} vivants
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-900">Récapitulatif des agneaux</h3>
                                {lambs.map((lamb, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        {lamb.photo ? (
                                            <img src={lamb.photo} alt={lamb.name} className="w-16 h-16 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{lamb.name}</p>
                                            <p className="text-sm text-slate-600">
                                                {lamb.gender === 'Male' ? '♂' : '♀'} {lamb.birthWeight}kg - {lamb.status === 'Alive' ? '✅ Vivant' : '⚠️ Mort-né'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-between gap-3">
                    {step !== 'birthInfo' && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handlePrevStep}
                            icon={ArrowLeft}
                        >
                            Retour
                        </Button>
                    )}

                    <div className="flex-1" />

                    {step !== 'summary' ? (
                        <Button
                            type="button"
                            onClick={handleNextStep}
                            icon={ArrowRight}
                            disabled={step === 'birthInfo' && !birthDate}
                        >
                            Suivant
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-pink-600 hover:bg-pink-700"
                        >
                            {loading ? 'Enregistrement...' : 'Valider la Mise Bas'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
