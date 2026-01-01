/**
 * IntegrationService - Gère les intégrations cross-modules
 * 
 * Ce service centralise les actions qui affectent plusieurs modules:
 * - Vente animal → Transaction comptable
 * - Achat inventaire → Transaction comptable
 * - Alerte stock bas → Notification
 * - Tâches en retard → Notification
 */

import { AnimalService } from './AnimalService';
import { TaskService } from './TaskService';
import { AccountingService } from './AccountingService';
import { InventoryService } from './InventoryService';
import { NotificationService } from './NotificationService';

export const IntegrationService = {
    // ============================================
    // VENTE ANIMAL → COMPTABILITÉ
    // ============================================

    /**
     * Enregistre une vente d'animal et crée automatiquement la transaction
     */
    async sellAnimal(
        animalId: string,
        animalName: string,
        animalTagId: string,
        salePrice: number,
        buyerInfo: string,
        userId: string,
        farmId?: string
    ): Promise<{ transactionId: string }> {
        // 1. Mettre à jour le statut de l'animal
        await AnimalService.update(animalId, {
            status: 'Sold',
        });

        // 2. Créer la transaction de vente
        const transactionId = await AccountingService.add({
            farmId,
            date: new Date().toISOString().split('T')[0],
            type: 'Income',
            category: 'Sale',
            amount: salePrice,
            description: `Vente de ${animalName} (${animalTagId}) - Acheteur: ${buyerInfo}`,
            animalId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // 3. Notification
        await NotificationService.create(
            userId,
            'system',
            'Vente enregistrée',
            `${animalName} a été vendu pour ${salePrice.toLocaleString()} FCFA`,
            {
                priority: 'medium',
                actionUrl: `/accounting`,
                actionLabel: 'Voir les transactions',
            }
        );

        return { transactionId };
    },

    // ============================================
    // ACHAT INVENTAIRE → COMPTABILITÉ
    // ============================================

    /**
     * Enregistre un achat d'inventaire et crée automatiquement la transaction
     */
    async purchaseInventoryItem(
        itemName: string,
        itemId: string,
        quantity: number,
        unit: string,
        purchasePrice: number,
        supplier: string,
        category: 'Feed' | 'Medicine' | 'Equipment',
        _userId: string,
        farmId?: string
    ): Promise<{ transactionId: string }> {
        // Mapper la catégorie inventaire vers catégorie transaction
        const categoryMap: Record<string, 'Feed' | 'Health' | 'Infrastructure'> = {
            'Feed': 'Feed',
            'Medicine': 'Health',
            'Equipment': 'Infrastructure',
        };

        // Créer la transaction d'achat
        const transactionId = await AccountingService.add({
            farmId,
            date: new Date().toISOString().split('T')[0],
            type: 'Expense',
            category: categoryMap[category] || 'Other',
            amount: purchasePrice,
            description: `Achat ${itemName} (${quantity} ${unit}) - Fournisseur: ${supplier}`,
            inventoryItemId: itemId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return { transactionId };
    },

    // ============================================
    // CRÉER TÂCHE DE SUIVI
    // ============================================

    /**
     * Crée une tâche de suivi pour un animal
     */
    async createFollowUpTask(
        title: string,
        description: string,
        date: string,
        animalId: string,
        farmId?: string
    ): Promise<void> {
        await TaskService.add({
            farmId,
            title,
            date,
            status: 'Todo',
            priority: 'High',
            type: 'Health',
            description,
            animalId,
        });
    },

    // ============================================
    // ALERTE STOCK BAS → NOTIFICATION
    // ============================================

    /**
     * Vérifie les stocks bas et crée des notifications
     */
    async checkLowStockAndNotify(
        userId: string,
        farmId?: string
    ): Promise<number> {
        const inventory = await InventoryService.getAll(farmId);
        const lowStockItems = inventory.filter(
            item => item.quantity <= item.minThreshold
        );

        for (const item of lowStockItems) {
            await NotificationService.notifyLowStock(
                userId,
                item.id,
                item.name,
                item.quantity,
                item.unit
            );
        }

        return lowStockItems.length;
    },

    // ============================================
    // TÂCHES EN RETARD → NOTIFICATION
    // ============================================

    /**
     * Vérifie les tâches en retard et crée des notifications
     */
    async checkOverdueTasksAndNotify(
        userId: string,
        farmId?: string
    ): Promise<number> {
        const tasks = await TaskService.getAll(farmId);
        const today = new Date().toISOString().split('T')[0];

        const overdueTasks = tasks.filter(
            task => task.status !== 'Done' &&
                task.date < today
        );

        for (const task of overdueTasks) {
            await NotificationService.notifyTaskOverdue(userId, task.id, task.title);
        }

        return overdueTasks.length;
    },

    // ============================================
    // STATISTIQUES MENSUELLES
    // ============================================

    /**
     * Calcule les statistiques mensuelles
     */
    async getMonthlyStats(
        month: string, // YYYY-MM
        farmId?: string
    ): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netProfit: number;
        completedTasks: number;
        pendingTasks: number;
    }> {
        const [year, monthNum] = month.split('-');
        const monthStart = `${month}-01`;
        const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

        // Transactions du mois
        const transactions = await AccountingService.getByDateRange(monthStart, monthEnd);
        const filteredTransactions = farmId
            ? transactions.filter(t => !t.farmId || t.farmId === farmId)
            : transactions;

        const totalIncome = filteredTransactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filteredTransactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Tasks for the month
        const tasks = await TaskService.getAll(farmId);
        const monthTasks = tasks.filter(
            t => t.date >= monthStart &&
                t.date <= monthEnd
        );

        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            completedTasks: monthTasks.filter(t => t.status === 'Done').length,
            pendingTasks: monthTasks.filter(t => t.status !== 'Done').length,
        };
    },
};
