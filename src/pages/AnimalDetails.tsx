import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Edit, LayoutDashboard, Activity, Utensils, GitFork, Ruler, Weight, History, ChevronDown, Check, Calendar as CalendarIcon, Cake } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MorphometricChart } from '../components/herd/MorphometricChart';
import { CertificationBadge } from '../components/ui/CertificationBadge';
import { HealthTab } from '../components/herd/HealthTab';
import { NutritionTab } from '../components/herd/NutritionTab';
import { TimelineTab } from '../components/herd/TimelineTab';
import { HeatCyclePredictor } from '../components/reproduction/HeatCyclePredictor';
import { EditAnimalModal } from '../components/herd/EditAnimalModal';
import { AddMeasurementModal } from '../components/herd/AddMeasurementModal';
import { AnimalService } from '../services/AnimalService';
import { useAnimal } from '../hooks/useAnimal';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';

type AnimalStatus = 'Active' | 'Sold' | 'Deceased';

const statusOptions: { value: AnimalStatus; label: string; color: string }[] = [
    { value: 'Active', label: 'Actif', color: 'bg-green-100 text-green-700' },
    { value: 'Sold', label: 'Vendu', color: 'bg-blue-100 text-blue-700' },
    { value: 'Deceased', label: 'Décédé', color: 'bg-slate-100 text-slate-700' },
];

