import { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../context/FarmContext';
import { InventoryService } from '../services/InventoryService';
import type { InventoryItem } from '../types';

export const useInventory = () => {
    const { currentFarm } = useFarm();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInventory = useCallback(async () => {
        if (!currentFarm?.id) {
            setInventory([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const items = await InventoryService.getAll(currentFarm.id);
            setInventory(items);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching inventory:', err);
            setError(err.message || 'Erreur lors du chargement de l\'inventaire');
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const addItem = async (item: Omit<InventoryItem, 'id'>) => {
        await InventoryService.add({ ...item, farmId: currentFarm?.id });
        await fetchInventory();
    };

    const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
        await InventoryService.update(id, updates);
        await fetchInventory();
    };

    const deleteItem = async (id: string) => {
        await InventoryService.delete(id);
        await fetchInventory();
    };

    const adjustQuantity = async (id: string, delta: number) => {
        await InventoryService.adjustQuantity(id, delta);
        await fetchInventory();
    };

    // Get low stock items (quantity <= minThreshold)
    const lowStockItems = inventory.filter(item => item.quantity <= item.minThreshold);

    return {
        inventory,
        lowStockItems,
        loading,
        error,
        refreshInventory: fetchInventory,
        addItem,
        updateItem,
        deleteItem,
        adjustQuantity
    };
};
