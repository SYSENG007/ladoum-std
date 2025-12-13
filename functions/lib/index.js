"use strict";
/**
 * Firebase Cloud Functions for Ladoum STD
 *
 * Automated tasks:
 * 1. Vaccination reminders (daily at 8am)
 * 2. Overdue tasks alerts (daily at 9am)
 * 3. Low stock notifications (weekly on Monday at 8am)
 * 4. Monthly report generation (1st of each month at 6am)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHeatPredictions = exports.generateMonthlyReport = exports.checkLowStock = exports.checkOverdueTasks = exports.checkVaccinationReminders = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// ============================================
// HELPER FUNCTIONS
// ============================================
async function createNotification(userId, type, title, message, options = {}) {
    await db.collection('notifications').add({
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
    });
}
async function getFarmOwner(farmId) {
    const farmDoc = await db.collection('farms').doc(farmId).get();
    if (!farmDoc.exists)
        return null;
    return farmDoc.data().ownerId;
}
function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
// ============================================
// 1. VACCINATION REMINDERS (Daily at 8:00 AM Africa/Dakar)
// ============================================
exports.checkVaccinationReminders = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub
    .schedule('0 8 * * *')
    .timeZone('Africa/Dakar')
    .onRun(async (_context) => {
    console.log('Running vaccination reminder check...');
    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    // Get all animals
    const animalsSnapshot = await db.collection('animals').get();
    const notificationsSent = [];
    for (const doc of animalsSnapshot.docs) {
        const animal = { id: doc.id, ...doc.data() };
        if (!animal.healthRecords)
            continue;
        // Check for upcoming vaccinations
        for (const record of animal.healthRecords) {
            if (record.type === 'Vaccination' && record.nextDue) {
                const nextDueDate = new Date(record.nextDue);
                // If vaccination is due within 7 days
                if (nextDueDate <= in7Days && nextDueDate >= today) {
                    const farmId = animal.farmId;
                    if (!farmId)
                        continue;
                    const ownerId = await getFarmOwner(farmId);
                    if (!ownerId)
                        continue;
                    await createNotification(ownerId, 'vaccination_due', 'Vaccination à prévoir', `${animal.name} (${animal.tagId}) doit être vacciné(e) le ${formatDate(nextDueDate)}`, {
                        priority: nextDueDate <= today ? 'high' : 'medium',
                        actionUrl: `/herd/${animal.id}`,
                        actionLabel: "Voir l'animal",
                        relatedEntityId: animal.id,
                        relatedEntityType: 'animal',
                    });
                    notificationsSent.push(animal.name);
                }
            }
        }
    }
    console.log(`Vaccination reminders sent for: ${notificationsSent.join(', ') || 'none'}`);
    return null;
});
// ============================================
// 2. OVERDUE TASKS ALERTS (Daily at 9:00 AM Africa/Dakar)
// ============================================
exports.checkOverdueTasks = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub
    .schedule('0 9 * * *')
    .timeZone('Africa/Dakar')
    .onRun(async (_context) => {
    console.log('Running overdue tasks check...');
    const today = new Date().toISOString().split('T')[0];
    // Get all non-completed tasks before today
    const tasksSnapshot = await db.collection('tasks')
        .where('status', '!=', 'Done')
        .get();
    const overdueTasks = [];
    for (const doc of tasksSnapshot.docs) {
        const task = { id: doc.id, ...doc.data() };
        if (task.date < today) {
            overdueTasks.push(task);
        }
    }
    // Group by farm
    const tasksByFarm = new Map();
    for (const task of overdueTasks) {
        const farmId = task.farmId || 'unknown';
        if (!tasksByFarm.has(farmId)) {
            tasksByFarm.set(farmId, []);
        }
        tasksByFarm.get(farmId).push(task);
    }
    // Send notifications per farm
    for (const [farmId, tasks] of tasksByFarm.entries()) {
        if (farmId === 'unknown')
            continue;
        const ownerId = await getFarmOwner(farmId);
        if (!ownerId)
            continue;
        if (tasks.length === 1) {
            await createNotification(ownerId, 'task_overdue', 'Tâche en retard', `La tâche "${tasks[0].title}" est en retard`, {
                priority: 'high',
                actionUrl: '/tasks',
                actionLabel: 'Voir les tâches',
                relatedEntityId: tasks[0].id,
                relatedEntityType: 'task',
            });
        }
        else {
            await createNotification(ownerId, 'task_overdue', `${tasks.length} tâches en retard`, `Vous avez ${tasks.length} tâches en retard à traiter`, {
                priority: 'high',
                actionUrl: '/tasks',
                actionLabel: 'Voir les tâches',
            });
        }
    }
    console.log(`Overdue task alerts sent for ${overdueTasks.length} tasks`);
    return null;
});
// ============================================
// 3. LOW STOCK NOTIFICATIONS (Weekly on Monday at 8:00 AM)
// ============================================
exports.checkLowStock = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub
    .schedule('0 8 * * 1') // Every Monday at 8am
    .timeZone('Africa/Dakar')
    .onRun(async (_context) => {
    console.log('Running low stock check...');
    const inventorySnapshot = await db.collection('inventory').get();
    const lowStockItems = [];
    for (const doc of inventorySnapshot.docs) {
        const item = { id: doc.id, ...doc.data() };
        if (item.quantity <= item.minThreshold) {
            lowStockItems.push(item);
        }
    }
    // Group by farm
    const itemsByFarm = new Map();
    for (const item of lowStockItems) {
        const farmId = item.farmId || 'unknown';
        if (!itemsByFarm.has(farmId)) {
            itemsByFarm.set(farmId, []);
        }
        itemsByFarm.get(farmId).push(item);
    }
    // Send notifications per farm
    for (const [farmId, items] of itemsByFarm.entries()) {
        if (farmId === 'unknown')
            continue;
        const ownerId = await getFarmOwner(farmId);
        if (!ownerId)
            continue;
        if (items.length === 1) {
            const item = items[0];
            await createNotification(ownerId, 'low_stock', 'Stock faible', `${item.name}: seulement ${item.quantity} ${item.unit} restant(s)`, {
                priority: 'high',
                actionUrl: '/inventory',
                actionLabel: "Voir l'inventaire",
                relatedEntityId: item.id,
                relatedEntityType: 'inventory',
            });
        }
        else {
            await createNotification(ownerId, 'low_stock', `${items.length} articles en stock faible`, `${items.map(i => i.name).join(', ')} sont en dessous du seuil minimum`, {
                priority: 'high',
                actionUrl: '/inventory',
                actionLabel: "Voir l'inventaire",
            });
        }
    }
    console.log(`Low stock alerts sent for ${lowStockItems.length} items`);
    return null;
});
// ============================================
// 4. MONTHLY REPORT GENERATION (1st of each month at 6:00 AM)
// ============================================
exports.generateMonthlyReport = functions
    .runWith({ timeoutSeconds: 300, memory: '512MB' })
    .pubsub
    .schedule('0 6 1 * *') // 1st of each month at 6am
    .timeZone('Africa/Dakar')
    .onRun(async (_context) => {
    console.log('Generating monthly reports...');
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthStart = lastMonth.toISOString().split('T')[0];
    const monthEnd = lastMonthEnd.toISOString().split('T')[0];
    const monthName = lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    // Get all farms
    const farmsSnapshot = await db.collection('farms').get();
    for (const farmDoc of farmsSnapshot.docs) {
        const farm = { id: farmDoc.id, ...farmDoc.data() };
        // Get transactions for this farm
        const transactionsSnapshot = await db.collection('transactions')
            .where('farmId', '==', farm.id)
            .where('date', '>=', monthStart)
            .where('date', '<=', monthEnd)
            .get();
        let totalIncome = 0;
        let totalExpenses = 0;
        for (const doc of transactionsSnapshot.docs) {
            const tx = doc.data();
            if (tx.type === 'Income') {
                totalIncome += tx.amount;
            }
            else {
                totalExpenses += tx.amount;
            }
        }
        // Get tasks for this farm
        const tasksSnapshot = await db.collection('tasks')
            .where('farmId', '==', farm.id)
            .where('date', '>=', monthStart)
            .where('date', '<=', monthEnd)
            .get();
        const completedTasks = tasksSnapshot.docs.filter(d => d.data().status === 'Done').length;
        const totalTasks = tasksSnapshot.size;
        // Get animal count
        const animalsSnapshot = await db.collection('animals')
            .where('farmId', '==', farm.id)
            .where('status', '==', 'Active')
            .get();
        const activeAnimals = animalsSnapshot.size;
        // Store the report
        await db.collection('reports').add({
            farmId: farm.id,
            period: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
            periodLabel: monthName,
            generatedAt: new Date().toISOString(),
            data: {
                totalIncome,
                totalExpenses,
                netProfit: totalIncome - totalExpenses,
                completedTasks,
                totalTasks,
                taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                activeAnimals,
                transactionCount: transactionsSnapshot.size,
            }
        });
        // Notify farm owner
        await createNotification(farm.ownerId, 'system', `Rapport de ${monthName}`, `Revenus: ${totalIncome.toLocaleString()} FCFA | Dépenses: ${totalExpenses.toLocaleString()} FCFA | Bénéfice: ${(totalIncome - totalExpenses).toLocaleString()} FCFA`, {
            priority: 'low',
            actionUrl: '/accounting',
            actionLabel: 'Voir les détails',
        });
    }
    console.log(`Monthly reports generated for ${farmsSnapshot.size} farms`);
    return null;
});
// ============================================
// 5. HEAT CYCLE PREDICTION ALERTS (Daily at 7:00 AM)
// ============================================
exports.checkHeatPredictions = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub
    .schedule('0 7 * * *')
    .timeZone('Africa/Dakar')
    .onRun(async (_context) => {
    console.log('Running heat prediction check...');
    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    // Get all female animals
    const animalsSnapshot = await db.collection('animals')
        .where('gender', '==', 'Female')
        .where('status', '==', 'Active')
        .get();
    let notificationsSent = 0;
    for (const doc of animalsSnapshot.docs) {
        const animal = { id: doc.id, ...doc.data() };
        if (!animal.reproductionRecords || animal.reproductionRecords.length === 0)
            continue;
        // Find last heat record
        const lastHeat = animal.reproductionRecords
            .filter(r => r.type === 'Heat')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (!lastHeat)
            continue;
        // Calculate next expected heat (17 days cycle for sheep)
        const lastHeatDate = new Date(lastHeat.date);
        const nextHeatDate = new Date(lastHeatDate);
        nextHeatDate.setDate(lastHeatDate.getDate() + 17);
        // Check if next heat is within 3 days
        if (nextHeatDate >= today && nextHeatDate <= in3Days) {
            const farmId = animal.farmId;
            if (!farmId)
                continue;
            const ownerId = await getFarmOwner(farmId);
            if (!ownerId)
                continue;
            await createNotification(ownerId, 'heat_prediction', 'Chaleurs prévues', `${animal.name} devrait entrer en chaleurs vers le ${formatDate(nextHeatDate)}`, {
                priority: 'medium',
                actionUrl: `/herd/${animal.id}`,
                actionLabel: "Voir l'animal",
                relatedEntityId: animal.id,
                relatedEntityType: 'animal',
            });
            notificationsSent++;
        }
    }
    console.log(`Heat prediction alerts sent: ${notificationsSent}`);
    return null;
});
//# sourceMappingURL=index.js.map