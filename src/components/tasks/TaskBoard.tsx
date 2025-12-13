import React, { useState, useRef } from 'react';
import { TaskCard } from './TaskCard';
import { MoreVertical, Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import clsx from 'clsx';

interface TaskBoardProps {
    tasks: Task[];
    onTaskUpdate: (taskId: string, newStatus: TaskStatus) => void;
    onAddTask?: () => void;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; dotColor: string }[] = [
    { id: 'Todo', label: 'À faire', color: 'border-slate-200', dotColor: 'bg-slate-400' },
    { id: 'In Progress', label: 'En cours', color: 'border-amber-200', dotColor: 'bg-amber-400' },
    { id: 'Blocked', label: 'Bloqué', color: 'border-red-200', dotColor: 'bg-red-400' },
    { id: 'Done', label: 'Terminé', color: 'border-green-200', dotColor: 'bg-green-400' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskUpdate, onAddTask, onEditTask, onDeleteTask }) => {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
    const dragCounter = useRef(0);

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        // Add visual feedback
        const target = e.target as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDraggedTask(null);
        setDragOverColumn(null);
        dragCounter.current = 0;
    };

    const handleDragEnter = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        dragCounter.current++;
        setDragOverColumn(status);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverColumn(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (draggedTask && draggedTask.status !== status) {
            onTaskUpdate(draggedTask.id, status);
        }
        setDraggedTask(null);
        setDragOverColumn(null);
        dragCounter.current = 0;
    };

    return (
        <div className="flex gap-4 h-full min-h-[600px] overflow-x-auto pb-4">
            {COLUMNS.map(column => {
                const columnTasks = tasks.filter(t => t.status === column.id);
                const isOver = dragOverColumn === column.id;

                return (
                    <div
                        key={column.id}
                        className={clsx(
                            "flex-1 min-w-[280px] max-w-[320px] flex flex-col rounded-xl transition-all duration-200",
                            isOver && "ring-2 ring-primary-400 ring-opacity-50"
                        )}
                        onDragEnter={(e) => handleDragEnter(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className={clsx(
                            "flex items-center justify-between px-4 py-3 bg-white rounded-t-xl border-b-2",
                            column.color
                        )}>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-2.5 h-2.5 rounded-full", column.dotColor)} />
                                <h3 className="font-semibold text-slate-800">{column.label}</h3>
                                <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                    {columnTasks.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {column.id === 'Todo' && onAddTask && (
                                    <button
                                        onClick={onAddTask}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primary-600"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Column Body */}
                        <div className={clsx(
                            "flex-1 p-3 space-y-3 bg-slate-50/50 rounded-b-xl transition-colors duration-200",
                            isOver && "bg-primary-50/50"
                        )}>
                            {columnTasks.length === 0 ? (
                                <div className={clsx(
                                    "h-24 border-2 border-dashed rounded-xl flex items-center justify-center text-sm text-slate-400 transition-colors",
                                    isOver ? "border-primary-300 bg-primary-50" : "border-slate-200"
                                )}>
                                    {isOver ? "Déposer ici" : "Aucune tâche"}
                                </div>
                            ) : (
                                columnTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        isDragging={draggedTask?.id === task.id}
                                        onEdit={onEditTask}
                                        onDelete={onDeleteTask}
                                        onStatusChange={onTaskUpdate}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
