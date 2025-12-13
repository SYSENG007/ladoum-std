/**
 * ExportService - Génère des exports PDF et Excel
 * 
 * Utilise les données brutes et les formate pour l'export
 * Note: Pour les PDF, on utilise une solution sans dépendance externe (HTML to PDF)
 * Pour Excel, on génère du CSV qui peut être ouvert dans Excel
 */

import type { Animal, Task, Transaction, InventoryItem } from '../types';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportOptions {
    filename: string;
    title?: string;
    dateRange?: { start: string; end: string };
    columns?: string[];
}

export const ExportService = {
    // ============================================
    // HELPERS
    // ============================================

    /**
     * Convertit un tableau d'objets en CSV
     */
    toCSV<T extends Record<string, any>>(
        data: T[],
        columns: Array<{ key: keyof T; label: string }>
    ): string {
        if (data.length === 0) return '';

        // En-têtes
        const headers = columns.map(col => `"${col.label}"`).join(',');

        // Lignes
        const rows = data.map(item =>
            columns.map(col => {
                const value = item[col.key];
                if (value === null || value === undefined) return '""';
                if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
                return `"${value}"`;
            }).join(',')
        );

        return [headers, ...rows].join('\n');
    },

    /**
     * Télécharge un fichier
     */
    downloadFile(content: string, filename: string, mimeType: string): void {
        const blob = new Blob(['\ufeff' + content], { type: mimeType }); // BOM for Excel UTF-8
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Formate une date pour l'affichage
     */
    formatDate(dateString: string): string {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    },

    /**
     * Formate un montant en FCFA
     */
    formatCurrency(amount: number): string {
        return `${amount.toLocaleString('fr-FR')} FCFA`;
    },

    // ============================================
    // EXPORTS ANIMAUX
    // ============================================

    exportAnimalsCSV(animals: Animal[], options: ExportOptions = { filename: 'animaux' }): void {
        const columns = [
            { key: 'tagId' as const, label: 'N° Tag' },
            { key: 'name' as const, label: 'Nom' },
            { key: 'breed' as const, label: 'Race' },
            { key: 'gender' as const, label: 'Sexe' },
            { key: 'birthDate' as const, label: 'Date de naissance' },
            { key: 'status' as const, label: 'Statut' },
            { key: 'weight' as const, label: 'Poids (kg)' },
            { key: 'height' as const, label: 'Hauteur (cm)' },
            { key: 'length' as const, label: 'Longueur (cm)' },
            { key: 'chestGirth' as const, label: 'Tour poitrine (cm)' },
        ];

        const formattedData = animals.map(a => ({
            ...a,
            gender: a.gender === 'Male' ? 'Mâle' : 'Femelle',
            birthDate: this.formatDate(a.birthDate),
            status: a.status === 'Active' ? 'Actif' : a.status === 'Sold' ? 'Vendu' : 'Décédé',
        }));

        const csv = this.toCSV(formattedData, columns);
        this.downloadFile(csv, `${options.filename}.csv`, 'text/csv;charset=utf-8');
    },

    // ============================================
    // EXPORTS TÂCHES
    // ============================================

    exportTasksCSV(tasks: Task[], options: ExportOptions = { filename: 'taches' }): void {
        const columns = [
            { key: 'title' as const, label: 'Titre' },
            { key: 'date' as const, label: 'Date' },
            { key: 'type' as const, label: 'Type' },
            { key: 'priority' as const, label: 'Priorité' },
            { key: 'status' as const, label: 'Statut' },
            { key: 'description' as const, label: 'Description' },
        ];

        const typeLabels: Record<string, string> = {
            'Health': 'Santé',
            'Feeding': 'Alimentation',
            'Reproduction': 'Reproduction',
            'General': 'Général',
        };

        const priorityLabels: Record<string, string> = {
            'High': 'Haute',
            'Medium': 'Moyenne',
            'Low': 'Basse',
        };

        const statusLabels: Record<string, string> = {
            'Todo': 'À faire',
            'In Progress': 'En cours',
            'Done': 'Terminé',
        };

        const formattedData = tasks.map(t => ({
            ...t,
            date: this.formatDate(t.date),
            type: typeLabels[t.type] || t.type,
            priority: priorityLabels[t.priority] || t.priority,
            status: statusLabels[t.status] || t.status,
        }));

        const csv = this.toCSV(formattedData, columns);
        this.downloadFile(csv, `${options.filename}.csv`, 'text/csv;charset=utf-8');
    },

    // ============================================
    // EXPORTS TRANSACTIONS
    // ============================================

    exportTransactionsCSV(transactions: Transaction[], options: ExportOptions = { filename: 'transactions' }): void {
        const columns = [
            { key: 'date' as const, label: 'Date' },
            { key: 'type' as const, label: 'Type' },
            { key: 'category' as const, label: 'Catégorie' },
            { key: 'amount' as const, label: 'Montant (FCFA)' },
            { key: 'description' as const, label: 'Description' },
        ];

        const typeLabels: Record<string, string> = {
            'Sale': 'Vente',
            'Purchase': 'Achat',
            'Expense': 'Dépense',
            'Income': 'Revenu',
        };

        const categoryLabels: Record<string, string> = {
            'Animal': 'Animal',
            'Feed': 'Alimentation',
            'Veterinary': 'Vétérinaire',
            'Equipment': 'Équipement',
            'Labor': 'Main d\'œuvre',
            'Other': 'Autre',
        };

        const formattedData = transactions.map(t => ({
            ...t,
            date: this.formatDate(t.date),
            type: typeLabels[t.type] || t.type,
            category: categoryLabels[t.category] || t.category,
        }));

        const csv = this.toCSV(formattedData, columns);
        this.downloadFile(csv, `${options.filename}.csv`, 'text/csv;charset=utf-8');
    },

    // ============================================
    // EXPORTS INVENTAIRE
    // ============================================

    exportInventoryCSV(items: InventoryItem[], options: ExportOptions = { filename: 'inventaire' }): void {
        const columns = [
            { key: 'name' as const, label: 'Article' },
            { key: 'category' as const, label: 'Catégorie' },
            { key: 'quantity' as const, label: 'Quantité' },
            { key: 'unit' as const, label: 'Unité' },
            { key: 'minThreshold' as const, label: 'Seuil min' },
        ];

        const categoryLabels: Record<string, string> = {
            'Feed': 'Alimentation',
            'Medicine': 'Médicament',
            'Equipment': 'Équipement',
        };

        const formattedData = items.map(i => ({
            ...i,
            category: categoryLabels[i.category] || i.category,
        }));

        const csv = this.toCSV(formattedData, columns);
        this.downloadFile(csv, `${options.filename}.csv`, 'text/csv;charset=utf-8');
    },

    // ============================================
    // RAPPORT MENSUEL
    // ============================================

    generateMonthlyReportCSV(
        animals: Animal[],
        tasks: Task[],
        transactions: Transaction[],
        month: string, // YYYY-MM
        options: ExportOptions = { filename: 'rapport_mensuel' }
    ): void {
        const [year, monthNum] = month.split('-');
        const monthStart = `${month}-01`;
        const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

        // Filtrer les données du mois
        const monthTasks = tasks.filter(t => t.date >= monthStart && t.date <= monthEnd);
        const monthTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);

        // Statistiques
        const totalIncome = monthTransactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = monthTransactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const completedTasks = monthTasks.filter(t => t.status === 'Done').length;
        const pendingTasks = monthTasks.filter(t => t.status !== 'Done').length;

        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        // Générer le rapport
        let report = '';
        report += `RAPPORT MENSUEL - ${monthNames[parseInt(monthNum) - 1]} ${year}\n`;
        report += '='.repeat(50) + '\n\n';

        report += 'RÉSUMÉ FINANCIER\n';
        report += '-'.repeat(30) + '\n';
        report += `Revenus totaux: ${this.formatCurrency(totalIncome)}\n`;
        report += `Dépenses totales: ${this.formatCurrency(totalExpenses)}\n`;
        report += `Bénéfice net: ${this.formatCurrency(totalIncome - totalExpenses)}\n\n`;

        report += 'RÉSUMÉ DES TÂCHES\n';
        report += '-'.repeat(30) + '\n';
        report += `Tâches terminées: ${completedTasks}\n`;
        report += `Tâches en attente: ${pendingTasks}\n\n`;

        report += 'STATISTIQUES DU CHEPTEL\n';
        report += '-'.repeat(30) + '\n';
        report += `Animaux actifs: ${animals.filter(a => a.status === 'Active').length}\n`;
        report += `Animaux vendus ce mois: ${animals.filter(a => a.status === 'Sold').length}\n\n`;

        report += 'DÉTAIL DES TRANSACTIONS\n';
        report += '-'.repeat(30) + '\n';
        monthTransactions.forEach(t => {
            report += `${this.formatDate(t.date)} | ${t.type} | ${this.formatCurrency(t.amount)} | ${t.description}\n`;
        });

        this.downloadFile(report, `${options.filename}_${month}.txt`, 'text/plain;charset=utf-8');
    },
};
