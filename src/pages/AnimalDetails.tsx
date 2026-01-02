import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Edit, ChevronDown, Cake, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { MorphometricChart } from '../components/herd/MorphometricChart';
import { NutritionSummaryCard } from '../components/herd/NutritionSummaryCard';
import { HealthSummaryCard } from '../components/herd/HealthSummaryCard';
import { ReproductionCard } from '../components/herd/ReproductionCard';
import { PedigreeSummaryCard } from '../components/herd/PedigreeSummaryCard';
import { HistorySummaryCard } from '../components/herd/HistorySummaryCard';
import { EditAnimalModal } from '../components/herd/EditAnimalModal';
import { AddMeasurementModal } from '../components/herd/AddMeasurementModal';
import { AddHealthEventModal } from '../components/herd/AddHealthEventModal';
import { AnimalService } from '../services/AnimalService';
import { TaskService } from '../services/TaskService';
import { useAnimal } from '../hooks/useAnimal';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';
import type { AnimalStatus, Task } from '../types';
import { AddTaskModal } from '../components/tasks/AddTaskModal';

const statusOptions: { value: AnimalStatus; label: string; color: string }[] = [
    { value: 'Active', label: 'Actif', color: 'bg-green-100 text-green-700' },
    { value: 'Sold', label: 'Vendu', color: 'bg-secondary-100 text-primary-700' },
    { value: 'Deceased', label: 'Décédé', color: 'bg-slate-100 text-slate-700' },
];

import { calculateDetailedAge } from '../utils/dateUtils';

