import React, { useState } from 'react';
import { MOCK_USERS } from '../utils/constants'; // Users still mock for now
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { List, Kanban, Calendar, Plus, CheckCircle, Clock, AlertCircle, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { TaskFilters, type TaskFilterState } from '../components/tasks/TaskFilters';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskCalendar } from '../components/tasks/TaskCalendar';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { useTasks } from '../hooks/useTasks';
import { useData } from '../context/DataContext';
import { TaskService } from '../services/TaskService';
import type { TaskStatus, Task } from '../types';
import clsx from 'clsx';

export const Tasks: React.FC = () => {
    const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('kanban');
    const { tasks, error } = useTasks();
    const { refreshData } = useData();
    const [filters, setFilters] = useState<TaskFilterState>({
        search: '',
        assignee: '',
        status: '',
        priority: ''
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const handleAddSuccess = async () => {
        await refreshData();
    };

    const handleDelete = async (taskId: string, taskTitle: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${taskTitle}" ?`)) {
            return;
        }
        try {
            await TaskService.delete(taskId);
            await refreshData();
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Erreur lors de la suppression de la tâche.');
        }
    };

    const handleTaskUpdate = async (taskId: string, newStatus: TaskStatus) => {
        try {
            await TaskService.updateStatus(taskId, newStatus);
            await refreshData(); // Refresh data after status change
        } catch (err) {
            console.error("Failed to update task", err);
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
            case 'Todo': return <AlertCircle className="w-5 h-5 text-slate-400" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tâches</h1>
                    <p className="text-slate-500">Gérez les activités de la bergerie.</p>
                </div>
                <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>Nouvelle Tâche</Button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setView('list')}
                        className={clsx("p-2 rounded-lg transition-all", view === 'list' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        title="Liste"
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView('kanban')}
                        className={clsx("p-2 rounded-lg transition-all", view === 'kanban' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        title="Tableau"
                    >
                        <Kanban className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={clsx("p-2 rounded-lg transition-all", view === 'calendar' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        title="Calendrier"
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 w-full lg:w-auto">
                    <TaskFilters filters={filters} onChange={setFilters} />
                </div>
            </div>
            {/* Views */}
            {view === 'list' && (
                <Card noPadding>
                    <div className="divide-y divide-slate-100">
                        {filteredTasks.map(task => {
                            const assignee = MOCK_USERS.find(u => u.id === task.assignedTo);
                            return (
                                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Clickable Status Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === `status-${task.id}` ? null : `status-${task.id}`)}
                                                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                                title="Changer le statut"
                                            >
                                                {getStatusIcon(task.status)}
                                            </button>
                                            {activeMenu === `status-${task.id}` && (
                                                <div className="absolute left-0 top-8 w-40 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20">
                                                    <button
                                                        onClick={() => {
                                                            handleTaskUpdate(task.id, 'Todo');
                                                            setActiveMenu(null);
                                                        }}
                                                        className={clsx(
                                                            "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm",
                                                            task.status === 'Todo' && "bg-slate-100 font-medium"
                                                        )}
                                                    >
                                                        <AlertCircle className="w-4 h-4 text-slate-400" />
                                                        À faire
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
                                                        En cours
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleTaskUpdate(task.id, 'Done');
                                                            setActiveMenu(null);
                                                        }}
                                                        className={clsx(
                                                            "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm",
                                                            task.status === 'Done' && "bg-green-50 font-medium"
                                                        )}
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        Terminé
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={clsx("font-medium text-slate-900", task.status === 'Done' && "line-through text-slate-400")}>{task.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <span>{task.date}</span>
                                                <span>•</span>
                                                <span>{task.type}</span>
                                                {assignee && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <img src={assignee.photoUrl} className="w-4 h-4 rounded-full" alt="" />
                                                            {assignee.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("text-xs font-medium px-2.5 py-0.5 rounded-full border", getPriorityColor(task.priority))}>
                                            {task.priority === 'High' ? 'Haute' : task.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical className="w-4 h-4 text-slate-600" />
                                            </button>
                                            {activeMenu === task.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTask(task);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDelete(task.id, task.title);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredTasks.length === 0 && (
                            <div className="p-8 text-center text-slate-500">Aucune tâche trouvée.</div>
                        )}
                    </div>
                </Card>
            )}

            {view === 'kanban' && (
                <TaskBoard tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />
            )}

            {view === 'calendar' && (
                <TaskCalendar tasks={filteredTasks} />
            )}

            <AddTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />

            {editingTask && (
                <EditTaskModal
                    isOpen={true}
                    onClose={() => setEditingTask(null)}
                    onSuccess={handleAddSuccess}
                    task={editingTask}
                />
            )}
        </div>
    );
};
