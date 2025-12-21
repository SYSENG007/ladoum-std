import React, { useState } from 'react';

import { Button } from '../../components/ui/Button';
import { List, Kanban, Calendar, Plus, CheckCircle, Clock, AlertCircle, Ban, Edit2, Trash2, MoreVertical, User, Tag } from 'lucide-react';
import { TaskFilters, type TaskFilterState } from '../../components/tasks/TaskFilters';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import { TaskCalendar } from '../../components/tasks/TaskCalendar';
import { AddTaskModal } from '../../components/tasks/AddTaskModal';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { useTasks } from '../../hooks/useTasks';
import { useAnimals } from '../../hooks/useAnimals';
import { useData } from '../../context/DataContext';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/SettingsContext';
import { TaskService } from '../../services/TaskService';
import type { TaskStatus, Task } from '../../types';
import clsx from 'clsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';


export const TasksDesktop: React.FC = () => {
    const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('kanban');
    const { tasks, error } = useTasks();
    const { animals } = useAnimals();
    const { refreshData } = useData();
    const { currentFarm } = useFarm();
    const toast = useToast();
    const { t } = useTranslation();
    const [filters, setFilters] = useState<TaskFilterState>({
        search: '',
        assignee: '',
        status: '',
        priority: ''
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        taskId: string;
        taskTitle: string;
    }>({ isOpen: false, taskId: '', taskTitle: '' });

    const handleAddSuccess = async () => {
        await refreshData();
    };

    const handleDelete = (taskId: string, taskTitle: string) => {
        setDeleteDialog({ isOpen: true, taskId, taskTitle });
    };

    const confirmDelete = async () => {
        try {
            await TaskService.delete(deleteDialog.taskId);
            await refreshData();
            setDeleteDialog({ isOpen: false, taskId: '', taskTitle: '' });
            toast.success(t('task.deleteSuccess'));
        } catch (err) {
            console.error('Error deleting task:', err);
            toast.error(t('task.deleteError'));
        }
    };

    const handleTaskUpdate = async (taskId: string, newStatus: TaskStatus) => {
        try {
            await TaskService.updateStatus(taskId, newStatus);
            await refreshData(); // Refresh data after status change
        } catch (err) {
            console.error("Failed to update task", err);
            toast.error(t('common.error'));
        }
    };

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
        const matchesAssignee = !filters.assignee || task.assignedTo === filters.assignee;
        const matchesStatus = !filters.status || task.status === filters.status;
        const matchesPriority = !filters.priority || task.priority === filters.priority;
        return matchesSearch && matchesAssignee && matchesStatus && matchesPriority;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 border-red-100';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'Low': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Done': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'In Progress': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'Blocked': return <Ban className="w-5 h-5 text-red-500" />;
            case 'Todo': return <AlertCircle className="w-5 h-5 text-slate-400" />;
            default: return null;
        }
    };

    const getPriorityLabel = (priority: string) => {
        return t(`task.${priority.toLowerCase()}`);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('page.tasks')}</h1>
                    <p className="text-slate-500">{t('task.subtitle')}</p>
                </div>
                <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>{t('task.newTask')}</Button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center flex-shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setView('list')}
                        className={clsx("p-2 rounded-lg transition-all", view === 'list' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        title={t('common.list') || "Liste"}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView('kanban')}
                        className={clsx("p-2 rounded-lg transition-all", view === 'kanban' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        title={t('common.board') || "Tableau"}
                    >
                        <Kanban className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={clsx("p-2 rounded-lg transition-all", view === 'calendar' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        title={t('common.calendar') || "Calendrier"}
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 w-full lg:w-auto">
                    <TaskFilters filters={filters} onChange={setFilters} />
                </div>
            </div>
            {/* Views */}
            <div className="flex-1 overflow-hidden">
                {view === 'list' && (
                    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-slate-100">
                                {filteredTasks.map(task => {
                                    const assignee = (currentFarm?.members || []).find(m => m.userId === task.assignedTo);
                                    const linkedAnimal = task.animalId ? animals.find(a => a.id === task.animalId) : null;
                                    return (
                                        <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Clickable Status Dropdown */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === `status-${task.id}` ? null : `status-${task.id}`)}
                                                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                                        title={t('task.changeStatus')}
                                                    >
                                                        {getStatusIcon(task.status)}
                                                    </button>
                                                    {activeMenu === `status-${task.id}` && (
                                                        <div className="fixed mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-[9999]">
                                                            <button
                                                                onClick={() => {
                                                                    handleTaskUpdate(task.id, 'Todo');
                                                                    setActiveMenu(null);
                                                                }}
                                                                className={clsx(
                                                                    "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm rounded-t-xl",
                                                                    task.status === 'Todo' && "bg-slate-100 font-medium"
                                                                )}
                                                            >
                                                                <AlertCircle className="w-4 h-4 text-slate-400" />
                                                                {t('task.todo')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleTaskUpdate(task.id, 'In Progress');
                                                                    setActiveMenu(null);
                                                                }}
                                                                className={clsx(
                                                                    "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm",
                                                                    task.status === 'In Progress' && "bg-amber-50 font-medium"
                                                                )}
                                                            >
                                                                <Clock className="w-4 h-4 text-amber-500" />
                                                                {t('task.inProgress')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleTaskUpdate(task.id, 'Blocked');
                                                                    setActiveMenu(null);
                                                                }}
                                                                className={clsx(
                                                                    "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm",
                                                                    task.status === 'Blocked' && "bg-red-50 font-medium"
                                                                )}
                                                            >
                                                                <Ban className="w-4 h-4 text-red-500" />
                                                                {t('task.blocked')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleTaskUpdate(task.id, 'Done');
                                                                    setActiveMenu(null);
                                                                }}
                                                                className={clsx(
                                                                    "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm rounded-b-xl",
                                                                    task.status === 'Done' && "bg-green-50 font-medium"
                                                                )}
                                                            >
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                {t('task.done')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={clsx("font-medium text-slate-900", task.status === 'Done' && "line-through text-slate-400")}>{task.title}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                                                        <span>{task.date}</span>
                                                        <span>•</span>
                                                        <span>{task.type}</span>
                                                        {assignee && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                                        {(assignee.displayName || assignee.name || 'U').charAt(0).toUpperCase()}
                                                                    </span>
                                                                    {assignee.displayName || assignee.name}
                                                                </span>
                                                            </>
                                                        )}
                                                        {linkedAnimal && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 text-primary-600">
                                                                    <Tag className="w-3 h-3" />
                                                                    {linkedAnimal.name}
                                                                    <span className="text-slate-400">({linkedAnimal.tagId})</span>
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={clsx("text-xs font-medium px-2.5 py-0.5 rounded-full border", getPriorityColor(task.priority))}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                                                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-slate-600" />
                                                    </button>
                                                    {activeMenu === task.id && (
                                                        <div className="fixed mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-[9999]" style={{ marginLeft: '-160px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTask(task);
                                                                    setActiveMenu(null);
                                                                }}
                                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 rounded-t-xl"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                                {t('common.edit')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleDelete(task.id, task.title);
                                                                    setActiveMenu(null);
                                                                }}
                                                                className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 rounded-b-xl"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                {t('common.delete')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredTasks.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">{t('task.noTasks')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'kanban' && (
                    <TaskBoard
                        tasks={filteredTasks}
                        onTaskUpdate={handleTaskUpdate}
                        onEditTask={(task) => setEditingTask(task)}
                        onDeleteTask={(taskId) => {
                            const task = tasks.find(t => t.id === taskId);
                            if (task) handleDelete(taskId, task.title);
                        }}
                    />
                )}

                {view === 'calendar' && (
                    <TaskCalendar tasks={filteredTasks} />
                )}
            </div>

            <AddTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />

            {
                editingTask && (
                    <EditTaskModal
                        isOpen={!!editingTask}
                        onClose={() => setEditingTask(null)}
                        task={editingTask}
                        onSuccess={handleAddSuccess}
                    />
                )
            }

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onCancel={() => setDeleteDialog({ isOpen: false, taskId: '', taskTitle: '' })}
                onConfirm={confirmDelete}
                title={t('common.delete')}
                message={`Êtes-vous sûr de vouloir supprimer la tâche "${deleteDialog.taskTitle}" ? Cette action est irréversible.`}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
            />
        </div >
    );
};
