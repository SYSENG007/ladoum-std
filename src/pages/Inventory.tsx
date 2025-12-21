import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AlertTriangle, Plus, Minus, Syringe, Wheat, Wrench, Package, TrendingDown, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { AddInventoryModal } from '../components/inventory/AddInventoryModal';
import { EditInventoryModal } from '../components/inventory/EditInventoryModal';
import { InventoryService } from '../services/InventoryService';
import { useData } from '../context/DataContext';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';
import type { InventoryCategory, InventoryItem } from '../types';

export const Inventory: React.FC = () => {
    const { refreshData } = useData();
    const { currentFarm } = useFarm();
    const toast = useToast();
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [_loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        item: InventoryItem | null;
        action: 'add' | 'remove' | null;
        quantity: number;
    }>({ isOpen: false, item: null, action: null, quantity: 1 });
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        itemId: string;
        itemName: string;
    }>({ isOpen: false, itemId: '', itemName: '' });

    // Load inventory data when farm changes
    React.useEffect(() => {
        loadInventory();
    }, [currentFarm?.id]);

    const loadInventory = async () => {
        try {
            const data = await InventoryService.getAll(currentFarm?.id);
            setInventory(data);
        } catch (err) {
            console.error('Error loading inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSuccess = async () => {
        await loadInventory();
        await refreshData();
    };

    const handleDelete = (itemId: string, itemName: string) => {
        setDeleteDialog({ isOpen: true, itemId, itemName });
    };

    const confirmDelete = async () => {
        try {
            await InventoryService.delete(deleteDialog.itemId);
            await loadInventory();
            await refreshData();
            setDeleteDialog({ isOpen: false, itemId: '', itemName: '' });
            toast.success(`"${deleteDialog.itemName}" supprimé avec succès`);
        } catch (err) {
            console.error('Error deleting inventory item:', err);
            toast.error('Erreur lors de la suppression de l\'article.');
        }
    };

    const handleQuickAdjust = (item: InventoryItem, action: 'add' | 'remove') => {
        setConfirmDialog({ isOpen: true, item, action, quantity: 1 });
    };

    const confirmQuickAdjust = async () => {
        if (!confirmDialog.item || !confirmDialog.action) return;

        const delta = confirmDialog.action === 'add' ? confirmDialog.quantity : -confirmDialog.quantity;

        try {
            await InventoryService.adjustQuantity(confirmDialog.item.id, delta);
            await loadInventory();
            await refreshData();
            const action = delta > 0 ? 'ajouté à' : 'retiré de';
            const qty = Math.abs(delta);
            toast.success(`${qty} ${confirmDialog.item.unit} ${action} "${confirmDialog.item.name}"`);
            setConfirmDialog({ isOpen: false, item: null, action: null, quantity: 1 });
        } catch (err) {
            console.error('Error adjusting quantity:', err);
            toast.error('Erreur lors de la mise à jour du stock.');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Medicine': return <Syringe className="w-5 h-5 text-blue-500" />;
            case 'Feed': return <Wheat className="w-5 h-5 text-amber-500" />;
            default: return <Wrench className="w-5 h-5 text-slate-500" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'Medicine': return 'Santé';
            case 'Feed': return 'Alimentation';
            case 'Equipment': return 'Matériel';
            default: return category;
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const lowStockItems = inventory.filter(item => item.quantity <= item.minThreshold);
    const totalValue = inventory.reduce((sum, item) => sum + item.quantity, 0);

    const categories: Array<{ value: InventoryCategory | 'all'; label: string; icon: React.ReactNode }> = [
        { value: 'all', label: 'Tout', icon: <Package className="w-4 h-4" /> },
        { value: 'Feed', label: 'Alimentation', icon: <Wheat className="w-4 h-4" /> },
        { value: 'Medicine', label: 'Santé', icon: <Syringe className="w-4 h-4" /> },
        { value: 'Equipment', label: 'Matériel', icon: <Wrench className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventaire</h1>
                    <p className="text-slate-500">Suivi du stock et du matériel.</p>
                </div>
                <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>Ajouter un article</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Articles</p>
                            <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Stock Faible</p>
                            <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Valeur Totale</p>
                            <p className="text-2xl font-bold text-slate-900">{totalValue}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-red-900 mb-1">Alerte Stock Faible</h3>
                            <p className="text-sm text-red-700 mb-3">
                                {lowStockItems.length} article{lowStockItems.length > 1 ? 's' : ''} nécessite{lowStockItems.length > 1 ? 'nt' : ''} un réapprovisionnement
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {lowStockItems.map(item => (
                                    <Badge key={item.id} variant="error">
                                        {item.name}: {item.quantity} {item.unit}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher un article..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                                selectedCategory === cat.value
                                    ? "bg-primary-100 text-primary-700"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p>Aucun article trouvé</p>
                    </div>
                ) : (
                    filteredInventory.map(item => {
                        const isLowStock = item.quantity <= item.minThreshold;
                        const stockPercentage = (item.quantity / (item.minThreshold * 2)) * 100;

                        return (
                            <Card key={item.id} className={clsx("relative hover:shadow-md transition-shadow group", isLowStock && "border-red-200 shadow-red-50")}>
                                {isLowStock && (
                                    <div className="absolute top-4 right-14 animate-pulse">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                )}

                                {/* Action Menu */}
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                                        className="p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                                    >
                                        <MoreVertical className="w-4 h-4 text-slate-600" />
                                    </button>
                                    {activeMenu === item.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setActiveMenu(null);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleDelete(item.id, item.name);
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

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">{item.name}</h3>
                                        <p className="text-sm text-slate-500 mb-3">{getCategoryLabel(item.category)}</p>

                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className={clsx("text-3xl font-bold", isLowStock ? "text-red-600" : "text-slate-900")}>
                                                {item.quantity}
                                            </span>
                                            <span className="text-sm text-slate-500">{item.unit}</span>
                                        </div>

                                        {/* Stock Level Bar */}
                                        <div className="mb-3">
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx(
                                                        "h-full transition-all",
                                                        isLowStock ? "bg-red-500" : "bg-green-500"
                                                    )}
                                                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Seuil minimum: {item.minThreshold} {item.unit}
                                            </p>
                                        </div>

                                        {/* Quick Adjust Buttons */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <button
                                                onClick={() => handleQuickAdjust(item, 'remove')}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                                                title="Retirer du stock"
                                            >
                                                <Minus className="w-4 h-4" />
                                                <span className="text-sm">Retirer</span>
                                            </button>
                                            <button
                                                onClick={() => handleQuickAdjust(item, 'add')}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors font-medium"
                                                title="Ajouter au stock"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="text-sm">Ajouter</span>
                                            </button>
                                        </div>

                                        {isLowStock && (
                                            <Badge variant="error" className="w-full justify-center">
                                                Réapprovisionnement nécessaire
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <AddInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />

            {editingItem && (
                <EditInventoryModal
                    isOpen={true}
                    onClose={() => setEditingItem(null)}
                    onSuccess={handleAddSuccess}
                    item={editingItem}
                />
            )}

            {/* Custom Stock Adjustment Modal */}
            {confirmDialog.isOpen && confirmDialog.item && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            {confirmDialog.action === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {confirmDialog.action === 'add'
                                ? `Combien de ${confirmDialog.item.unit} voulez-vous ajouter à "${confirmDialog.item.name}" ?`
                                : `Combien de ${confirmDialog.item.unit} voulez-vous retirer de "${confirmDialog.item.name}" ?`}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Quantité
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={confirmDialog.action === 'remove' ? confirmDialog.item.quantity : 9999}
                                value={confirmDialog.quantity}
                                onChange={(e) => setConfirmDialog({
                                    ...confirmDialog,
                                    quantity: Math.max(1, parseInt(e.target.value) || 1)
                                })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-bold"
                                autoFocus
                            />
                            {confirmDialog.action === 'remove' && (
                                <p className="text-xs text-slate-400 mt-1 text-center">
                                    Stock actuel: {confirmDialog.item.quantity} {confirmDialog.item.unit}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setConfirmDialog({ isOpen: false, item: null, action: null, quantity: 1 })}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={confirmQuickAdjust}
                                disabled={confirmDialog.action === 'remove' && confirmDialog.quantity > confirmDialog.item.quantity}
                            >
                                Confirmer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Supprimer l'article"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.itemName}" ?`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, itemId: '', itemName: '' })}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />
        </div>
    );
};

