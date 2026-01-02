/**
 * ReproductionService - Gère le cycle reproductif complet
 * 
 * Événements gérés:
 * - Heat: Observation de chaleur
 * - Mating: Saillie/Insémination
 * - Pregnancy: Confirmation gestation
 * - Birth: Mise bas (avec création automatique des agneaux)
 * - Abortion: Avortement
 * - Weaning: Sevrage
 */

import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ReproductionEvent } from '../types';

const COLLECTION_NAME = 'reproductionEvents';

export const ReproductionService = {
    /**
     * Enregistre un événement de reproduction
     */
    async addEvent(event: Omit<ReproductionEvent, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...event,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return docRef.id;
    },

    /**
     * Récupère tous les événements pour un animal
     */
    async getEventsByAnimal(animalId: string): Promise<ReproductionEvent[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('animalId', '==', animalId),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ReproductionEvent));
    },

    /**
     * Récupère tous les événements pour une ferme
     */
    async getEventsByFarm(farmId: string): Promise<ReproductionEvent[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('farmId', '==', farmId),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ReproductionEvent));
    },

    /**
     * Récupère le dernier événement d'accouplement pour calculer le père
     */
    async getLastMating(animalId: string): Promise<ReproductionEvent | null> {
        const events = await this.getEventsByAnimal(animalId);
        const matingEvents = events.filter(e => e.type === 'Mating');
        return matingEvents.length > 0 ? matingEvents[0] : null;
    },

    /**
     * Détermine le statut reproductif actuel d'une femelle
     */
    async getCurrentCycleStatus(animalId: string): Promise<{
        status: 'Available' | 'InHeat' | 'AwaitingConfirmation' | 'Pregnant' | 'Lactating';
        lastEvent?: ReproductionEvent;
        daysInStatus?: number;
    }> {
        const events = await this.getEventsByAnimal(animalId);

        if (events.length === 0) {
            return { status: 'Available' };
        }

        const lastEvent = events[0];
        const daysSince = Math.floor(
            (new Date().getTime() - new Date(lastEvent.date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Logique de statut basée sur le dernier événement
        switch (lastEvent.type) {
            case 'Heat':
                return { status: 'InHeat', lastEvent, daysInStatus: daysSince };

            case 'Mating':
                // Si saillie < 20j, on attend confirmation
                if (daysSince < 20) {
                    return { status: 'AwaitingConfirmation', lastEvent, daysInStatus: daysSince };
                }
                // Sinon, probablement échouée, retour disponible
                return { status: 'Available', lastEvent, daysInStatus: daysSince };

            case 'Pregnancy':
                return { status: 'Pregnant', lastEvent, daysInStatus: daysSince };

            case 'Birth':
                return { status: 'Lactating', lastEvent, daysInStatus: daysSince };

            case 'Weaning':
                return { status: 'Available', lastEvent, daysInStatus: daysSince };

            case 'Abortion':
                return { status: 'Available', lastEvent, daysInStatus: daysSince };

            default:
                return { status: 'Available', lastEvent };
        }
    },

    /**
     * Met à jour un événement existant
     */
    async updateEvent(eventId: string, updates: Partial<ReproductionEvent>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, eventId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    },

    /**
     * Calcule la date attendue de mise bas (Mating + 150j pour Ladoum)
     */
    calculateExpectedDueDate(matingDate: string): string {
        const date = new Date(matingDate);
        date.setDate(date.getDate() + 150);
        return date.toISOString().split('T')[0];
    },

    /**
     * Prédit la prochaine chaleur basée sur l'historique
     */
    async predictNextHeat(animalId: string): Promise<{
        predictedDate: string;
        confidence: 'Low' | 'Medium' | 'High';
        averageCycle: number;
    } | null> {
        const events = await this.getEventsByAnimal(animalId);
        const heatEvents = events.filter(e => e.type === 'Heat').sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (heatEvents.length < 2) {
            return null; // Pas assez de données
        }

        // Calcul du cycle moyen
        const cycles: number[] = [];
        for (let i = 1; i < heatEvents.length; i++) {
            const days = Math.floor(
                (new Date(heatEvents[i].date).getTime() - new Date(heatEvents[i - 1].date).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            cycles.push(days);
        }

        const averageCycle = Math.round(
            cycles.reduce((sum, c) => sum + c, 0) / cycles.length
        );

        const lastHeat = heatEvents[heatEvents.length - 1];
        const nextDate = new Date(lastHeat.date);
        nextDate.setDate(nextDate.getDate() + averageCycle);

        // Confiance basée sur la régularité
        const variance = cycles.reduce((sum, c) => sum + Math.pow(c - averageCycle, 2), 0) / cycles.length;
        const confidence = variance < 4 ? 'High' : variance < 16 ? 'Medium' : 'Low';

        return {
            predictedDate: nextDate.toISOString().split('T')[0],
            confidence,
            averageCycle
        };
    }
};
