import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useTasks } from '../hooks/useTasks';
import { Card } from '../components/ui/Card';
import {
    Users,
    CheckSquare,
    Package,
    Award,
    TrendingUp,
    TrendingDown,
    Bell,
    ChevronRight,
    AlertCircle,
    Calendar,
    Activity
} from 'lucide-react';
import clsx from 'clsx';


interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    comparison?: {
        type: 'increased' | 'decreased' | 'neutral';
        period?: string;
    };
    icon: React.ElementType;
    color: 'blue' | 'green' | 'purple' | 'amber';
    onClick?: () => void;
    highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    comparison,
    icon: Icon,
    color,
    onClick,
    highlight
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600',
    };

    const getComparisonIcon = () => {
        if (comparison?.type === 'increased') return TrendingUp;
        if (comparison?.type === 'decreased') return TrendingDown;
        return Activity;
    };

    const getComparisonText = () => {
        const period = comparison?.period || 'last month';
        if (comparison?.type === 'increased') return `Increased from ${period}`;
        if (comparison?.type === 'decreased') return `Decreased from ${period}`;
        return `On Discuss`;
    };

    const ComparisonIcon = getComparisonIcon();

    return (
        <Card
            className={clsx(
                "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg",
                highlight && "ring-2 ring-amber-400 ring-offset-2"
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={clsx(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    colorClasses[color]
                )}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>

            {comparison && (
                <div className="flex items-center gap-2">
                    <div className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        comparison.type === 'increased' && "bg-emerald-100",
                        comparison.type === 'decreased' && "bg-red-100",
                        comparison.type === 'neutral' && "bg-slate-100"
                    )}>
                        <ComparisonIcon className={clsx(
                            "w-3.5 h-3.5",
                            comparison.type === 'increased' && "text-emerald-600",
                            comparison.type === 'decreased' && "text-red-600",
                            comparison.type === 'neutral' && "text-slate-600"
                        )} />
                    </div>
                    <span className="text-xs text-slate-500">
                        {getComparisonText()}
                    </span>
                </div>
            )}

            {subtitle && !comparison && (
                <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
            )}
        </Card>
    );
};

interface ReminderItem {
    id: string;
    type: 'task' | 'alert' | 'event';
    title: string;
    description: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
}

const ReminderCard: React.FC<{ reminder: ReminderItem }> = ({ reminder }) => {
    const priorityColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        low: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const icons = {
        task: CheckSquare,
        alert: AlertCircle,
        event: Calendar,
    };

    const Icon = icons[reminder.type];

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <div className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center border",
                priorityColors[reminder.priority]
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{reminder.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{reminder.description}</p>
                <p className="text-xs text-slate-400 mt-1">{reminder.time}</p>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { animals } = useAnimals();
    const { tasks } = useTasks();

    // Calculate statistics
    const stats = useMemo(() => {
        const totalAnimals = animals.length;
        const activeAnimals = animals.filter(a => a.status === 'Active').length;
        const certifiedAnimals = animals.filter(a => a.certification).length;

        const totalTasks = tasks.length;
        const pendingTasks = tasks.filter(t => t.status === 'Todo' || t.status === 'In Progress').length;
        const completedTasks = tasks.filter(t => t.status === 'Done').length;

        // Mock inventory data for now
        const totalItems = 0;
        const lowStockItems = 0;

        return {
            animals: {
                total: totalAnimals,
                active: activeAnimals,
                certified: certifiedAnimals,
                trend: totalAnimals > 0 ? '+12%' : '0%',
            },
            tasks: {
                total: totalTasks,
                pending: pendingTasks,
                completed: completedTasks,
                trend: pendingTasks > 0 ? `${pendingTasks} en attente` : 'Tout complété',
            },
            inventory: {
                total: totalItems,
                lowStock: lowStockItems,
                trend: lowStockItems > 0 ? `${lowStockItems} en rupture` : 'Stock OK',
            },
            certification: {
                total: certifiedAnimals,
                percentage: totalAnimals > 0 ? Math.round((certifiedAnimals / totalAnimals) * 100) : 0,
                trend: certifiedAnimals > 0 ? '+5%' : '0%',
            }
        };
    }, [animals, tasks]);

    // Mock reminders - À remplacer par de vraies données
    const reminders: ReminderItem[] = [
        {
            id: '1',
            type: 'task',
            title: 'Vaccination du troupeau',
            description: 'Vacciner les 15 nouveaux agneaux',
            time: 'Aujourd\'hui, 14:00',
            priority: 'high',
        },
        {
            id: '2',
            type: 'alert',
            title: 'Stock faible: Aliment',
            description: 'Il reste seulement 2 sacs',
            time: 'Urgent',
            priority: 'high',
        },
        {
            id: '3',
            type: 'event',
            title: 'Visite vétérinaire',
            description: 'Contrôle sanitaire annuel',
            time: 'Demain, 10:00',
            priority: 'medium',
        },
        {
            id: '4',
            type: 'task',
            title: 'Nettoyage des enclos',
            description: 'Sections A et B',
            time: 'Dans 2 jours',
            priority: 'low',
        },
        {
            id: '5',
            type: 'alert',
            title: 'Chaleur détectée',
            description: 'Brebis #A123 en période de chaleur',
            time: 'Il y a 2h',
            priority: 'medium',
        },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">
                    Planifiez, priorisez et gérez votre élevage avec facilité.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Side - Stats Cards */}
                <div className="flex-1 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Troupeau */}
                        <StatCard
                            title="Troupeau"
                            value={stats.animals.total}
                            comparison={{
                                type: 'increased',
                                period: 'last month'
                            }}
                            icon={Users}
                            color="blue"
                            onClick={() => navigate('/herd')}
                        />

                        {/* Tâches */}
                        <StatCard
                            title="Tâches"
                            value={stats.tasks.pending}
                            comparison={{
                                type: stats.tasks.pending === 0 ? 'neutral' : 'increased',
                                period: 'last week'
                            }}
                            icon={CheckSquare}
                            color="green"
                            onClick={() => navigate('/tasks')}
                        />

                        {/* Inventaire */}
                        <StatCard
                            title="Inventaire"
                            value={stats.inventory.total}
                            comparison={{
                                type: stats.inventory.lowStock > 0 ? 'decreased' : 'increased',
                                period: 'last month'
                            }}
                            icon={Package}
                            color="purple"
                            onClick={() => navigate('/inventory')}
                        />

                        {/* Certification */}
                        <StatCard
                            title="Certification"
                            value={`${stats.certification.percentage}%`}
                            comparison={{
                                type: 'increased',
                                period: 'last month'
                            }}
                            icon={Award}
                            color="amber"
                            onClick={() => navigate('/herd')}
                            highlight={true}
                        />
                    </div>

                    {/* Additional content can go here */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Activité Récente</h3>
                            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                                Voir tout
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center py-12 text-slate-400">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Aucune activité récente</p>
                        </div>
                    </Card>
                </div>

                {/* Right Side - Reminders & Alerts */}
                <div className="w-80 flex-shrink-0">
                    <Card className="h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-slate-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Rappels & Alertes</h3>
                                </div>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                    {reminders.filter(r => r.priority === 'high').length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {reminders.map(reminder => (
                                <ReminderCard key={reminder.id} reminder={reminder} />
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100">
                            <button
                                className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1"
                                onClick={() => navigate('/tasks')}
                            >
                                Voir toutes les tâches
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
