import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Animal } from '../types';

export const useAnimal = (id: string | undefined) => {
    const [animal, setAnimal] = useState<Animal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnimal = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const docRef = doc(db, 'animals', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setAnimal({ id: docSnap.id, ...docSnap.data() } as Animal);
                setError(null);
            } else {
                setAnimal(null);
                setError("Animal non trouvé");
            }
        } catch (err) {
            console.error("Error fetching animal:", err);
            setError("Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAnimal();
    }, [fetchAnimal]);

    const refresh = useCallback(() => {
        fetchAnimal();
    }, [fetchAnimal]);

    return { animal, loading, error, refresh };
};
