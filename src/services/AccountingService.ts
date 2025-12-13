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
import type { Transaction, TransactionCategory, TransactionType } from '../types';

const COLLECTION_NAME = 'transactions';

export const AccountingService = {
    // Get all transactions
    async getAll(): Promise<Transaction[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
    },

    // Get transactions by date range
    async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
    },

    // Get transactions by type (Income/Expense)
    async getByType(type: TransactionType): Promise<Transaction[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('type', '==', type),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
    },

    // Get transactions by category
    async getByCategory(category: TransactionCategory): Promise<Transaction[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('category', '==', category),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
    },

    // Get transactions linked to a specific animal
    async getByAnimal(animalId: string): Promise<Transaction[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('animalId', '==', animalId),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
    },

    // Add a new transaction
    async add(transaction: Omit<Transaction, 'id'>): Promise<string> {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...transaction,
            createdAt: now,
            updatedAt: now
        });
        return docRef.id;
    },

    // Update a transaction
    async update(id: string, updates: Partial<Transaction>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    },

    // Delete a transaction
    async delete(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Calculate totals for a list of transactions
    calculateTotals(transactions: Transaction[]): { income: number; expenses: number; balance: number } {
        const income = transactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);
        return {
            income,
            expenses,
            balance: income - expenses
        };
    }
};
