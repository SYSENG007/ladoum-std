import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { TaskService } from '../../services/TaskService';
import { FarmMemberService } from '../../services/FarmMemberService';
import { useFarm } from '../../context/FarmContext';
import { useAnimals } from '../../hooks/useAnimals';
import type { Task, TaskPriority, TaskStatus, TaskType } from '../../types';
import type { FarmMember } from '../../types/farm';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    task: Task | null;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSuccess, task }) => {
    const { currentFarm } = useFarm();
    const { animals } = useAnimals();
    const [members, setMembers] = useState<FarmMember[]>([]);
    const [formData, setFormData] = useState({
        title: task?.title || '',
        date: task?.date || '',
        status: (task?.status || 'Todo') as TaskStatus,
        priority: (task?.priority || 'Medium') as TaskPriority,
        type: (task?.type || 'General') as TaskType,
        assignedTo: Array.isArray(task?.assignedTo) ? task.assignedTo : (task?.assignedTo ? [task.assignedTo] : []), // Normalize to array
        animalId: task?.animalId || '',
        description: task?.description || ''
    });


    // Load members from subcollection
    useEffect(() => {
        const loadMembers = async () => {
            if (!currentFarm?.id) {
                setMembers([]);
                return;
            }

            try {
                const farmMembers = await FarmMemberService.getMembers(currentFarm.id);
                setMembers(farmMembers);
            } catch (error) {
                console.error('[EditTaskModal] Error loading members:', error);
                setMembers([]);
            }
        };

        if (isOpen) loadMembers();
    }, [currentFarm?.id, isOpen]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return; // Guard against null task

        setLoading(true);
        setError(null);

        try {
            // Build updates object without undefined values
            const updates: Record<string, string | string[]> = {
                title: formData.title,
                date: formData.date,
                status: formData.status,
                priority: formData.priority,
                type: formData.type
            };

            // Smart assignment save: array if multiple, string if single, omit if none
            if (formData.assignedTo && formData.assignedTo.length > 0) {
                updates.assignedTo = formData.assignedTo.length === 1
                    ? formData.assignedTo[0]  // Single assignment: save as string
                    : formData.assignedTo;    // Multiple: save as array
            }
            if (formData.animalId) {
                updates.animalId = formData.animalId;
            }
            if (formData.description) {
                updates.description = formData.description;
            }

            await TaskService.update(task.id, updates as unknown as Partial<Task>);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating task:', err);
            setError('Erreur lors de la modification de la tâche. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 p-6 flex items-center justify-between rounded-t-3xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Modifier la tâche</h2>
                        <p className="text-sm text-blue-100">Mettez à jour les informations de la tâche</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Titre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Description (optionnel)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Ajoutez des détails sur cette tâche..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Date d'échéance <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="General">📋 Général</option>
                                    <option value="Health">💊 Santé</option>
                                    <option value="Feeding">🌾 Alimentation</option>
                                    <option value="Reproduction">🐑 Reproduction</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Priorité <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Low">🔵 Basse</option>
                                    <option value="Medium">🟡 Moyenne</option>
                                    <option value="High">🔴 Haute</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Statut <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Todo">À faire</option>
                                <option value="In Progress">En cours</option>
                                <option value="Done">Terminé</option>
                            </select>
                        </div>

                        {/* Multi-Assignment - Always show */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Assigné à <span className="text-xs text-slate-500">(sélection multiple possible)</span>
                            </label>

                            {/* Multi-select dropdown */}
                            <div className="relative mb-2">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none z-10" />
                                <select
                                    multiple
                                    value={formData.assignedTo}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                        setFormData({ ...formData, assignedTo: selected });
                                    }}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    size={Math.min(members.length + 1, 5)}
                                >
                                    {members.map(member => (
                                        <option key={member.userId} value={member.userId}>
                                            {member.displayName} ({member.role === 'owner' ? 'Propriétaire' : member.role === 'manager' ? 'Gérant' : 'Employé'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Chips display */}
                            {formData.assignedTo.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.assignedTo.map(userId => {
                                        const member = members.find(m => m.userId === userId);
                                        if (!member) return null;
                                        return (
                                            <div
                                                key={userId}
                                                className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm"
                                            >
                                                <UserIcon className="w-3.5 h-3.5" />
                                                <span>{member.displayName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            assignedTo: formData.assignedTo.filter(id => id !== userId)
                                                        });
                                                    }}
                                                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Animal Selector - Show for Health/Reproduction tasks or if already linked */}
                        {(formData.type === 'Health' || formData.type === 'Reproduction' || formData.animalId) && animals.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    🐑 Animal concerné (optionnel)
                                </label>
                                <select
                                    value={formData.animalId}
                                    onChange={(e) => setFormData({ ...formData, animalId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Aucun animal spécifique</option>
                                    {animals.map(animal => (
                                        <option key={animal.id} value={animal.id}>
                                            {animal.name} ({animal.tagId})
                                        </option>
                                    ))}
                                </select>
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
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
