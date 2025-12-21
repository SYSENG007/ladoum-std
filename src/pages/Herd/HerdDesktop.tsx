import React, { useState } from 'react';
import { AnimalCard } from '../../components/herd/AnimalCard';
import { AddAnimalModal } from '../../components/herd/AddAnimalModal';
import { Search, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAnimals } from '../../hooks/useAnimals';
import { useData } from '../../context/DataContext';
import { useTranslation } from '../../context/SettingsContext';

export const HerdDesktop: React.FC = () => {
    const { animals, error } = useAnimals();
    const { refreshData } = useData();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddSuccess = async () => {
        await refreshData();
    };

    const filteredAnimals = animals.filter(animal => {
        const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            animal.id.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || animal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('herd.title')}</h1>
                    <p className="text-slate-500">{t('herd.subtitle')}</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    {t('herd.addAnimal')}
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('herd.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? 'bg-slate-200' : ''}>
                        {t('herd.all')}
                    </Button>
                    <Button variant="secondary" onClick={() => setFilterStatus('Active')} className={filterStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                        {t('herd.active')}
                    </Button>
                    <Button variant="secondary" onClick={() => setFilterStatus('Sold')} className={filterStatus === 'Sold' ? 'bg-blue-100 text-blue-700' : ''}>
                        {t('herd.sold')}
                    </Button>
                </div>
            </div>

            {/* Animal Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredAnimals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAnimals.map(animal => (
                            <AnimalCard key={animal.id} animal={animal} onUpdate={handleAddSuccess} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        <p>{t('herd.noAnimals')}</p>
                    </div>
                )}
            </div>

            <AddAnimalModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />
        </div>
    );
};
