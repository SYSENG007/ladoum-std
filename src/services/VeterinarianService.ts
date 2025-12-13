import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    where,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Veterinarian } from '../types/consultation';

const COLLECTION_NAME = 'veterinarians';

export const VeterinarianService = {
    // Get all veterinarians
    async getAll(): Promise<Veterinarian[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Veterinarian));
    },

    // Get available veterinarians
    async getAvailable(): Promise<Veterinarian[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('availability', '==', 'Available'),
            orderBy('name')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Veterinarian));
    },

    // Get first available veterinarian (by highest rating)
    async getFirstAvailable(): Promise<Veterinarian | null> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('availability', '==', 'Available'),
            orderBy('rating', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Veterinarian;
    },

    // Get veterinarian by ID
    async getById(id: string): Promise<Veterinarian | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Veterinarian;
        }
        return null;
    },

    // Get veterinarians by specialty
    async getBySpecialty(specialty: Veterinarian['specialty']): Promise<Veterinarian[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('specialty', '==', specialty),
            orderBy('rating', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Veterinarian));
    },

    // Update veterinarian availability
    async updateAvailability(id: string, availability: Veterinarian['availability']): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { availability });
    },

    // Add a new veterinarian (admin function)
    async add(vet: Omit<Veterinarian, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), vet);
        return docRef.id;
    },

    // Update veterinarian
    async update(id: string, updates: Partial<Veterinarian>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    }
};