export const AnimalDetails: React.FC = () => {
    const { id } = useParams();
    const { animal, error, loading, refresh } = useAnimal(id);
    const toast = useToast();

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

    // UI states
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Tasks state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    // Fetch tasks when animal is loaded
    React.useEffect(() => {
        const fetchTasks = async () => {
            if (animal?.farmId) {
                try {
                    const allTasks = await TaskService.getAll(animal.farmId);
                    // Filter tasks for this animal
                    const animalTasks = allTasks.filter(t => t.animalId === animal.id);
                    setTasks(animalTasks);
                } catch (e) {
                    console.error('Error fetching tasks', e);
                }
            }
        };
        fetchTasks();
    }, [animal?.farmId, animal?.id, isAddTaskModalOpen]); // Refresh when modal closes (simple way)

    const handleStatusChange = async (newStatus: AnimalStatus) => {
        if (!animal || animal.status === newStatus) {
            setIsStatusDropdownOpen(false);
            return;
        }

        setIsUpdatingStatus(true);
        try {
            await AnimalService.update(animal.id, { status: newStatus });
            toast.success(`Statut changé en "${statusOptions.find(s => s.value === newStatus)?.label}"`);
            refresh();
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Erreur lors de la mise à jour du statut');
        } finally {
            setIsUpdatingStatus(false);
            setIsStatusDropdownOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-slate-500">Chargement...</p>
            </div>
        );
    }

    if (error || !animal) {
        return (
            <div className="p-12 text-center">
                <p className="text-red-500 text-lg">{error || 'Animal non trouvé'}</p>
                <Link to="/herd" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
                    ← Retour au troupeau
                </Link>
            </div>
        );
    }

    const lastMeasurement = animal.measurements && animal.measurements.length > 0
        ? animal.measurements[animal.measurements.length - 1]
        : null;

    const currentStatus = statusOptions.find(s => s.value === animal.status) || statusOptions[0];
    const age = animal.birthDate ? calculateDetailedAge(animal.birthDate) : null;

    return (
        <div className="space-y-6 pb-12">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <Link to="/herd" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour au troupeau</span>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" icon={Share2}>Partager</Button>
                    <Button variant="outline" icon={Download}>PDF</Button>
                </div>
            </div>

            {/* 1. HERO SECTION (Identity & Key Metrics) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Photo */}
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-slate-900">{animal.name}</h1>
                                    <Badge variant="neutral">{animal.breed}</Badge>

                                    {/* Status Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                            disabled={isUpdatingStatus}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all",
                                                currentStatus.color,
                                                "hover:opacity-80 disabled:opacity-50"
                                            )}
                                        >
                                            {currentStatus.label}
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                        {isStatusDropdownOpen && (
                                            <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20 min-w-[140px]">
                                                {statusOptions.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleStatusChange(option.value)}
                                                        className={clsx(
                                                            "w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 flex items-center justify-between gap-2",
                                                            animal.status === option.value && "bg-slate-50"
                                                        )}
                                                    >
                                                        <span className={clsx("px-2 py-0.5 rounded-full text-xs", option.color)}>
                                                            {option.label}
                                                        </span>
                                                        {animal.status === option.value && <Check className="w-4 h-4 text-green-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-slate-500 text-sm">
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{animal.tagId}</span>
                                    <span>•</span>
                                    <span>{animal.gender === 'Male' ? 'Mâle' : 'Femelle'}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Cake className="w-3 h-3" />
                                        <span>{age?.ageString || 'Âge inconnu'}</span>
                                    </div>
                                </div>
                            </div>

                            <Button icon={Edit} onClick={() => setIsEditModalOpen(true)}>Modifier</Button>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MASSE</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {lastMeasurement?.weight || animal.weight || '-'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500">kg</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">HAUTEUR (HG)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {lastMeasurement?.height_hg || animal.height || '-'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500">cm</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">POITRINE (TP)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {lastMeasurement?.chest_tp || animal.chestGirth || '-'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500">cm</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">LONGUEUR (LCS)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {lastMeasurement?.length_lcs || animal.length || '-'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500">cm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DASHBOARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                {/* COLUMN 1: PRODUCTION & NUTRITION */}
                <div className="space-y-6">
                    {/* Growth Chart */}
                    <Card className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="p-1 bg-green-100 text-green-600 rounded">📈</span>
                                Croissance
                            </h3>
                            <Badge variant="success" className="text-xs">+2.5% vs mois dernier</Badge>
                        </div>
                        <div className="w-full h-[250px] min-h-0">
                            <MorphometricChart measurements={animal.measurements || []} />
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50 text-xs">
                            <span className="text-slate-500">Objectif: 700 kg</span>
                            <button onClick={() => setIsMeasurementModalOpen(true)} className="text-primary-600 font-medium hover:underline">
                                + Mesure
                            </button>
                        </div>
                    </Card>

                    {/* Nutrition */}
                    <div>
                        <NutritionSummaryCard plan={animal.nutritionPlan} />
                    </div>
                </div>

                {/* COLUMN 2: HEALTH & HISTORY */}
                <div className="space-y-6">
                    {/* Health Status */}
                    <div>
                        <HealthSummaryCard
                            records={animal.healthRecords}
                            tasks={tasks}
                            onAddEvent={() => setIsHealthModalOpen(true)}
                            onPlanTask={() => setIsAddTaskModalOpen(true)}
                        />
                    </div>

                    {/* Recent History */}
                    <div>
                        <HistorySummaryCard animal={animal} />
                    </div>
                </div>

                {/* COLUMN 3: REPRODUCTION & PEDIGREE */}
                <div className="space-y-6">
                    {/* Reproduction */}
                    <div>
                        <ReproductionCard animal={animal} />
                    </div>

                    {/* Pedigree */}
                    <div>
                        <PedigreeSummaryCard animal={animal} />
                    </div>
                </div>

            </div>

            {/* MODALS */}
            <EditAnimalModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => { setIsEditModalOpen(false); refresh(); }}
                animal={animal}
            />
            <AddMeasurementModal
                isOpen={isMeasurementModalOpen}
                onClose={() => setIsMeasurementModalOpen(false)}
                onSuccess={() => { setIsMeasurementModalOpen(false); refresh(); }}
                animal={animal}
            />
            <AddHealthEventModal
                isOpen={isHealthModalOpen}
                onClose={() => setIsHealthModalOpen(false)}
                onSuccess={() => { refresh(); }} // Don't close here, wait for user action in success step
                animal={animal}
                onPlanFollowUp={() => {
                    setIsHealthModalOpen(false);
                    setIsAddTaskModalOpen(true);
                }}
                onConsultVet={() => {
                    setIsHealthModalOpen(false);
                    // Navigate to teleconsultation or show toast for now
                    toast.info("Redirection vers la téléconsultation...");
                    // In a real app: navigate(`/teleconsultation?animalId=${animal.id}`)
                    window.location.href = '/teleconsultation';
                }}
            />
            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onSuccess={() => {
                    setIsAddTaskModalOpen(false);
                    toast.success('Tâche planifiée avec succès');
                    // Refresh tasks handled by dependency on isAddTaskModalOpen in useEffect, or we can manually call fetchTasks if we extracted it.
                    // For now, useEffect dependency is fine or we can trigger a refresh.
                }}
                preselectedAnimalId={animal.id}
            />

            {/* Click outside handler for dropdown */}
            {isStatusDropdownOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
            )}
        </div>
    );
};
