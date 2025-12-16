// Shift Service - Ladoum STD

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Shift } from '../types/staff';

const COLLECTION = 'shifts';

export const ShiftService = {
    /**
     * Create a new shift
     */
    async create(data: Omit<Shift, 'id' | 'createdAt'>): Promise<Shift> {
        const shiftData = {
            ...data,
            status: data.status || 'scheduled',
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION), shiftData);
        return { id: docRef.id, ...shiftData } as Shift;
    },

    /**
     * Update a shift
     */
    async update(shiftId: string, data: Partial<Shift>): Promise<void> {
        await updateDoc(doc(db, COLLECTION, shiftId), data);
    },

    /**
     * Delete a shift
     */
    async delete(shiftId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, shiftId));
    },

    /**
     * Get shifts for a farm in a date range
     */
    async getByFarmAndDateRange(farmId: string, startDate: string, endDate: string): Promise<Shift[]> {
        const q = query(
            collection(db, COLLECTION),
            where('farmId', '==', farmId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Shift);
    },

    /**
     * Get shifts for a specific member
     */
    async getByMember(memberId: string, startDate?: string, endDate?: string): Promise<Shift[]> {
        let q = query(
            collection(db, COLLECTION),
            where('memberId', '==', memberId),
            orderBy('date', 'asc')
        );

        if (startDate && endDate) {
            q = query(
                collection(db, COLLECTION),
                where('memberId', '==', memberId),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'asc')
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Shift);
    },

    /**
     * Get shifts for a specific date
     */
    async getByDate(farmId: string, date: string): Promise<Shift[]> {
        const q = query(
            collection(db, COLLECTION),
            where('farmId', '==', farmId),
            where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Shift);
    },

    /**
     * Mark a shift as completed
     */
    async markCompleted(shiftId: string): Promise<void> {
        await updateDoc(doc(db, COLLECTION, shiftId), {
            status: 'completed'
        });
    },

    /**
     * Cancel a shift
     */
    async cancel(shiftId: string, reason?: string): Promise<void> {
        await updateDoc(doc(db, COLLECTION, shiftId), {
            status: 'cancelled',
            notes: reason
        });
    },

    /**
     * Get weekly schedule for a farm
     */
    async getWeeklySchedule(farmId: string, weekStartDate: string): Promise<Shift[]> {
        const start = new Date(weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return this.getByFarmAndDateRange(
            farmId,
            weekStartDate,
            end.toISOString().split('T')[0]
        );
    }
};
