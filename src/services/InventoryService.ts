import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { InventoryItem } from '../types';

const COLLECTION_NAME = 'inventory';

export const InventoryService = {
    // Get all inventory items
    async getAll(): Promise<InventoryItem[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
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
    }
};
