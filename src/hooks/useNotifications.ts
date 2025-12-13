import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/NotificationService';
import type { AppNotification } from '../types/notification';

interface UseNotificationsReturn {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismiss: (notificationId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [notifs, count] = await Promise.all([
                NotificationService.getByUserId(user.uid),
                NotificationService.getUnreadCount(user.uid),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
            setError(null);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Erreur lors du chargement des notifications');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();

        // Rafraîchir les notifications toutes les 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!user) return;

        try {
            await NotificationService.markAllAsRead(user.uid);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    }, [user]);

    const dismiss = useCallback(async (notificationId: string) => {
        try {
            await NotificationService.dismiss(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // Mettre à jour le compteur si la notification était non lue
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error dismissing notification:', err);
        }
    }, [notifications]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        dismiss,
        refresh: fetchNotifications,
    };
};
