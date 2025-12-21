import React, { useState, useRef } from 'react';
import { TaskCard } from './TaskCard';
import { MoreVertical, Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import clsx from 'clsx';
import { useTranslation } from '../../context/SettingsContext';

interface TaskBoardProps {
    tasks: Task[];
    onTaskUpdate: (taskId: string, newStatus: TaskStatus) => void;
    onAddTask?: () => void;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskUpdate, onAddTask, onEditTask, onDeleteTask }) => {
    const { t } = useTranslation();
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
    const [droppedTask, setDroppedTask] = useState<{ id: string; targetStatus: TaskStatus } | null>(null);
    const dragCounter = useRef<{ [key: string]: number }>({});
    const draggedElementRef = useRef<HTMLElement | null>(null);

    const COLUMNS: { id: TaskStatus; label: string; color: string; dotColor: string; bgColor: string }[] = [
        { id: 'Todo', label: t('task.todo'), color: 'border-slate-200', dotColor: 'bg-slate-400', bgColor: 'bg-slate-50' },
        { id: 'In Progress', label: t('task.inProgress'), color: 'border-amber-200', dotColor: 'bg-amber-400', bgColor: 'bg-amber-50' },
        { id: 'Blocked', label: t('task.blocked'), color: 'border-red-200', dotColor: 'bg-red-400', bgColor: 'bg-red-50' },
        { id: 'Done', label: t('task.done'), color: 'border-green-200', dotColor: 'bg-green-400', bgColor: 'bg-green-50' },
    ];

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';

        // Store reference to dragged element
        draggedElementRef.current = e.target as HTMLElement;

        // Create custom drag image
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        const clone = target.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        clone.style.transform = 'rotate(2deg)';
        clone.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, rect.width / 2, 20);
        requestAnimationFrame(() => document.body.removeChild(clone));
    };

    const handleDragEnd = () => {
        // Reset visibility of the original element
        if (draggedElementRef.current) {
            draggedElementRef.current.style.visibility = 'visible';
        }
        draggedElementRef.current = null;
        setDraggedTask(null);
        setDragOverColumn(null);
        dragCounter.current = {};
    };

    const handleDragEnter = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (!dragCounter.current[status]) dragCounter.current[status] = 0;
        dragCounter.current[status]++;
        setDragOverColumn(status);
    };

    const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (dragCounter.current[status]) dragCounter.current[status]--;
        if (dragCounter.current[status] === 0 && dragOverColumn === status) {
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
            // Hide the original element immediately so it doesn't snap back visibly
            if (draggedElementRef.current) {
                draggedElementRef.current.style.visibility = 'hidden';
            }

            // Mark as dropped for optimistic UI
            setDroppedTask({ id: draggedTask.id, targetStatus: status });

            // Trigger the update
            onTaskUpdate(draggedTask.id, status);

            // Clear dropped state after React has updated
            setTimeout(() => setDroppedTask(null), 50);
        }

        setDraggedTask(null);
        setDragOverColumn(null);
        dragCounter.current = {};
    };

    // Get tasks for a column with optimistic updates
    const getColumnTasks = (columnStatus: TaskStatus): Task[] => {
        return tasks.filter(t => {
            // If this is the dropped task, show in target column
            if (droppedTask?.id === t.id) {
                return droppedTask.targetStatus === columnStatus;
            }
            return t.status === columnStatus;
        });
    };

    return (
        <div className="flex gap-4 h-full min-h-[600px] overflow-x-auto pb-4">
            {COLUMNS.map(column => {
                const columnTasks = getColumnTasks(column.id);
                const isOver = dragOverColumn === column.id && draggedTask?.status !== column.id;

                return (
                    <div
                        key={column.id}
                        className={clsx(
                            "flex-1 min-w-[280px] max-w-[320px] flex flex-col rounded-xl transition-all duration-150",
                            isOver && "ring-2 ring-primary-400"
                        )}
                        onDragEnter={(e) => handleDragEnter(e, column.id)}
                        onDragLeave={(e) => handleDragLeave(e, column.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className={clsx(
                            "flex items-center justify-between px-4 py-3 bg-white rounded-t-xl border-b-2 transition-colors duration-150",
                            column.color,
                            isOver && column.bgColor
                        )}>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-2.5 h-2.5 rounded-full", column.dotColor)} />
                                <h3 className="font-semibold text-slate-800">{column.label}</h3>
                                <span className={clsx(
                                    "ml-1 px-2 py-0.5 text-slate-600 text-xs font-bold rounded-full",
                                    isOver ? column.bgColor : "bg-slate-100"
                                )}>
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
                            "flex-1 p-3 space-y-3 bg-slate-50/50 rounded-b-xl transition-colors duration-150",
                            isOver && "bg-primary-50/60"
                        )}>
                            {columnTasks.length === 0 ? (
                                <div className={clsx(
                                    "h-24 border-2 border-dashed rounded-xl flex items-center justify-center text-sm transition-all duration-150",
                                    isOver
                                        ? "border-primary-400 bg-primary-100/50 text-primary-600"
                                        : "border-slate-200 text-slate-400"
                                )}>
                                    {isOver ? t('task.dropHere') : t('task.noTasks')}
                                </div>
                            ) : (
                                <>
                                    {columnTasks.map(task => (
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
                                    ))}

                                    {/* Single drop zone at bottom when dragging over */}
                                    {isOver && (
                                        <div className="h-16 border-2 border-dashed border-primary-400 bg-primary-100/50 rounded-xl flex items-center justify-center text-sm text-primary-600">
                                            {t('task.dropHere')}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
