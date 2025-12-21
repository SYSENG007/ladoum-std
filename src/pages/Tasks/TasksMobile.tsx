import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTasks } from '../../hooks/useTasks';
import { useAnimals } from '../../hooks/useAnimals';
import { useData } from '../../context/DataContext';
import { useFarm } from '../../context/FarmContext';
import { useTranslation } from '../../context/SettingsContext';
import { TaskService } from '../../services/TaskService';
import { AddTaskModal } from '../../components/tasks/AddTaskModal';
import { Plus, CheckCircle, Clock, XCircle, Circle, User, Tag } from 'lucide-react';
import clsx from 'clsx';
import type { TaskStatus } from '../../types';

export const TasksMobile: React.FC = () => {
    const { tasks, error } = useTasks();
    const { animals } = useAnimals();
    const { refreshData } = useData();
    const { currentFarm } = useFarm();
    const { t } = useTranslation();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const STATUS_OPTIONS: { id: TaskStatus; label: string; icon: React.ReactNode }[] = [
        { id: 'Todo', label: t('task.todo'), icon: <Circle className="w-5 h-5 text-slate-400" strokeWidth={1.5} /> },
        { id: 'In Progress', label: t('task.inProgress'), icon: <Clock className="w-5 h-5 text-amber-500" strokeWidth={1.5} /> },
        { id: 'Blocked', label: t('task.blocked'), icon: <XCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} /> },
        { id: 'Done', label: t('task.done'), icon: <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={1.5} /> },
    ];

    const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Done': return <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={1.5} />;
            case 'In Progress': return <Clock className="w-5 h-5 text-amber-500" strokeWidth={1.5} />;
            case 'Blocked': return <XCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />;
            default: return <Circle className="w-5 h-5 text-slate-400" strokeWidth={1.5} />;
        }
    };

    const handleOpenDropdown = (taskId: string) => {
        const button = buttonRefs.current[taskId];
        if (button) {
            const rect = button.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
            setOpenDropdownId(taskId);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        setOpenDropdownId(null);
        setDropdownPosition(null);
        await TaskService.updateStatus(taskId, newStatus);
        await refreshData();
    };

    const closeDropdown = () => {
        setOpenDropdownId(null);
        setDropdownPosition(null);
    };

    const getPriorityLabel = (priority: string) => {
        return t(`task.${priority.toLowerCase()}`);
    };

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const currentTask = openDropdownId ? tasks.find(t => t.id === openDropdownId) : null;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">{t('page.tasks')}</h1>
                    <p className="text-xs text-slate-500">{tasks.length} {t('page.tasks').toLowerCase()}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-3 flex-shrink-0 overflow-x-auto pb-1">
                {[
                    { key: 'all', label: t('common.all') || 'Toutes' },
                    { key: 'Todo', label: t('task.todo') },
                    { key: 'In Progress', label: t('task.inProgress') },
                    { key: 'Blocked', label: t('task.blocked') },
                    { key: 'Done', label: t('task.done') },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterStatus(f.key)}
                        className={clsx(
                            "px-3 py-1.5 text-xs rounded-full whitespace-nowrap",
                            filterStatus === f.key ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {filteredTasks.length > 0 ? filteredTasks.map(task => {
                    const assignee = (currentFarm?.members || []).find(m => m.userId === task.assignedTo);
                    const linkedAnimal = task.animalId ? animals.find(a => a.id === task.animalId) : null;

                    return (
                        <div
                            key={task.id}
                            className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100"
                        >
                            <div className="flex items-start gap-3">
                                {/* Status Icon Button - Opens Dropdown */}
                                <button
                                    ref={el => { buttonRefs.current[task.id] = el; }}
                                    onClick={() => handleOpenDropdown(task.id)}
                                    className="mt-0.5 p-0.5 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    {getStatusIcon(task.status)}
                                </button>

                                {/* Task Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={clsx(
                                        "font-semibold text-sm text-slate-900",
                                        task.status === 'Done' && "line-through text-slate-400"
                                    )}>
                                        {task.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(task.date).toLocaleDateString()} • {task.type}
                                    </p>

                                    {/* Assignee & Animal Info */}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        {assignee && (
                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                    {(assignee.displayName || assignee.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                                <span>{assignee.displayName || assignee.name}</span>
                                            </span>
                                        )}
                                        {linkedAnimal && (
                                            <span className="flex items-center gap-1 text-xs text-primary-600">
                                                <Tag className="w-3 h-3" />
                                                <span>{linkedAnimal.name}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Priority Badge */}
                                <span className={clsx(
                                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                    task.priority === 'High' ? "bg-red-100 text-red-700" :
                                        task.priority === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {getPriorityLabel(task.priority)}
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">{t('task.noTasks')}</p>
                    </div>
                )}
            </div>

            {/* Bottom padding for fixed nav */}
            <div className="h-16 flex-shrink-0" />

            {/* Status Dropdown Portal - Fixed position overlay */}
            {openDropdownId && dropdownPosition && currentTask && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[9998]"
                        onClick={closeDropdown}
                    />

                    {/* Dropdown Menu */}
                    <div
                        className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[9999] min-w-[160px]"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left
                        }}
                    >
                        {STATUS_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => handleStatusChange(openDropdownId, option.id)}
                                className={clsx(
                                    "w-full px-4 py-3 text-left flex items-center gap-3 transition-colors",
                                    currentTask.status === option.id
                                        ? "bg-slate-50"
                                        : "hover:bg-slate-50"
                                )}
                            >
                                {option.icon}
                                <span className="text-sm font-medium text-slate-700">
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}

            <AddTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={async () => await refreshData()}
            />
        </div>
    );
};
