import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Animal } from '../types';

const COLLECTION_NAME = 'animals';

export const AnimalService = {
    // Get all animals for a specific farm
    async getAll(farmId: string | undefined): Promise<Animal[]> {
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
        } as Animal));
    },

    // Get active animals (status != Deceased/Sold) for a specific farm
    async getActive(farmId: string | undefined): Promise<Animal[]> {
        if (!farmId) {
            return [];
        }
        const q = query(
            collection(db, COLLECTION_NAME),
            where('farmId', '==', farmId),
            where('status', '==', 'Active'),
            orderBy('name')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Animal));
    },

    // Add a new animal
    async add(animal: Omit<Animal, 'id'>) {
        return addDoc(collection(db, COLLECTION_NAME), animal);
    },

    // Update an animal
    async update(id: string, updates: Partial<Animal>) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return updateDoc(docRef, updates);
    },

    // Delete an animal
    async delete(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return deleteDoc(docRef);
    }
};
