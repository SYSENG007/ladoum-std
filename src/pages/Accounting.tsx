import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    ArrowUpCircle,
    ArrowDownCircle,
    Link as LinkIcon,
    Calendar
} from 'lucide-react';
import { AddTransactionModal } from '../components/accounting/AddTransactionModal';
import { EditTransactionModal } from '../components/accounting/EditTransactionModal';
import { AccountingService } from '../services/AccountingService';
import { useData } from '../context/DataContext';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';
import type { Transaction, TransactionCategory, TransactionType } from '../types';
import { Link } from 'react-router-dom';

export const Accounting: React.FC = () => {
    const { transactions, animals, refreshData } = useData();
    const { currentFarm } = useFarm();
    const toast = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        id: string;
        description: string;
    }>({ isOpen: false, id: '', description: '' });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Category labels and icons
    const getCategoryLabel = (category: TransactionCategory): string => {
        const labels: Record<TransactionCategory, string> = {
            Feed: 'Alimentation',
            Health: 'Santé',
            Reproduction: 'Reproduction',
            Personnel: 'Personnel',
            Infrastructure: 'Infrastructure',
            Sale: 'Vente',
            Purchase: 'Achat d\'animaux',
            Consultation: 'Consultation',
            Marketplace: 'Marketplace',
            Other: 'Divers'
        };
        return labels[category] || category;
    };

    const getCategoryColor = (category: TransactionCategory): string => {
        const colors: Record<TransactionCategory, string> = {
            Feed: 'bg-amber-100 text-amber-700',
            Health: 'bg-blue-100 text-blue-700',
            Reproduction: 'bg-pink-100 text-pink-700',
            Personnel: 'bg-purple-100 text-purple-700',
            Infrastructure: 'bg-slate-100 text-slate-700',
            Sale: 'bg-green-100 text-green-700',
            Purchase: 'bg-orange-100 text-orange-700',
            Consultation: 'bg-teal-100 text-teal-700',
            Marketplace: 'bg-indigo-100 text-indigo-700',
            Other: 'bg-gray-100 text-gray-700'
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
    };

    // Filter transactions by farm first, then by other filters
    const farmTransactions = useMemo(() => {
        if (!currentFarm?.id) return transactions;
        return transactions.filter(t => t.farmId === currentFarm.id || !t.farmId);
    }, [transactions, currentFarm]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return farmTransactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = selectedType === 'all' || t.type === selectedType;
            const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
            const matchesMonth = t.date.startsWith(selectedMonth);
            return matchesSearch && matchesType && matchesCategory && matchesMonth;
        });
    }, [farmTransactions, searchTerm, selectedType, selectedCategory, selectedMonth]);

    // Calculate totals
    const totals = useMemo(() => {
        return AccountingService.calculateTotals(filteredTransactions);
    }, [filteredTransactions]);

    // Get animal name by ID
    const getAnimalName = (animalId?: string): string | null => {
        if (!animalId) return null;
        const animal = animals.find(a => a.id === animalId);
        return animal?.name || null;
    };

    // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('fr-SN', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' FCFA';
    };

    // Format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Handle delete
    const handleDelete = (id: string, description: string) => {
        setDeleteDialog({ isOpen: true, id, description });
    };

    const confirmDelete = async () => {
        try {
            await AccountingService.delete(deleteDialog.id);
            await refreshData();
            setDeleteDialog({ isOpen: false, id: '', description: '' });
            toast.success('Transaction supprimée');
        } catch (err) {
            console.error('Error deleting transaction:', err);
            toast.error('Erreur lors de la suppression de la transaction.');
        }
    };

    // Generate month options for filter
    const monthOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
        }
        return options;
    }, []);

    const categories: TransactionCategory[] = ['Feed', 'Health', 'Reproduction', 'Personnel', 'Infrastructure', 'Sale', 'Purchase', 'Consultation', 'Marketplace', 'Other'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Comptabilité</h1>
                    <p className="text-slate-500">Suivi des revenus et dépenses de la bergerie.</p>
                </div>
                <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>
                    Nouvelle transaction
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500 rounded-xl shadow-lg shadow-green-200">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-medium">Revenus</p>
                            <p className="text-2xl font-bold text-green-800">{formatCurrency(totals.income)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500 rounded-xl shadow-lg shadow-red-200">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-red-700 font-medium">Dépenses</p>
                            <p className="text-2xl font-bold text-red-800">{formatCurrency(totals.expenses)}</p>
                        </div>
                    </div>
                </Card>
                <Card className={clsx(
                    "bg-gradient-to-br border",
                    totals.balance >= 0
                        ? "from-emerald-50 to-emerald-100 border-emerald-200"
                        : "from-orange-50 to-orange-100 border-orange-200"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "p-3 rounded-xl shadow-lg",
                            totals.balance >= 0 ? "bg-emerald-500 shadow-emerald-200" : "bg-orange-500 shadow-orange-200"
                        )}>
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className={clsx(
                                "text-sm font-medium",
                                totals.balance >= 0 ? "text-emerald-700" : "text-orange-700"
                            )}>Solde</p>
                            <p className={clsx(
                                "text-2xl font-bold",
                                totals.balance >= 0 ? "text-emerald-800" : "text-orange-800"
                            )}>{formatCurrency(totals.balance)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher une transaction..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">Tous types</option>
                        <option value="Income">Revenus</option>
                        <option value="Expense">Dépenses</option>
                    </select>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as TransactionCategory | 'all')}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">Toutes catégories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Montant</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Lien</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p>Aucune transaction trouvée</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(transaction => (
                                    <tr key={transaction.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm">{formatDate(transaction.date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                transaction.type === 'Income'
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            )}>
                                                {transaction.type === 'Income' ? (
                                                    <ArrowUpCircle className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ArrowDownCircle className="w-3.5 h-3.5" />
                                                )}
                                                {transaction.type === 'Income' ? 'Revenu' : 'Dépense'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-full text-xs font-medium",
                                                getCategoryColor(transaction.category)
                                            )}>
                                                {getCategoryLabel(transaction.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-slate-900 font-medium">{transaction.description}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            <span className={clsx(
                                                "text-sm font-bold",
                                                transaction.type === 'Income' ? "text-green-600" : "text-red-600"
                                            )}>
                                                {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">
                                            {transaction.animalId && (
                                                <Link
                                                    to={`/herd/${transaction.animalId}`}
                                                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                    {getAnimalName(transaction.animalId) || 'Animal'}
                                                </Link>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === transaction.id ? null : transaction.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-slate-600" />
                                                </button>
                                                {activeMenu === transaction.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTransaction(transaction);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleDelete(transaction.id, transaction.description);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {filteredTransactions.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-sm text-slate-500">
                            {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-4 text-sm">
                            <span className="text-green-600 font-medium">+{formatCurrency(totals.income)}</span>
                            <span className="text-red-600 font-medium">-{formatCurrency(totals.expenses)}</span>
                            <span className={clsx(
                                "font-bold",
                                totals.balance >= 0 ? "text-emerald-600" : "text-orange-600"
                            )}>
                                = {formatCurrency(totals.balance)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={refreshData}
            />

            {editingTransaction && (
                <EditTransactionModal
                    isOpen={true}
                    onClose={() => setEditingTransaction(null)}
                    onSuccess={refreshData}
                    transaction={editingTransaction}
                />
            )}

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Supprimer la transaction"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.description}" ?`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, id: '', description: '' })}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />
        </div>
    );
};
