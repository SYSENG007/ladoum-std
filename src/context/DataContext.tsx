import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFarm } from './FarmContext';
import type { Animal, Task, Transaction } from '../types';

interface DataContextType {
    animals: Animal[];
    tasks: Task[];
    transactions: Transaction[];
    loading: boolean;
    initialized: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentFarm } = useFarm();
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const fetchData = useCallback(async () => {
        // Si pas de ferme, vider les données
        if (!currentFarm) {
            setAnimals([]);
            setTasks([]);
            setTransactions([]);
            setInitialized(true);
            return;
        }

        setLoading(true);
        try {
            // Chemin des collections basé sur la ferme
            // Structure: farms/{farmId}/animals, farms/{farmId}/tasks, etc.
            const farmId = currentFarm.id;

            // Pour la compatibilité avec les données existantes, on garde l'ancienne structure
            // TODO: Migrer vers farms/{farmId}/collection
            const animalsRef = collection(db, 'animals');
            const tasksRef = collection(db, 'tasks');
            const transactionsRef = collection(db, 'transactions');

            // Fetch Animals
            const animalsQuery = query(animalsRef, orderBy('name', 'asc'));
            const animalsSnap = await getDocs(animalsQuery);
            const animalsData = animalsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Animal));

            // Fetch Tasks
            const tasksQuery = query(tasksRef, orderBy('date', 'asc'));
            const tasksSnap = await getDocs(tasksQuery);
            const tasksData = tasksSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Task));

            // Fetch Transactions
            const transactionsQuery = query(transactionsRef, orderBy('date', 'desc'));
            const transactionsSnap = await getDocs(transactionsQuery);
            const transactionsData = transactionsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Transaction));

            // Filtrer strictement par farmId - chaque ferme ne voit que ses propres données
            setAnimals(animalsData.filter(a => a.farmId === farmId));
            setTasks(tasksData.filter(t => t.farmId === farmId));
            setTransactions(transactionsData.filter(tr => tr.farmId === farmId));

            setError(null);
            setInitialized(true);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Impossible de charger les données.");
        } finally {
            setLoading(false);
        }
    }, [currentFarm]);

    // Recharger les données quand la ferme change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <DataContext.Provider value={{
            animals,
            tasks,
            transactions,
            loading,
            initialized,
            error,
            refreshData: fetchData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
