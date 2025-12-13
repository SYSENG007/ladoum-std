import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MoreHorizontal, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useAnimals } from '../../hooks/useAnimals';
import type { Task, TaskStatus } from '../../types';
import clsx from 'clsx';

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, task: Task) => void;
    onDragEnd: (e: React.DragEvent) => void;
    isDragging?: boolean;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onDragStart,
    onDragEnd,
    isDragging,
    onEdit,
    onDelete,
    onStatusChange
}) => {
    const { currentFarm } = useFarm();
    const { animals } = useAnimals();
    const [showMenu, setShowMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Find assignee from farm members
    const assignee = (currentFarm?.members || []).find(m => m.userId === task.assignedTo);
    const linkedAnimal = task.animalId ? animals.find(a => a.id === task.animalId) : null;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
                setShowStatusMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'High': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
            case 'Medium': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
            case 'Low': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Health': return '💊';
            case 'Feeding': return '🌾';
            case 'Reproduction': return '🐑';
            default: return '📋';
        }
    };

    const priorityStyles = getPriorityStyles(task.priority);

    // Calculate days until due
    const getDueDateLabel = () => {
        const today = new Date();
        const dueDate = new Date(task.date);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: `Il y a ${Math.abs(diffDays)}j`, isOverdue: true };
        if (diffDays === 0) return { label: "Aujourd'hui", isOverdue: false };
        if (diffDays === 1) return { label: 'Demain', isOverdue: false };
        return { label: `Dans ${diffDays}j`, isOverdue: false };
    };

    const dueInfo = getDueDateLabel();

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const statuses: { id: TaskStatus; label: string; color: string }[] = [
        { id: 'Todo', label: 'À faire', color: 'text-slate-500' },
        { id: 'In Progress', label: 'En cours', color: 'text-amber-500' },
        { id: 'Blocked', label: 'Bloqué', color: 'text-red-500' },
        { id: 'Done', label: 'Terminé', color: 'text-green-500' },
    ];

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd}
            className={clsx(
                "bg-white rounded-xl border border-slate-200 p-4 cursor-grab active:cursor-grabbing",
                "transform transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                "group relative",
                isDragging && "opacity-50 scale-95 shadow-2xl rotate-2"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(task.type)}</span>
                    <span className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        priorityStyles.bg, priorityStyles.text, priorityStyles.border
                    )}>
                        {task.priority === 'High' ? 'Haute' : task.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                    </span>
                </div>

                {/* Menu Button */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                            setShowStatusMenu(false);
                        }}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
                    >
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Dropdown Menu - Fixed position to avoid clipping */}
                    {showMenu && (
                        <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-visible">
                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(task);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Modifier
                                </button>
                            )}

                            {onStatusChange && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowStatusMenu(!showStatusMenu);
                                        }}
                                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-sm text-slate-700"
                                    >
                                        <span className="flex items-center gap-3">
                                            <ArrowRight className="w-4 h-4" />
                                            Changer statut
                                        </span>
                                        <span className="text-slate-400">›</span>
                                    </button>

                                    {/* Status submenu */}
                                    {showStatusMenu && (
                                        <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                                            {statuses.map(status => (
                                                <button
                                                    key={status.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStatusChange(task.id, status.id);
                                                        setShowMenu(false);
                                                        setShowStatusMenu(false);
                                                    }}
                                                    className={clsx(
                                                        "w-full px-4 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-2",
                                                        task.status === status.id && "bg-slate-100 font-medium"
                                                    )}
                                                >
                                                    <span className={clsx("w-2 h-2 rounded-full",
                                                        status.id === 'Todo' && "bg-slate-400",
                                                        status.id === 'In Progress' && "bg-amber-400",
                                                        status.id === 'Blocked' && "bg-red-400",
                                                        status.id === 'Done' && "bg-green-400"
                                                    )} />
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Supprimer "${task.title}" ?`)) {
                                            onDelete(task.id);
                                        }
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 border-t border-slate-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2 leading-snug">
                {task.title}
            </h4>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Linked Animal */}
            {linkedAnimal && (
                <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs">
                        🐑
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate">{linkedAnimal.name}</span>
                    <span className="text-[10px] text-slate-400">{linkedAnimal.tagId}</span>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className={clsx(
                    "flex items-center gap-1.5 text-xs",
                    dueInfo.isOverdue ? "text-red-500" : "text-slate-400"
                )}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">{dueInfo.label}</span>
                </div>

                {/* Assignee */}
                {assignee ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            title={assignee.displayName || assignee.name}
                        >
                            {getInitials(assignee.displayName || assignee.name || 'U')}
                        </div>
                    </div>
                ) : (
                    <div
                        className="w-7 h-7 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center"
                        title="Non assigné"
                    >
                        <span className="text-[10px] text-slate-400">?</span>
                    </div>
                )}
            </div>
        </div>
    );
};
