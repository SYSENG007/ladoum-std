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
import type { Task, TaskStatus } from '../types';

const COLLECTION_NAME = 'tasks';

export const TaskService = {
    // Get all tasks
    async getAll(): Promise<Task[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('date'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));
    },

    // Add a new task
    async add(task: Omit<Task, 'id'>) {
        return addDoc(collection(db, COLLECTION_NAME), task);
    },

    // Update task status
    async updateStatus(id: string, status: TaskStatus) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return updateDoc(docRef, { status });
    },

    // Update task
    async update(id: string, updates: Partial<Task>) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return updateDoc(docRef, updates);
    },

    // Delete a task
    async delete(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return deleteDoc(docRef);
    }
};