// Calculate detailed age from birth date
const calculateDetailedAge = (birthDate: string): { years: number; months: number; days: number; totalMonths: number; ageString: string } => {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    // Adjust for negative days
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    // Adjust for negative months
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = years * 12 + months;

    // Build age string
    let ageString = '';
    if (years > 0) {
        ageString += `${years} an${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        ageString += (ageString ? ' ' : '') + `${months} mois`;
    }
    if (years === 0 && months === 0) {
        ageString = `${days} jour${days > 1 ? 's' : ''}`;
    }

    return { years, months, days, totalMonths, ageString };
};

export const AnimalDetails: React.FC = () => {
    const { id } = useParams();
    const { animal, error, loading, refresh } = useAnimal(id);
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'nutrition' | 'pedigree' | 'history'>('overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

    // Show loading state while fetching
    if (loading) {
        return (
            <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-slate-500">Chargement...</p>
            </div>
        );
    }

    // Show error only after loading is complete
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

    const tabs = [
        { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
        { id: 'history', label: 'Historique', icon: History },
        { id: 'health', label: 'Santé', icon: Activity },
        { id: 'nutrition', label: 'Nutrition', icon: Utensils },
        { id: 'pedigree', label: 'Généalogie', icon: GitFork },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <Link to="/herd" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour au troupeau</span>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" icon={Share2}>Partager</Button>
                    <Button variant="outline" icon={Download}>PDF</Button>
                    <Button icon={Edit} onClick={() => setIsEditModalOpen(true)}>Modifier</Button>
                </div>
            </div>

            {/* Animal Header Card (Always Visible) */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row">
                <div className="md:w-1/4 h-64 md:h-auto relative">
                    <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 md:p-8 flex-1">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-4 mb-2 flex-wrap">
                                <h1 className="text-3xl font-bold text-slate-900">{animal.name}</h1>
                                {animal.certification && (
                                    <CertificationBadge level={animal.certification.level} size="md" />
                                )}
                                <Badge variant={animal.gender === 'Male' ? 'info' : 'success'}>
                                    {animal.gender === 'Male' ? 'Mâle' : 'Femelle'}
                                </Badge>

                                {/* Status Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                        disabled={isUpdatingStatus}
                                        className={clsx(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                            currentStatus.color,
                                            "hover:opacity-80 cursor-pointer"
                                        )}
                                    >
                                        {isUpdatingStatus ? 'Mise à jour...' : currentStatus.label}
                                        <ChevronDown className="w-4 h-4" />
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
                                                    {animal.status === option.value && (
                                                        <Check className="w-4 h-4 text-green-600" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-slate-500 font-mono text-lg">{animal.tagId}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                        {/* HG - Hauteur Garrot */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">HG (Hauteur)</p>
                            <div className="flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-primary-600" />
                                <span className="text-xl font-bold text-slate-900">
                                    {lastMeasurement?.height_hg ? `${lastMeasurement.height_hg} cm` : (animal.height ? `${animal.height} cm` : '-')}
                                </span>
                            </div>
                        </div>
                        {/* LCS - Longueur Corps */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">LCS (Longueur)</p>
                            <span className="text-xl font-bold text-slate-900">
                                {lastMeasurement?.length_lcs ? `${lastMeasurement.length_lcs} cm` : (animal.length ? `${animal.length} cm` : '-')}
                            </span>
                        </div>
                        {/* TP - Tour Poitrine */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">TP (Poitrine)</p>
                            <span className="text-xl font-bold text-slate-900">
                                {lastMeasurement?.chest_tp ? `${lastMeasurement.chest_tp} cm` : (animal.chestGirth ? `${animal.chestGirth} cm` : '-')}
                            </span>
                        </div>
                        {/* Masse */}
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Masse</p>
                            <div className="flex items-center gap-2">
                                <Weight className="w-5 h-5 text-primary-600" />
                                <span className="text-xl font-bold text-slate-900">
                                    {lastMeasurement?.weight ? `${lastMeasurement.weight} kg` : (animal.weight ? `${animal.weight} kg` : '-')}
                                </span>
                            </div>
                        </div>

                        {/* Birth Date & Age Details */}
                        {animal.birthDate && (() => {
                            const birthDate = new Date(animal.birthDate);
                            const age = calculateDetailedAge(animal.birthDate);
                            return (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-slate-500 mb-1">Date de naissance & Âge</p>
                                    <div className="flex items-start gap-3">
                                        <CalendarIcon className="w-5 h-5 text-primary-600 mt-0.5" />
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">
                                                {birthDate.toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Cake className="w-4 h-4 text-emerald-600" />
                                                <p className="text-sm font-semibold text-emerald-700">
                                                    {age.ageString}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Add Measurement Button */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setIsMeasurementModalOpen(true)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
                        >
                            <Ruler className="w-4 h-4" />
                            Ajouter une mesure
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium transition-colors whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-white text-primary-700 border-b-2 border-primary-600"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Growth Chart */}
                            {animal.measurements && animal.measurements.length > 0 ? (
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Courbe de Croissance</h2>
                                    <div className="h-[300px] w-full">
                                        <MorphometricChart measurements={animal.measurements} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                                    Pas de données de croissance disponibles.
                                </div>
                            )}

                            {/* Certification Details */}
                            {animal.certification && (
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Certification</h2>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-lg text-slate-900">Certificat {animal.certification.level}</h3>
                                                <Badge variant="success">Validé</Badge>
                                            </div>
                                            <p className="text-slate-500 text-sm mb-4">
                                                Délivré par {animal.certification.authority}
                                            </p>
                                            <div className="flex gap-6 text-sm">
                                                <div>
                                                    <p className="text-slate-400">Date d'émission</p>
                                                    <p className="font-medium text-slate-900">{animal.certification.date}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400">Expire le</p>
                                                    <p className="font-medium text-slate-900">{animal.certification.expiryDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <CertificationBadge level={animal.certification.level} size="lg" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Heat Cycle Prediction for Females */}
                            {animal.gender === 'Female' && (
                                <HeatCyclePredictor animal={animal} compact />
                            )}

                            {/* Upcoming Events */}
                            <Card>
                                <h3 className="font-bold text-slate-900 mb-4">Prochains événements</h3>
                                <div className="space-y-4">
                                    {animal.healthRecords?.filter(r => r.nextDueDate)
                                        .slice(0, 3)
                                        .map(record => (
                                            <div key={record.id} className="flex gap-3 items-start">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{record.type}</p>
                                                    <p className="text-xs text-slate-500">{record.nextDueDate}</p>
                                                </div>
                                            </div>
                                        )) || (
                                            <p className="text-sm text-slate-400 italic">Aucun événement à venir</p>
                                        )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <TimelineTab animal={animal} />
                )}

                {activeTab === 'health' && (
                    <HealthTab
                        records={animal.healthRecords}
                        animal={animal}
                        onUpdate={() => window.location.reload()}
                    />
                )}

                {activeTab === 'nutrition' && (
                    <NutritionTab plan={animal.nutritionPlan} />
                )}

                {activeTab === 'pedigree' && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <GitFork className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Arbre généalogique interactif (Voir page Pédigrées)</p>
                        <Link to="/pedigree" className="text-primary-600 font-medium hover:underline mt-2 inline-block">
                            Accéder aux Pédigrées
                        </Link>
                    </div>
                )}
            </div>

            {/* Edit Animal Modal */}
            <EditAnimalModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    refresh();
                }}
                animal={animal}
            />

            {/* Add Measurement Modal */}
            <AddMeasurementModal
                isOpen={isMeasurementModalOpen}
                onClose={() => setIsMeasurementModalOpen(false)}
                onSuccess={() => {
                    setIsMeasurementModalOpen(false);
                    refresh();
                }}
                animal={animal}
            />

            {/* Close dropdown when clicking outside */}
            {isStatusDropdownOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsStatusDropdownOpen(false)}
                />
            )}
        </div>
    );
};
