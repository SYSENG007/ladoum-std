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
import { AccountingService } from './AccountingService';
import type {
    Consultation,
    ConsultationMessage,
    ConsultationReport,
    ConsultationStatus,
    PaymentStatus
} from '../types/consultation';

const CONSULTATIONS_COLLECTION = 'consultations';
const MESSAGES_COLLECTION = 'consultation_messages';
const REPORTS_COLLECTION = 'consultation_reports';

export const ConsultationService = {
    // Get all consultations
    async getAll(): Promise<Consultation[]> {
        const q = query(
            collection(db, CONSULTATIONS_COLLECTION),
            orderBy('scheduledDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Consultation));
    },

    // Get consultations by farmer
    async getByFarmer(farmerId: string): Promise<Consultation[]> {
        const q = query(
            collection(db, CONSULTATIONS_COLLECTION),
            where('farmerId', '==', farmerId),
            orderBy('scheduledDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Consultation));
    },

    // Get consultations by veterinarian
    async getByVet(vetId: string): Promise<Consultation[]> {
        const q = query(
            collection(db, CONSULTATIONS_COLLECTION),
            where('veterinarianId', '==', vetId),
            orderBy('scheduledDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Consultation));
    },

    // Get single consultation by ID
    async getById(id: string): Promise<Consultation | null> {
        const docRef = doc(db, CONSULTATIONS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Consultation;
        }
        return null;
    },

    // Get consultations by animal
    async getByAnimal(animalId: string): Promise<Consultation[]> {
        const q = query(
            collection(db, CONSULTATIONS_COLLECTION),
            where('animalIds', 'array-contains', animalId),
            orderBy('scheduledDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Consultation));
    },

    // Create a new consultation (booking)
    async create(consultation: Omit<Consultation, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, CONSULTATIONS_COLLECTION), {
            ...consultation,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    // Update consultation
    async update(id: string, updates: Partial<Consultation>): Promise<void> {
        const docRef = doc(db, CONSULTATIONS_COLLECTION, id);
        await updateDoc(docRef, updates);
    },

    // Update consultation status
    async updateStatus(id: string, status: ConsultationStatus): Promise<void> {
        const docRef = doc(db, CONSULTATIONS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const consultation = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Consultation : null;

        const updates: Partial<Consultation> = { status };

        if (status === 'InProgress') {
            updates.startedAt = new Date().toISOString();
        } else if (status === 'Completed') {
            updates.completedAt = new Date().toISOString();

            // Auto-create expense transaction for consultation fee
            if (consultation && consultation.amount) {
                try {
                    await AccountingService.add({
                        type: 'Expense',
                        category: 'Consultation',
                        amount: consultation.amount,
                        description: `Consultation vétérinaire - Dr. ${consultation.veterinarianName || 'Vétérinaire'}`,
                        date: new Date().toISOString().split('T')[0],
                        farmId: consultation.farmerId || '',
                        consultationId: id,
                        animalId: consultation.animalIds?.[0],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    console.log('Consultation expense transaction created');
                } catch (err) {
                    console.error('Failed to create consultation transaction:', err);
                }
            }
        }

        await updateDoc(docRef, updates);
    },

    // Update payment status
    async updatePayment(id: string, paymentStatus: PaymentStatus): Promise<void> {
        const docRef = doc(db, CONSULTATIONS_COLLECTION, id);
        await updateDoc(docRef, { paymentStatus });
    },

    // Cancel consultation
    async cancel(id: string): Promise<void> {
        await this.updateStatus(id, 'Cancelled');
    },

    // Delete consultation
    async delete(id: string): Promise<void> {
        const docRef = doc(db, CONSULTATIONS_COLLECTION, id);
        await deleteDoc(docRef);
    },

    // ========== MESSAGES ==========

    // Get messages for a consultation
    async getMessages(consultationId: string): Promise<ConsultationMessage[]> {
        const q = query(
            collection(db, MESSAGES_COLLECTION),
            where('consultationId', '==', consultationId),
            orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ConsultationMessage));
    },

    // Add a message
    async addMessage(message: Omit<ConsultationMessage, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
            ...message,
            timestamp: new Date().toISOString()
        });
        return docRef.id;
    },

    // ========== REPORTS ==========

    // Get report for a consultation
    async getReport(consultationId: string): Promise<ConsultationReport | null> {
        const q = query(
            collection(db, REPORTS_COLLECTION),
            where('consultationId', '==', consultationId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as ConsultationReport;
    },

    // Create a consultation report
    async createReport(report: Omit<ConsultationReport, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
            ...report,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    // Update a report
    async updateReport(id: string, updates: Partial<ConsultationReport>): Promise<void> {
        const docRef = doc(db, REPORTS_COLLECTION, id);
        await updateDoc(docRef, updates);
    }
};
