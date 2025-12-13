import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Listing, ListingCategory, ListingStatus } from '../types';

const COLLECTION_NAME = 'listings';

export const MarketplaceService = {
    // Get all listings, ordered by creation date (newest first)
    async getAll(): Promise<Listing[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    },

    // Get a single listing by ID
    async getById(id: string): Promise<Listing | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Listing;
    },

    // Get listings by category
    async getByCategory(category: ListingCategory): Promise<Listing[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    },

    // Get listings by status
    async getByStatus(status: ListingStatus): Promise<Listing[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Listing));
    },

    // Add a new listing
    async add(listing: Omit<Listing, 'id'>): Promise<string> {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...listing,
            createdAt: now,
            updatedAt: now
        });
        return docRef.id;
    },

    // Update a listing
    async update(id: string, updates: Partial<Listing>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    },

    // Quick status update
    async updateStatus(id: string, status: ListingStatus): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status,
            updatedAt: new Date().toISOString()
        });
    },

    // Delete a listing
    async delete(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
