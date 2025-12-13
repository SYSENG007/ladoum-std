import React from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { MOCK_USERS } from '../../utils/constants';
import { useAnimals } from '../../hooks/useAnimals';
import type { Task } from '../../types';
import clsx from 'clsx';

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart }) => {
    const assignee = MOCK_USERS.find(u => u.id === task.assignedTo);
    const { animals } = useAnimals();
    const linkedAnimal = task.animalId ? animals.find(a => a.id === task.animalId) : null;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700';
            case 'Medium': return 'bg-amber-100 text-amber-700';
            case 'Low': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Health': return 'text-red-500';
            case 'Feeding': return 'text-green-500';
            case 'Reproduction': return 'text-pink-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            className="cursor-grab active:cursor-grabbing transform transition-all hover:-translate-y-1 hover:shadow-md"
        >
            <Card noPadding className="p-3 border-l-4 border-l-transparent hover:border-l-primary-500">
                <div className="flex justify-between items-start mb-2">
                    <span className={clsx("text-[10px] font-bold uppercase tracking-wider", getTypeColor(task.type))}>
                        {task.type}
                    </span>
                    <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", getPriorityColor(task.priority))}>
                        {task.priority}
                    </span>
                </div>

                <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">{task.title}</h4>

                {/* Show linked animal */}
                {linkedAnimal && (
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-slate-50 rounded-lg">
                        <img
                            src={linkedAnimal.photoUrl}
                            alt={linkedAnimal.name}
                            className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs text-slate-600 truncate">{linkedAnimal.name}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{task.date}</span>
                    </div>

                    {assignee ? (
                        <img
                            src={assignee.photoUrl}
                            alt={assignee.name}
                            title={`Assigné à ${assignee.name}`}
                            className="w-6 h-6 rounded-full border border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                            ?
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
