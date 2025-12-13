import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppNotification, NotificationType, NotificationPriority } from '../types/notification';

const COLLECTION_NAME = 'notifications';

export const NotificationService = {
    /**
     * Récupérer les notifications d'un utilisateur
     */
    async getByUserId(userId: string, limitCount: number = 50): Promise<AppNotification[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('dismissed', '==', false),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as AppNotification));
    },

    /**
     * Récupérer les notifications non lues
     */
    async getUnreadCount(userId: string): Promise<number> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('read', '==', false),
            where('dismissed', '==', false)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    },

    /**
     * Créer une nouvelle notification
     */
    async create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        options: {
            priority?: NotificationPriority;
            actionUrl?: string;
            actionLabel?: string;
            relatedEntityId?: string;
            relatedEntityType?: 'animal' | 'task' | 'inventory' | 'consultation';
            expiresAt?: string;
        } = {}
    ): Promise<AppNotification> {
        const notification = {
            userId,
            type,
            priority: options.priority || 'medium',
            title,
            message,
            actionUrl: options.actionUrl,
            actionLabel: options.actionLabel,
            relatedEntityId: options.relatedEntityId,
            relatedEntityType: options.relatedEntityType,
            read: false,
            dismissed: false,
            createdAt: new Date().toISOString(),
            expiresAt: options.expiresAt,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), notification);
        return { id: docRef.id, ...notification } as AppNotification;
    },

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(notificationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, { read: true });
    },

    /**
     * Marquer toutes les notifications comme lues
     */
    async markAllAsRead(userId: string): Promise<void> {
        const notifications = await this.getByUserId(userId);
        const unread = notifications.filter(n => !n.read);

        await Promise.all(
            unread.map(n => this.markAsRead(n.id))
        );
    },

    /**
     * Rejeter une notification
     */
    async dismiss(notificationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, { dismissed: true });
    },

    /**
     * Supprimer une notification
     */
    async delete(notificationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await deleteDoc(docRef);
    },

    /**
     * Nettoyer les notifications expirées
     */
    async cleanupExpired(userId: string): Promise<number> {
        const now = new Date().toISOString();
        const notifications = await this.getByUserId(userId, 200);

        const expired = notifications.filter(n =>
            n.expiresAt && n.expiresAt < now
        );

        await Promise.all(
            expired.map(n => this.dismiss(n.id))
        );

        return expired.length;
    },

    // ============================================
    // Helpers pour créer des notifications spécifiques
    // ============================================

    /**
     * Notification de tâche en retard
     */
    async notifyTaskOverdue(
        userId: string,
        taskId: string,
        taskTitle: string
    ): Promise<AppNotification> {
        return this.create(userId, 'task_overdue', 'Tâche en retard',
            `La tâche "${taskTitle}" est en retard`,
            {
                priority: 'high',
                actionUrl: `/tasks`,
                actionLabel: 'Voir la tâche',
                relatedEntityId: taskId,
                relatedEntityType: 'task',
            }
        );
    },

    /**
     * Notification de rappel de vaccination
     */
    async notifyVaccinationDue(
        userId: string,
        animalId: string,
        animalName: string
    ): Promise<AppNotification> {
        return this.create(userId, 'vaccination_due', 'Vaccination à prévoir',
            `${animalName} doit être vacciné(e) prochainement`,
            {
                priority: 'medium',
                actionUrl: `/herd/${animalId}`,
                actionLabel: 'Voir l\'animal',
                relatedEntityId: animalId,
                relatedEntityType: 'animal',
            }
        );
    },

    /**
     * Notification de prédiction de chaleurs
     */
    async notifyHeatPrediction(
        userId: string,
        animalId: string,
        animalName: string,
        predictedDate: string
    ): Promise<AppNotification> {
        return this.create(userId, 'heat_prediction', 'Chaleurs prévues',
            `${animalName} devrait entrer en chaleurs vers le ${new Date(predictedDate).toLocaleDateString('fr-FR')}`,
            {
                priority: 'medium',
                actionUrl: `/herd/${animalId}`,
                actionLabel: 'Voir l\'animal',
                relatedEntityId: animalId,
                relatedEntityType: 'animal',
            }
        );
    },

    /**
     * Notification de stock faible
     */
    async notifyLowStock(
        userId: string,
        itemId: string,
        itemName: string,
        quantity: number,
        unit: string
    ): Promise<AppNotification> {
        return this.create(userId, 'low_stock', 'Stock faible',
            `${itemName} : seulement ${quantity} ${unit} restant(s)`,
            {
                priority: 'high',
                actionUrl: `/inventory`,
                actionLabel: 'Voir l\'inventaire',
                relatedEntityId: itemId,
                relatedEntityType: 'inventory',
            }
        );
    },

    /**
     * Notification de consultation planifiée
     */
    async notifyConsultationScheduled(
        userId: string,
        consultationId: string,
        vetName: string,
        date: string,
        time: string
    ): Promise<AppNotification> {
        return this.create(userId, 'consultation_scheduled', 'Consultation planifiée',
            `Rendez-vous avec Dr. ${vetName} le ${new Date(date).toLocaleDateString('fr-FR')} à ${time}`,
            {
                priority: 'medium',
                actionUrl: `/teleconsultation/${consultationId}`,
                actionLabel: 'Voir le rendez-vous',
                relatedEntityId: consultationId,
                relatedEntityType: 'consultation',
            }
        );
    },
};
