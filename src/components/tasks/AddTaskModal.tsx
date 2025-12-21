import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, User as UserIcon, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { TaskService } from '../../services/TaskService';
import { useFarm } from '../../context/FarmContext';
import { useAnimals } from '../../hooks/useAnimals';
import type { Task, TaskPriority, TaskStatus, TaskType } from '../../types';
import clsx from 'clsx';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentFarm } = useFarm();
    const { animals } = useAnimals();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        status: 'Todo' as TaskStatus,
        priority: 'Medium' as TaskPriority,
        type: 'General' as TaskType,
        assignedTo: '',
        relatedAnimalId: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQuickTemplates, setShowQuickTemplates] = useState(true);

    // Quick task templates
    const taskTemplates = [
        {
            title: 'Vaccination Clavelée',
            type: 'Health' as TaskType,
            priority: 'High' as TaskPriority,
            description: 'Vaccination annuelle contre la clavelée'
        },
        {
            title: 'Pesée mensuelle',
            type: 'General' as TaskType,
            priority: 'Medium' as TaskPriority,
            description: 'Pesée de contrôle mensuelle du troupeau'
        },
        {
            title: 'Nettoyage Bergerie',
            type: 'General' as TaskType,
            priority: 'Medium' as TaskPriority,
            description: 'Nettoyage et désinfection de la bergerie'
        },
        {
            title: 'Contrôle Reproduction',
            type: 'Reproduction' as TaskType,
            priority: 'High' as TaskPriority,
            description: 'Vérification des femelles gestantes'
        },
    ];

    // Get default date (tomorrow)
    const getDefaultDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const handleTemplateSelect = (template: typeof taskTemplates[0]) => {
        setFormData({
            ...formData,
            title: template.title,
            type: template.type,
            priority: template.priority,
            description: template.description,
            date: formData.date || getDefaultDate()
        });
        setShowQuickTemplates(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Build task data without undefined values (Firestore hangs on undefined)
            const taskData: Record<string, string> = {
                title: formData.title,
                date: formData.date,
                status: formData.status,
                priority: formData.priority,
                type: formData.type,
                farmId: currentFarm?.id || ''  // Injection automatique du farmId
            };

            // Only add optional fields if they have values
            if (formData.assignedTo) {
                taskData.assignedTo = formData.assignedTo;
            }
            if (formData.relatedAnimalId) {
                taskData.animalId = formData.relatedAnimalId;
            }
            if (formData.description) {
                taskData.description = formData.description;
            }

            await TaskService.add(taskData as unknown as Omit<Task, 'id'>);
            onSuccess();
            onClose();

            // Reset form
            setFormData({
                title: '',
                description: '',
                date: '',
                status: 'Todo',
                priority: 'Medium',
                type: 'General',
                assignedTo: '',
                relatedAnimalId: ''
            });
            setShowQuickTemplates(true);
        } catch (err) {
            console.error('Error adding task:', err);
            setError('Erreur lors de l\'ajout de la tâche. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getTypeIcon = (type: TaskType) => {
        switch (type) {
            case 'Health': return '💊';
            case 'Feeding': return '🌾';
            case 'Reproduction': return '🐑';
            default: return '📋';
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 flex items-center justify-between rounded-t-3xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Nouvelle Tâche</h2>
                            <p className="text-sm text-emerald-100">Créez une nouvelle tâche pour la bergerie</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 pt-6 space-y-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Quick Templates */}
                    {showQuickTemplates && (
                        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-4 rounded-2xl border border-emerald-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                Modèles rapides
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {taskTemplates.map((template, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleTemplateSelect(template)}
                                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getTypeIcon(template.type)}</span>
                                            <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                                {template.title}
                                            </span>
                                        </div>
                                        <span className={clsx(
                                            "text-xs px-2 py-0.5 rounded-full border",
                                            getPriorityColor(template.priority)
                                        )}>
                                            {template.priority === 'High' ? 'Haute' : template.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Titre de la tâche <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder="Ex: Vaccination Clavelée"
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
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
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                >
                                    <option value="Low">🔵 Basse</option>
                                    <option value="Medium">🟡 Moyenne</option>
                                    <option value="High">🔴 Haute</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Statut
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                >
                                    <option value="Todo">À faire</option>
                                    <option value="In Progress">En cours</option>
                                    <option value="Done">Terminé</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Assigné à
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <select
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Non assigné</option>
                                        {(currentFarm?.members || []).map(member => (
                                            <option key={member.userId} value={member.userId}>
                                                {member.displayName} ({member.role === 'owner' ? 'Propriétaire' : member.role === 'manager' ? 'Gérant' : 'Employé'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Related Animal (optional) */}
                        {(formData.type === 'Health' || formData.type === 'Reproduction') && animals.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Animal concerné (optionnel)
                                </label>
                                <select
                                    value={formData.relatedAnimalId}
                                    onChange={(e) => setFormData({ ...formData, relatedAnimalId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Aucun animal spécifique</option>
                                    {animals.slice(0, 10).map(animal => (
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
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Création...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Créer la tâche
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
