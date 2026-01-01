import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User as UserIcon, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { TaskService } from '../../services/TaskService';
import { FarmMemberService } from '../../services/FarmMemberService';
import { useFarm } from '../../context/FarmContext';
import { useAnimals } from '../../hooks/useAnimals';
import type { Task, TaskPriority, TaskStatus, TaskType } from '../../types';
import type { FarmMember } from '../../types/farm';
import clsx from 'clsx';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentFarm } = useFarm();
    const { animals } = useAnimals();
    const [members, setMembers] = useState<FarmMember[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        status: 'Todo' as TaskStatus,
        priority: 'Medium' as TaskPriority,
        type: 'General' as TaskType,
        assignedTo: [] as string[], // Support multi-assignment
        relatedAnimalId: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQuickTemplates, setShowQuickTemplates] = useState(true);

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
                console.error('[AddTaskModal] Error loading members:', error);
                setMembers([]);
            }
        };

        loadMembers();
    }, [currentFarm?.id]);

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
            const taskData: Record<string, string | string[]> = {
                title: formData.title,
                date: formData.date,
                status: formData.status,
                priority: formData.priority,
                type: formData.type,
                farmId: currentFarm?.id || ''  // Injection automatique du farmId
            };

            // Only add optional fields if they have values
            // Smart assignment save: array if multiple, string if single, omit if none
            if (formData.assignedTo && formData.assignedTo.length > 0) {
                taskData.assignedTo = formData.assignedTo.length === 1
                    ? formData.assignedTo[0]  // Single assignment: save as string
                    : formData.assignedTo;    // Multiple: save as array
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
                assignedTo: [],
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
            case 'Low': return 'bg-secondary-100 text-primary-700 border-blue-200';
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
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between rounded-t-3xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Nouvelle Tâche</h2>
                            <p className="text-sm text-slate-200">Créez une nouvelle tâche pour la bergerie</p>
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
                        <div className="bg-gradient-to-br from-slate-100 to-blue-50 p-4 rounded-2xl border border-slate-200">
                            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-slate-900" />
                                Modèles rapides
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {taskTemplates.map((template, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleTemplateSelect(template)}
                                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-500 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getTypeIcon(template.type)}</span>
                                            <span className="text-sm font-bold text-text-primary group-hover:text-slate-900 transition-colors">
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
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Titre de la tâche <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                                placeholder="Ex: Vaccination Clavelée"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Description (optionnel)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all resize-none"
                                placeholder="Ajoutez des détails sur cette tâche..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Date d'échéance <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                                >
                                    <option value="General">📋 Général</option>
                                    <option value="Health">💊 Santé</option>
                                    <option value="Feeding">🌾 Alimentation</option>
                                    <option value="Reproduction">🐑 Reproduction</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Priorité <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                                >
                                    <option value="Low">🔵 Basse</option>
                                    <option value="Medium">🟡 Moyenne</option>
                                    <option value="High">🔴 Haute</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Statut
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                                >
                                    <option value="Todo">À faire</option>
                                    <option value="In Progress">En cours</option>
                                    <option value="Done">Terminé</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Assigné à <span className="text-xs text-text-muted">(sélection multiple possible)</span>
                                </label>

                                {/* Multi-select dropdown */}
                                <div className="relative mb-2">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 pointer-events-none z-10" />
                                    <select
                                        multiple
                                        value={formData.assignedTo}
                                        onChange={(e) => {
                                            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                            setFormData({ ...formData, assignedTo: selected });
                                        }}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-input border border-border-default text-text-primary focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
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
                                                    className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm"
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
                                                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Related Animal (optional) - Always show for all task types */}
                        {animals.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Animal concerné (optionnel)
                                </label>
                                <select
                                    value={formData.relatedAnimalId}
                                    onChange={(e) => setFormData({ ...formData, relatedAnimalId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
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
                            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-slate-900 hover:to-slate-900"
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
