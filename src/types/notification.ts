// Types de notifications
export type NotificationType =
    | 'task_reminder'
    | 'task_overdue'
    | 'vaccination_due'
    | 'heat_prediction'
    | 'low_stock'
    | 'consultation_scheduled'
    | 'animal_birthday'
    | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AppNotification {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    relatedEntityId?: string; // ID of related animal, task, etc.
    relatedEntityType?: 'animal' | 'task' | 'inventory' | 'consultation';
    read: boolean;
    dismissed: boolean;
    createdAt: string;
    expiresAt?: string;
}

export interface NotificationPreferences {
    enabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    categories: {
        tasks: boolean;
        health: boolean;
        reproduction: boolean;
        inventory: boolean;
        system: boolean;
    };
    quietHours: {
        enabled: boolean;
        start: string; // HH:mm
        end: string;   // HH:mm
    };
}

export const defaultNotificationPreferences: NotificationPreferences = {
    enabled: true,
    pushEnabled: true,
    emailEnabled: false,
    categories: {
        tasks: true,
        health: true,
        reproduction: true,
        inventory: true,
        system: true,
    },
    quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
    },
};
