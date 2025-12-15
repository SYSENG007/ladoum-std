import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks';
import { useData } from '../../context/DataContext';
import { TaskService } from '../../services/TaskService';
import { AddTaskModal } from '../../components/tasks/AddTaskModal';
import { Plus, Home, PawPrint, CheckSquare, Settings, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { TaskStatus } from '../../types';

export const TasksMobile: React.FC = () => {
    const navigate = useNavigate();
    const { tasks, error } = useTasks();
    const { refreshData } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Done': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'In Progress': return <Clock className="w-4 h-4 text-amber-500" />;
            default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        await TaskService.updateStatus(taskId, newStatus);
        await refreshData();
    };

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Tâches</h1>
                    <p className="text-xs text-slate-500">{tasks.length} tâches</p>
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
                    { key: 'all', label: 'Toutes' },
                    { key: 'Todo', label: 'À faire' },
                    { key: 'In Progress', label: 'En cours' },
                    { key: 'Done', label: 'Terminées' },
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
                {filteredTasks.length > 0 ? filteredTasks.map(task => (
                    <div key={task.id} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => handleStatusChange(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                                className="mt-0.5"
                            >
                                {getStatusIcon(task.status)}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={clsx("font-medium text-sm", task.status === 'Done' && "line-through text-slate-400")}>
                                    {task.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{new Date(task.date).toLocaleDateString('fr')}</p>
                            </div>
                            <span className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded",
                                task.priority === 'High' ? "bg-red-100 text-red-700" :
                                    task.priority === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {task.priority}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">Aucune tâche</p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex-shrink-0 border-t border-slate-200 bg-white pt-2 pb-1 -mx-4 px-4 mt-2">
                <div className="flex items-center justify-around">
                    <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 text-slate-400">
                        <Home className="w-5 h-5" />
                        <span className="text-[10px]">Accueil</span>
                    </button>
                    <button onClick={() => navigate('/herd')} className="flex flex-col items-center gap-0.5 text-slate-400">
                        <PawPrint className="w-5 h-5" />
                        <span className="text-[10px]">Troupeau</span>
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg -mt-4">
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => navigate('/tasks')} className="flex flex-col items-center gap-0.5 text-emerald-600">
                        <CheckSquare className="w-5 h-5" />
                        <span className="text-[10px]">Tâches</span>
                    </button>
                    <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-0.5 text-slate-400">
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px]">Réglages</span>
                    </button>
                </div>
            </div>

            <AddTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={async () => await refreshData()}
            />
        </div>
    );
};
