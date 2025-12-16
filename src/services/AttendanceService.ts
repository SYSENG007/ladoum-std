// Attendance Service - Ladoum STD

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
import type { Attendance, AttendanceStats } from '../types/staff';

const COLLECTION = 'attendance';

export const AttendanceService = {
    /**
     * Record check-in for a member
     */
    async checkIn(memberId: string, memberName: string, farmId: string, notes?: string): Promise<Attendance> {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        // Check if already checked in today
        const existing = await this.getByMemberAndDate(memberId, dateStr);
        if (existing) {
            throw new Error('Déjà pointé aujourd\'hui');
        }

        const data: Omit<Attendance, 'id'> = {
            memberId,
            memberName,
            farmId,
            date: dateStr,
            checkIn: now.toISOString(),
            status: 'present',
            notes,
            createdAt: now.toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION), data);
        return { id: docRef.id, ...data };
    },

    /**
     * Record check-out for a member
     */
    async checkOut(attendanceId: string): Promise<void> {
        const now = new Date();
        await updateDoc(doc(db, COLLECTION, attendanceId), {
            checkOut: now.toISOString(),
            updatedAt: now.toISOString()
        });
    },

    /**
     * Get attendance record by member and date
     */
    async getByMemberAndDate(memberId: string, date: string): Promise<Attendance | null> {
        const q = query(
            collection(db, COLLECTION),
            where('memberId', '==', memberId),
            where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docData = snapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Attendance;
    },

    /**
     * Get all attendance records for a farm in a date range
     */
    async getByFarmAndDateRange(farmId: string, startDate: string, endDate: string): Promise<Attendance[]> {
        const q = query(
            collection(db, COLLECTION),
            where('farmId', '==', farmId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Attendance);
    },

    /**
     * Get attendance for a specific member in a month
     */
    async getByMemberAndMonth(memberId: string, yearMonth: string): Promise<Attendance[]> {
        const startDate = `${yearMonth}-01`;
        const endDate = `${yearMonth}-31`;

        const q = query(
            collection(db, COLLECTION),
            where('memberId', '==', memberId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Attendance);
    },

    /**
     * Mark member as absent
     */
    async markAbsent(memberId: string, memberName: string, farmId: string, date: string, notes?: string): Promise<Attendance> {
        const data: Omit<Attendance, 'id'> = {
            memberId,
            memberName,
            farmId,
            date,
            status: 'absent',
            notes,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION), data);
        return { id: docRef.id, ...data };
    },

    /**
     * Update attendance status
     */
    async updateStatus(attendanceId: string, status: Attendance['status'], notes?: string): Promise<void> {
        await updateDoc(doc(db, COLLECTION, attendanceId), {
            status,
            notes,
            updatedAt: new Date().toISOString()
        });
    },

    /**
     * Calculate attendance statistics for a member in a month
     */
    async getStats(memberId: string, yearMonth: string): Promise<AttendanceStats> {
        const records = await this.getByMemberAndMonth(memberId, yearMonth);

        let daysPresent = 0;
        let daysAbsent = 0;
        let daysLate = 0;
        let daysLeave = 0;

        records.forEach(r => {
            switch (r.status) {
                case 'present': daysPresent++; break;
                case 'absent': daysAbsent++; break;
                case 'late': daysLate++; daysPresent++; break;
                case 'half-day': daysPresent += 0.5; break;
                case 'leave': daysLeave++; break;
            }
        });

        const totalWorkDays = daysPresent + daysAbsent + daysLate;
        const attendanceRate = totalWorkDays > 0 ? (daysPresent / totalWorkDays) * 100 : 100;

        return {
            memberId,
            period: yearMonth,
            daysPresent,
            daysAbsent,
            daysLate,
            daysLeave,
            attendanceRate: Math.round(attendanceRate)
        };
    },

    /**
     * Delete an attendance record
     */
    async delete(attendanceId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, attendanceId));
    }
};
