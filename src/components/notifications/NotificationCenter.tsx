import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    X,
    CheckCheck,
    Calendar,
    Package,
    Heart,
    Stethoscope,
    Info
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { AppNotification, NotificationType } from '../../types/notification';
import clsx from 'clsx';

export const NotificationCenter: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        dismiss
    } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'task_reminder':
            case 'task_overdue':
                return <Calendar className="w-5 h-5" />;
            case 'vaccination_due':
            case 'heat_prediction':
                return <Heart className="w-5 h-5" />;
            case 'low_stock':
                return <Package className="w-5 h-5" />;
            case 'consultation_scheduled':
                return <Stethoscope className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getNotificationColor = (type: NotificationType, priority: string) => {
        if (priority === 'urgent' || priority === 'high') {
            return 'bg-red-100 text-red-600';
        }

        switch (type) {
            case 'task_overdue':
                return 'bg-red-100 text-red-600';
            case 'low_stock':
                return 'bg-amber-100 text-amber-600';
            case 'heat_prediction':
            case 'vaccination_due':
                return 'bg-blue-100 text-blue-600';
            case 'consultation_scheduled':
                return 'bg-emerald-100 text-emerald-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setIsOpen(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <p className="text-xs text-slate-500">
                                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Tout lire
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Aucune notification</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={clsx(
                                                "p-4 hover:bg-slate-50 transition-colors cursor-pointer",
                                                !notification.read && "bg-emerald-50/50"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={clsx(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                    getNotificationColor(notification.type, notification.priority)
                                                )}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                <div
                                                    className="flex-1 min-w-0"
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <p className={clsx(
                                                        "text-sm mb-1",
                                                        notification.read ? "text-slate-600" : "font-medium text-slate-900"
                                                    )}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dismiss(notification.id);
                                                    }}
                                                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                                                >
                                                    <X className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </div>

                                            {notification.actionLabel && (
                                                <button
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className="mt-2 ml-13 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                                                >
                                                    {notification.actionLabel} →
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3">
                                <button
                                    onClick={() => {
                                        navigate('/profile');
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
                                >
                                    Gérer les notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
