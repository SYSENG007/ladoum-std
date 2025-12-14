import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
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
    Activity,
    Heart,
    Stethoscope
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
        if (comparison?.type === 'increased') return `Increased from ${period} `;
        if (comparison?.type === 'decreased') return `Decreased from ${period} `;
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


export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { animals } = useAnimals();
    const { tasks } = useTasks();
    const { user, userProfile } = useAuth();

    // Get user initials
    const userInitials = useMemo(() => {
        if (!userProfile?.displayName) return user?.email?.charAt(0).toUpperCase() || 'U';
        const names = userProfile.displayName.split(' ');
        if (names.length >= 2) {
            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
        }
        return userProfile.displayName.charAt(0).toUpperCase();
    }, [userProfile?.displayName, user?.email]);

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

    return (
        <div className="h-full flex flex-col">
            {/* Header - Farm Info + User Profile */}
            <div className="flex items-center justify-between mb-8">
                {/* Left - Farm Logo + Name */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        B
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Ma Bergerie</h1>
                        <p className="text-sm text-slate-500">
                            Planifiez, priorisez et gérez votre élevage avec facilité.
                        </p>
                    </div>
                </div>

                {/* Right - Notifications + User Profile */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <NotificationCenter />

                    {/* User Profile */}
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 hover:bg-white/50 rounded-xl px-3 py-2 transition-colors"
                    >
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                                {userProfile?.displayName || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {userProfile?.role || 'Utilisateur'}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {userInitials}
                        </div>
                    </button>
                </div>
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
                            value={`${stats.certification.percentage}% `}
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
                <div className="w-96 flex-shrink-0">
                    <Card className="h-full flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Bell className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Rappels & Alertes</h3>
                                        <p className="text-sm text-slate-600">Santé, Reproduction et Stock</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-md">
                                    4 Actifs
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* CHALEURS À SURVEILLER */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Chaleurs à surveiller
                                </h4>
                                <div className="space-y-2">
                                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                                    <Heart className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900">Bella</p>
                                                    <p className="text-xs text-pink-600 font-medium">Fenêtre: 19 déc. - 23 déc.</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
                                                Dans 7j
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                                    <Heart className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900">Fatoumata Binetou</p>
                                                    <p className="text-xs text-pink-600 font-medium">Fenêtre: 19 déc. - 23 déc.</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
                                                Dans 7j
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SANTÉ À VENIR */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Santé à venir
                                </h4>
                                <div className="text-center py-8">
                                    <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm italic text-slate-400">Aucun rappel sanitaire.</p>
                                </div>
                            </div>

                            {/* ALERTES STOCK */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Alertes stock
                                </h4>
                                <div className="space-y-2">
                                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900">Aliment Concentré</p>
                                                    <p className="text-xs text-red-600 font-medium">Stock critique: 50 kg (Min: 100)</p>
                                                </div>
                                            </div>
                                            <button className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full hover:bg-emerald-200 transition-colors whitespace-nowrap">
                                                Voir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
