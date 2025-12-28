import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../../hooks/useAnimals';
import { useData } from '../../context/DataContext';
import { useTranslation } from '../../context/SettingsContext';
import { AddAnimalModal } from '../../components/herd/AddAnimalModal';
import { Search, Plus } from 'lucide-react';
import clsx from 'clsx';

// Calculate age from birth date
const calculateAge = (birthDate: string): string => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

    if (ageInMonths < 12) {
        return `${ageInMonths}m`;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return months === 0 ? `${years}a` : `${years}a ${months}m`;
};

export const HerdMobile: React.FC = () => {
    const navigate = useNavigate();
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
            <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">{t('herd.title')}</h1>
                    <p className="text-xs text-slate-500">{animals.length} {t('dashboard.totalAnimals').toLowerCase()}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-3 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder={t('common.search') + '...'}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-3 flex-shrink-0 overflow-x-auto pb-1">
                {[
                    { key: 'all', labelKey: 'herd.all' },
                    { key: 'Active', labelKey: 'herd.active' },
                    { key: 'Sold', labelKey: 'herd.sold' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterStatus(f.key)}
                        className={clsx(
                            "px-3 py-1.5 text-xs rounded-full whitespace-nowrap",
                            filterStatus === f.key
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-600"
                        )}
                    >
                        {t(f.labelKey)}
                    </button>
                ))}
            </div>

            {/* Animal List */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {filteredAnimals.length > 0 ? (
                    filteredAnimals.map(animal => (
                        <div
                            key={animal.id}
                            onClick={() => navigate(`/herd/${animal.id}`)}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100"
                        >
                            <img
                                src={animal.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
                                alt={animal.name}
                                className="w-14 h-14 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-900 truncate">{animal.name}</p>
                                    {animal.birthDate && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                                            {calculateAge(animal.birthDate)}
                                        </span>
                                    )}
                                    <span className={clsx(
                                        "text-[10px] px-1.5 py-0.5 rounded shrink-0",
                                        animal.gender === 'Male' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                                    )}>
                                        {animal.gender === 'Male' ? '♂' : '♀'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {animal.tagId || `LAD-${animal.id?.slice(-3)}`}
                                </p>
                                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                                    <span>HG: {animal.height || '-'}</span>
                                    <span>LCS: {animal.length || '-'}</span>
                                    <span>TP: {animal.chestGirth || '-'}</span>
                                </div>
                            </div>
                            <div className={clsx(
                                "w-2 h-2 rounded-full",
                                animal.status === 'Active' ? "bg-emerald-500" :
                                    animal.status === 'Sold' ? "bg-blue-500" : "bg-slate-300"
                            )} />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">{t('herd.noAnimals')}</p>
                    </div>
                )}
            </div>

            {/* Bottom padding for fixed nav */}
            <div className="h-16 flex-shrink-0" />

            <AddAnimalModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />
        </div>
    );
};
