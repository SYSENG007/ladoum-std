import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AlertTriangle, Plus, Minus, Syringe, Wheat, Wrench, Package, TrendingDown, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { AddInventoryModal } from '../components/inventory/AddInventoryModal';
import { EditInventoryModal } from '../components/inventory/EditInventoryModal';
import { QuantityDialog } from '../components/ui/QuantityDialog';
import { InventoryService } from '../services/InventoryService';
import { useData } from '../context/DataContext';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/SettingsContext';
import clsx from 'clsx';
import type { InventoryCategory, InventoryItem } from '../types';

export const Inventory: React.FC = () => {
    const { refreshData } = useData();
    const { currentFarm } = useFarm();
    const toast = useToast();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [_loading, setLoading] = useState(true);
    // New state for Quantity Dialog
    const [quantityDialog, setQuantityDialog] = useState<{
        isOpen: boolean;
        item: InventoryItem | null;
        action: 'add' | 'remove';
    }>({ isOpen: false, item: null, action: 'add' });
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
            toast.success(t('common.deletedSuccess') || `"${deleteDialog.itemName}" supprimé avec succès`);
        } catch (err) {
            console.error('Error deleting inventory item:', err);
            toast.error(t('common.deleteError') || 'Erreur lors de la suppression de l\'article.');
        }
    };

    const handleQuickAdjust = (item: InventoryItem, action: 'add' | 'remove') => {
        setQuantityDialog({
            isOpen: true,
            item,
            action
        });
    };

    const handleQuantityConfirm = async (qty: number) => {
        if (!quantityDialog.item) return;

        const delta = quantityDialog.action === 'add' ? qty : -qty;

        try {
            await InventoryService.adjustQuantity(quantityDialog.item.id, delta);
            await loadInventory();
            await refreshData();

            const actionLabel = delta > 0 ? t('inventory.addedTo') : t('inventory.removedFrom');
            toast.success(`${qty} ${quantityDialog.item.unit} ${actionLabel} "${quantityDialog.item.name}"`);

            setQuantityDialog({ isOpen: false, item: null, action: 'add' });
        } catch (err) {
            console.error('Error adjusting quantity:', err);
            toast.error(t('common.error') || 'Erreur lors de la mise à jour du stock.');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Medicine': return <Syringe className="w-5 h-5 text-primary-500" />;
            case 'Feed': return <Wheat className="w-5 h-5 text-amber-500" />;
            default: return <Wrench className="w-5 h-5 text-slate-500" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'Medicine': return t('inventory.category.medicine');
            case 'Feed': return t('inventory.category.feed');
            case 'Equipment': return t('inventory.category.equipment');
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
        { value: 'all', label: t('inventory.all') === 'inventory.all' ? 'Tout' : t('inventory.all'), icon: <Package className="w-4 h-4" /> },
        { value: 'Feed', label: t('inventory.category.feed'), icon: <Wheat className="w-4 h-4" /> },
        { value: 'Medicine', label: t('inventory.category.medicine'), icon: <Syringe className="w-4 h-4" /> },
        { value: 'Equipment', label: t('inventory.category.equipment'), icon: <Wrench className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('page.inventory')}</h1>
                    <p className="text-slate-500">{t('inventory.subtitle')}</p>
                </div>
                <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>{t('inventory.add')}</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary-100 rounded-lg">
                            <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('inventory.totalItems')}</p>
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
                            <p className="text-sm text-slate-500">{t('inventory.lowStock')}</p>
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
                            <p className="text-sm text-slate-500">{t('inventory.totalValue')}</p>
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
                            <h3 className="font-bold text-red-900 mb-1">{t('inventory.lowStockAlert')}</h3>
                            <p className="text-sm text-red-700 mb-3">
                                {lowStockItems.length} {t('inventory.restockMessage')}
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
                        placeholder={t('common.search') + "..."}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                selectedCategory === cat.value
                                    ? "bg-primary-700 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory List */}
            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.length > 0 ? (
                    filteredInventory.map(item => (
                        <Card key={item.id} className="group relative hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 line-clamp-1" title={item.name}>{item.name}</h3>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                            {getCategoryLabel(item.category)}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {activeMenu === item.id && (
                                        <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setActiveMenu(null);
                                                }}
                                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleDelete(item.id, item.name);
                                                    setActiveMenu(null);
                                                }}
                                                className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-end gap-1">
                                    <span className={clsx("text-2xl font-bold", item.quantity <= item.minThreshold ? "text-red-600" : "text-slate-900")}>
                                        {item.quantity}
                                    </span>
                                    <span className="text-sm text-slate-500 font-medium mb-1">{item.unit}</span>
                                </div>

                                {item.quantity <= item.minThreshold && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="font-medium">Stock bas (Min: {item.minThreshold})</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleQuickAdjust(item, 'remove')}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                                        title={t('inventory.removeStock')}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleQuickAdjust(item, 'add')}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all"
                                        title={t('inventory.addStock')}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Package className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                        <p>{t('inventory.noItems')}</p>
                    </div>
                )}
            </div>

            <AddInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />

            {editingItem && (
                <EditInventoryModal
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    item={editingItem}
                    onSuccess={handleAddSuccess}
                />
            )}

            {/* Quantity Dialog */}
            <QuantityDialog
                isOpen={quantityDialog.isOpen}
                title={quantityDialog.action === 'add' ? t('inventory.addStock') : t('inventory.removeStock')}
                message={quantityDialog.action === 'add'
                    ? `Combien de ${quantityDialog.item?.unit} voulez-vous ajouter à "${quantityDialog.item?.name}" ?`
                    : `Combien de ${quantityDialog.item?.unit} voulez-vous retirer de "${quantityDialog.item?.name}" ?`
                }
                unit={quantityDialog.item?.unit}
                initialQuantity={1}
                action={quantityDialog.action}
                onConfirm={handleQuantityConfirm}
                onCancel={() => setQuantityDialog({ ...quantityDialog, isOpen: false })}
                confirmText={quantityDialog.action === 'add' ? 'Ajouter' : 'Retirer'}
            />

            {/* Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onCancel={() => setDeleteDialog({ isOpen: false, itemId: '', itemName: '' })}
                onConfirm={confirmDelete}
                title={t('common.delete')}
                message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.itemName}" ?`}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
            />
        </div>
    );
};
