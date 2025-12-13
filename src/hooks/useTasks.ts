import { useData } from '../context/DataContext';

export const useTasks = () => {
    const { tasks, loading, error } = useData();
    return { tasks, loading, error };
};
