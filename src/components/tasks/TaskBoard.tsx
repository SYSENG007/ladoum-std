import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../../types';
import clsx from 'clsx';

interface TaskBoardProps {
    tasks: Task[];
    onTaskUpdate: (taskId: string, newStatus: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'Todo', label: 'À faire', color: 'bg-slate-100' },
    { id: 'In Progress', label: 'En cours', color: 'bg-amber-50' },
    { id: 'Done', label: 'Terminé', color: 'bg-green-50' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskUpdate }) => {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (draggedTaskId) {
            onTaskUpdate(draggedTaskId, status);
            setDraggedTaskId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    className={clsx("rounded-2xl p-4 flex flex-col gap-4 transition-colors", column.color)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-700">{column.label}</h3>
                        <span className="bg-white/50 px-2 py-1 rounded-lg text-xs font-bold text-slate-500">
                            {tasks.filter(t => t.status === column.id).length}
                        </span>
                    </div>

                    <div className="flex-1 space-y-3">
                        {tasks.filter(t => t.status === column.id).map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onDragStart={handleDragStart}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
