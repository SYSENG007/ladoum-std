import React, { useState, useEffect } from 'react';
import { Video, Plus, Calendar, MessageCircle, Search, Stethoscope } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConsultationCard, BookingModal } from '../components/teleconsultation';
import { ConsultationService } from '../services/ConsultationService';
import { VeterinarianService } from '../services/VeterinarianService';
import { AnimalService } from '../services/AnimalService';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import type { Consultation, Veterinarian } from '../types/consultation';
import type { Animal } from '../types';
import clsx from 'clsx';
import { useTranslation } from '../context/SettingsContext';

type TabType = 'all' | 'scheduled' | 'completed';
type FilterStatus = 'all' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';

export const Teleconsultation: React.FC = () => {
    const { user } = useAuth();
    const { currentFarm } = useFarm();
    const { t } = useTranslation();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Load data
    useEffect(() => {
        loadData();
    }, [currentFarm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [consultationsData, vetsData, animalsData] = await Promise.all([
                ConsultationService.getAll(),
                VeterinarianService.getAll(),
                AnimalService.getAll(currentFarm?.id)
            ]);

            // Filter consultations by current farm OR current user
            const userId = user?.uid || '';
            const farmId = currentFarm?.id || '';
            const filteredConsultations = consultationsData.filter(c =>
                c.farmerId === userId || c.farmerId === farmId || !c.farmerId
            );

            // Filter animals by current farm (or show all if no farm selected)
            const filteredAnimals = farmId
                ? animalsData.filter(a => a.farmId === farmId || !a.farmId)
                : animalsData;

            console.log('Loaded consultations:', filteredConsultations.length, 'of', consultationsData.length);

            setConsultations(filteredConsultations);
            setVeterinarians(vetsData);
            setAnimals(filteredAnimals);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (booking: Omit<Consultation, 'id' | 'createdAt'>) => {
        try {
            console.log('Creating consultation:', booking);
            const consultationId = await ConsultationService.create(booking);
            console.log('Consultation created with ID:', consultationId);

            // Force immediate refresh
            setShowBookingModal(false);
            await loadData();

            // Show success message (could be a toast)
            console.log('Consultation list refreshed');
        } catch (error) {
            console.error('Booking failed:', error);
            alert(t('teleconsultation.bookingError'));
        }
    };

    // Filter consultations
    const filteredConsultations = consultations.filter(c => {
        // Tab filter
        if (activeTab === 'scheduled' && c.status !== 'Scheduled') return false;
        if (activeTab === 'completed' && c.status !== 'Completed') return false;

        // Status filter
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const vetName = c.veterinarianName?.toLowerCase() || '';
            const animalNames = c.animalIds
                .map(id => animals.find(a => a.id === id)?.name.toLowerCase() || '')
                .join(' ');
            if (!vetName.includes(query) && !animalNames.includes(query)) return false;
        }

        return true;
    });

    // Stats
    const scheduledCount = consultations.filter(c => c.status === 'Scheduled').length;
    const inProgressCount = consultations.filter(c => c.status === 'InProgress').length;
    const completedCount = consultations.filter(c => c.status === 'Completed').length;

    const getAnimalNames = (animalIds: string[]) => {
        return animalIds
            .map(id => animals.find(a => a.id === id)?.name)
            .filter(Boolean) as string[];
    };

    const tabs: { id: TabType; label: string; count?: number }[] = [
        { id: 'all', label: t('common.all'), count: consultations.length },
        { id: 'scheduled', label: t('teleconsultation.scheduled'), count: scheduledCount },
        { id: 'completed', label: t('teleconsultation.completed'), count: completedCount }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Stethoscope className="w-7 h-7 text-primary-600" />
                        {t('teleconsultation.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('teleconsultation.subtitle')}</p>
                </div>
                <Button icon={Plus} onClick={() => setShowBookingModal(true)}>
                    {t('teleconsultation.new')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('teleconsultation.scheduled')}</p>
                            <p className="text-2xl font-bold text-slate-900">{scheduledCount}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <MessageCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('teleconsultation.inProgress')}</p>
                            <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Video className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('teleconsultation.completed')}</p>
                            <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Video className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('teleconsultation.veterinarians')}</p>
                            <p className="text-2xl font-bold text-slate-900">{veterinarians.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Tabs */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === tab.id
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            )}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={clsx(
                                    'ml-2 px-2 py-0.5 rounded-full text-xs',
                                    activeTab === tab.id
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-slate-200 text-slate-600'
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search and Filter */}
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-48 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">{t('teleconsultation.allStatuses')}</option>
                        <option value="Scheduled">{t('teleconsultation.scheduled')}</option>
                        <option value="InProgress">{t('teleconsultation.inProgress')}</option>
                        <option value="Completed">{t('teleconsultation.completed')}</option>
                        <option value="Cancelled">{t('teleconsultation.cancelled')}</option>
                    </select>
                </div>
            </div>

            {/* Consultations List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
                </div>
            ) : filteredConsultations.length === 0 ? (
                <Card className="text-center py-12 border-dashed">
                    <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        {consultations.length === 0 ? t('teleconsultation.noConsultations') : t('teleconsultation.noResults')}
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {consultations.length === 0
                            ? t('teleconsultation.bookMessage')
                            : t('teleconsultation.filterMessage')}
                    </p>
                    {consultations.length === 0 && (
                        <Button icon={Plus} onClick={() => setShowBookingModal(true)}>
                            {t('teleconsultation.new')}
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredConsultations.map(consultation => (
                        <ConsultationCard
                            key={consultation.id}
                            consultation={consultation}
                            animalNames={getAnimalNames(consultation.animalIds)}
                            onUpdate={loadData}
                        />
                    ))}
                </div>
            )}

            {/* Booking Modal */}
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                veterinarians={veterinarians}
                animals={animals}
                onBook={handleBook}
                farmerId={user?.uid || currentFarm?.id || ''}
            />
        </div>
    );
};
