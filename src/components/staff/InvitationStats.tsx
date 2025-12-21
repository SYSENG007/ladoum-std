import React from 'react';
import { Mail, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import type { StaffInvitation } from '../../types/staff';

interface InvitationStatsProps {
    invitations: StaffInvitation[];
}

export const InvitationStats: React.FC<InvitationStatsProps> = ({ invitations }) => {
    // Calculate statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekInvitations = invitations.filter(
        inv => new Date(inv.createdAt) >= oneWeekAgo
    );

    const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
    const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;

    const expiringCountSoon = invitations.filter(inv => {
        if (inv.status !== 'pending') return false;
        const expiryDate = new Date(inv.expiresAt);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 2 && daysUntilExpiry >= 0;
    }).length;

    const conversionRate = invitations.length > 0
        ? Math.round((acceptedCount / invitations.length) * 100)
        : 0;

    const stats = [
        {
            label: 'Cette semaine',
            value: thisWeekInvitations.length,
            subtext: `${thisWeekInvitations.filter(i => i.status === 'accepted').length} acceptées`,
            icon: TrendingUp,
            color: 'emerald',
        },
        {
            label: 'En attente',
            value: pendingCount,
            subtext: pendingCount > 0 ? 'À suivre' : 'Aucune',
            icon: Clock,
            color: 'amber',
        },
        {
            label: 'Taux de conversion',
            value: `${conversionRate}%`,
            subtext: `${acceptedCount}/${invitations.length} total`,
            icon: CheckCircle,
            color: 'blue',
        },
        {
            label: 'Expirent bientôt',
            value: expiringCountSoon,
            subtext: expiringCountSoon > 0 ? '< 2 jours' : 'Aucune',
            icon: Mail,
            color: expiringCountSoon > 0 ? 'red' : 'slate',
        },
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; icon: string; text: string }> = {
            emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-700' },
            amber: { bg: 'bg-amber-100', icon: 'text-amber-600', text: 'text-amber-700' },
            blue: { bg: 'bg-blue-100', icon: 'text-blue-600', text: 'text-blue-700' },
            red: { bg: 'bg-red-100', icon: 'text-red-600', text: 'text-red-700' },
            slate: { bg: 'bg-slate-100', icon: 'text-slate-600', text: 'text-slate-700' },
        };
        return colors[color] || colors.slate;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
                const colors = getColorClasses(stat.color);
                const Icon = stat.icon;

                return (
                    <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                                <p className={`text-xs ${colors.text}`}>{stat.subtext}</p>
                            </div>
                            <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-5 h-5 ${colors.icon}`} />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
