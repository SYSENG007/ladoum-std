import { useData } from '../context/DataContext';

export const useAnimals = () => {
    const { animals, loading, error } = useData();
    return { animals, loading, error };
};
