import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { InventoryItem } from '../types';

const COLLECTION_NAME = 'inventory';

export const InventoryService = {
    // Get all inventory items for a specific farm
    async getAll(farmId: string | undefined): Promise<InventoryItem[]> {
        // Return empty array if no farmId provided
        if (!farmId) {
            return [];
        }

        const q = query(
            collection(db, COLLECTION_NAME),
            where('farmId', '==', farmId),
            orderBy('name')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as InventoryItem));
    },

    // Add a new inventory item
    async add(item: Omit<InventoryItem, 'id'>) {
        return addDoc(collection(db, COLLECTION_NAME), item);
    },

    // Update an inventory item
    async update(id: string, updates: Partial<InventoryItem>) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return updateDoc(docRef, updates);
    },

    // Delete an inventory item
    async delete(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return deleteDoc(docRef);
    },

    // Quick adjust quantity (for +/- buttons)
    async adjustQuantity(id: string, delta: number): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Inventory item not found');
        }

        const currentItem = docSnap.data() as InventoryItem;
        const newQuantity = Math.max(0, currentItem.quantity + delta); // Prevent negative quantities

        await updateDoc(docRef, {
            quantity: newQuantity
        });
    }
};
