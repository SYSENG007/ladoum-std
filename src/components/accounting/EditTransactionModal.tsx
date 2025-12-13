import React, { useState } from 'react';
import { X, Save, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { AccountingService } from '../../services/AccountingService';
import { useData } from '../../context/DataContext';
import clsx from 'clsx';
import type { Transaction, TransactionCategory, TransactionType } from '../../types';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void>;
    transaction: Transaction;
}

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
    { value: 'Feed', label: 'Alimentation' },
    { value: 'Health', label: 'Santé' },
    { value: 'Reproduction', label: 'Reproduction' },
    { value: 'Personnel', label: 'Personnel' },
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Sale', label: 'Vente' },
    { value: 'Other', label: 'Divers' }
];

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    transaction
}) => {
    const { animals } = useData();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - initialized with existing transaction data
    const [type, setType] = useState<TransactionType>(transaction.type);
    const [category, setCategory] = useState<TransactionCategory>(transaction.category);
    const [amount, setAmount] = useState<string>(transaction.amount.toString());
    const [description, setDescription] = useState(transaction.description);
    const [date, setDate] = useState(transaction.date.split('T')[0]);
    const [animalId, setAnimalId] = useState(transaction.animalId || '');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!amount || parseFloat(amount) <= 0) {
            setError('Veuillez entrer un montant valide.');
            return;
        }

        if (!description.trim()) {
            setError('Veuillez entrer une description.');
            return;
        }

        setLoading(true);
        try {
            await AccountingService.update(transaction.id, {
                type,
                category,
                amount: parseFloat(amount),
                description: description.trim(),
                date,
                animalId: animalId || undefined
            });
            await onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating transaction:', err);
            setError('Erreur lors de la modification de la transaction.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Modifier la transaction</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('Income')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                                    type === 'Income'
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                                )}
                            >
                                <ArrowUpCircle className="w-5 h-5" />
                                <span className="font-medium">Revenu</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('Expense')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                                    type === 'Expense'
                                        ? "border-red-500 bg-red-50 text-red-700"
                                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                                )}
                            >
                                <ArrowDownCircle className="w-5 h-5" />
                                <span className="font-medium">Dépense</span>
                            </button>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Montant (FCFA)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="100"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Achat de fourrage, Vente de Amadou..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Link to Animal (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Lier à un animal (optionnel)</label>
                        <select
                            value={animalId}
                            onChange={(e) => setAnimalId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            <option value="">Aucun</option>
                            {animals.map(animal => (
                                <option key={animal.id} value={animal.id}>{animal.name} ({animal.tagId})</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            icon={Save}
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
