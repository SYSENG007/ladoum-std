import { useData } from '../context/DataContext';

export const useAnimals = () => {
    const { animals, loading, error, refreshData } = useData();
    return { animals, loading, error, refreshAnimals: refreshData };
};
