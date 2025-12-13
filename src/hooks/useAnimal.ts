import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Animal } from '../types';

export const useAnimal = (id: string | undefined) => {
    const [animal, setAnimal] = useState<Animal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnimal = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'animals', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setAnimal({ id: docSnap.id, ...docSnap.data() } as Animal);
                    setError(null);
                } else {
                    setAnimal(null);
                    setError("Animal non trouvé");
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching animal:", err);
                setError("Erreur lors du chargement");
                setLoading(false);
            }
        };

        fetchAnimal();
    }, [id]);

    return { animal, loading, error };
};
