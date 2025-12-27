import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useAnimals } from '../../hooks/useAnimals';
import { useTranslation } from '../../context/SettingsContext';
import { FarmMemberService } from '../../services/FarmMemberService';
import type { Task } from '../../types';
import type { FarmMember } from '../../types/farm';
import clsx from 'clsx';

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, task: Task) => void;
    onDragEnd: (e: React.DragEvent) => void;
    isDragging?: boolean;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onDragStart,
    onDragEnd,
    isDragging,
    onEdit,
    onDelete
}) => {
    const { currentFarm } = useFarm();
    const { animals } = useAnimals();
    const { t } = useTranslation();
    const [showMenu, setShowMenu] = useState(false);
    const [members, setMembers] = useState<FarmMember[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    const linkedAnimal = task.animalId ? animals.find(a => a.id === task.animalId) : null;

    // Load farm members  
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
                console.error('[TaskCard] Error loading members:', error);
                setMembers([]);
            }
        };
        loadMembers();
    }, [currentFarm?.id]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
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

        if (diffDays < 0) return { label: (t('common.daysAgo') || 'Il y a {days}j').replace('{days}', Math.abs(diffDays).toString()), isOverdue: true };
        if (diffDays === 0) return { label: t('common.today'), isOverdue: false };
        if (diffDays === 1) return { label: t('common.tomorrow'), isOverdue: false };
        return { label: (t('common.inDays') || 'Dans {days}j').replace('{days}', diffDays.toString()), isOverdue: false };
    };

    const dueInfo = getDueDateLabel();

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };



    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd}
            className={clsx(
                "bg-white rounded-xl border border-slate-200 p-4 cursor-grab active:cursor-grabbing",
                "transform transition-all duration-300 ease-out",
                "hover:shadow-lg hover:-translate-y-1 hover:border-primary-200",
                "group relative",
                isDragging && "opacity-50 scale-[0.98] rotate-1 shadow-xl border-primary-300"
            )}
            style={{
                willChange: isDragging ? 'transform, opacity' : 'auto'
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(task.type)}</span>
                    <span className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        priorityStyles.bg, priorityStyles.text, priorityStyles.border
                    )}>
                        {t(`task.${task.priority.toLowerCase()}`)}
                    </span>
                </div>

                {/* Menu Button */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
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
                                    {t('common.edit')}
                                </button>
                            )}



                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(task.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 border-t border-slate-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('common.delete')}
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

                {/* Assignees - Support single or multiple */}
                {(() => {
                    const assignedIds = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];
                    const assignees = assignedIds
                        .map(id => members.find(m => m.userId === id))
                        .filter(Boolean) as FarmMember[];

                    if (assignees.length === 0) {
                        return (
                            <div
                                className="w-7 h-7 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center"
                                title={t('task.unassigned')}
                            >
                                <span className="text-[10px] text-slate-400">?</span>
                            </div>
                        );
                    }

                    const maxVisible = 3;
                    const visibleAssignees = assignees.slice(0, maxVisible);
                    const remaining = assignees.length - maxVisible;

                    return (
                        <div className="flex items-center -space-x-2">
                            {visibleAssignees.map((assignee, idx) => (
                                <div
                                    key={assignee.userId}
                                    className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white"
                                    title={assignee.displayName}
                                    style={{ zIndex: visibleAssignees.length - idx }}
                                >
                                    {getInitials(assignee.displayName || 'U')}
                                </div>
                            ))}
                            {remaining > 0 && (
                                <div
                                    className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm border-2 border-white"
                                    title={`+${remaining} ${remaining === 1 ? 'autre' : 'autres'}: ${assignees.slice(maxVisible).map(a => a.displayName).join(', ')}`}
                                >
                                    +{remaining}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
