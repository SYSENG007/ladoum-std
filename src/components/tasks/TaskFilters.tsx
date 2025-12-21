import React from 'react';
import { Search, X } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { Button } from '../ui/Button';

export interface TaskFilterState {
    search: string;
    assignee: string;
    status: string;
    priority: string;
}

interface TaskFiltersProps {
    filters: TaskFilterState;
    onChange: (filters: TaskFilterState) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onChange }) => {
    const { currentFarm } = useFarm();
    const farmMembers = currentFarm?.members || [];

    const handleChange = (key: keyof TaskFilterState, value: string) => {
        onChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onChange({ search: '', assignee: '', status: '', priority: '' });
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher une tâche..."
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
            </div>

            {/* Filters Group */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <select
                    value={filters.assignee}
                    onChange={(e) => handleChange('assignee', e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">Tous les membres</option>
                    {farmMembers.map(member => (
                        <option key={member.userId} value={member.userId}>{member.displayName}</option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">Tous statuts</option>
                    <option value="Todo">À faire</option>
                    <option value="In Progress">En cours</option>
                    <option value="Blocked">Bloqué</option>
                    <option value="Done">Terminé</option>
                </select>

                <select
                    value={filters.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">Toutes priorités</option>
                    <option value="High">Haute</option>
                    <option value="Medium">Moyenne</option>
                    <option value="Low">Basse</option>
                </select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-500 hover:text-red-600"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Effacer
                    </Button>
                )}
            </div>
        </div>
    );
};
