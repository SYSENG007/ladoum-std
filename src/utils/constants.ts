import type { Animal, Task, InventoryItem, User } from '../types';
import type { Veterinarian } from '../types/consultation';

export const MOCK_ANIMALS: Animal[] = [
    {
        id: '1',
        name: 'Princesse Fatou',
        tagId: 'LAD-001',
        photoUrl: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=800',
        gender: 'Female',
        birthDate: '2022-03-15',
        breed: 'Ladoum',
        status: 'Active',
        weight: 85,
        height: 95,
        length: 110,
        chestGirth: 105,
        certification: {
            id: 'CERT-001',
            type: 'Animal',
            level: 'Gold',
            date: '2023-01-10',
            expiryDate: '2025-01-10',
            authority: 'Association Ladoum Sénégal'
        },
        healthRecords: [
            {
                id: 'H1',
                date: '2023-12-01',
                type: 'Vaccination',
                description: 'Vaccin Pasteurellose',
                medicationId: 'MED-001',
                nextDueDate: '2024-06-01',
                performer: 'Dr. Diop'
            },
            {
                id: 'H2',
                date: '2024-01-15',
                type: 'Vitamin',
                description: 'Injection Vitamine AD3E',
                dose: '5ml',
                performer: 'Moussa (Berger)'
            }
        ],
        nutritionPlan: {
            id: 'NUT-001',
            name: 'Maintenance Adulte',
            items: [
                { inventoryItemId: 'FEED-001', quantity: 0.5, unit: 'kg', frequency: 'Daily' },
                { inventoryItemId: 'FEED-002', quantity: 2, unit: 'kg', frequency: 'Daily' }
            ],
            notes: 'Augmenter la ration avant la saison de reproduction.'
        },
        reproductionRecords: [
            {
                id: 'R1',
                date: '2023-05-10',
                type: 'Mating',
                mateId: '2',
                notes: 'Saillie naturelle avec Roi Moussa'
            },
            {
                id: 'R2',
                date: '2023-11-10',
                type: 'Birth',
                mateId: '2',
                outcome: '1 Mâle (Petit Prince)',
                notes: 'Mise bas sans complications'
            }
        ],
        transactions: [
            {
                id: 'T1',
                date: '2022-09-01',
                type: 'Purchase',
                amount: 1500000,
                party: 'Elevage du Nord',
                notes: 'Achat jeune brebis'
            }
        ]
    },
    {
        id: '2',
        name: 'Roi Moussa',
        tagId: 'LAD-002',
        photoUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=800',
        gender: 'Male',
        birthDate: '2021-06-20',
        breed: 'Ladoum',
        status: 'Active',
        weight: 110,
        height: 105,
        length: 120,
        chestGirth: 115,
        certification: {
            id: 'CERT-002',
            type: 'Animal',
            level: 'Elite',
            date: '2023-05-15',
            expiryDate: '2025-05-15',
            authority: 'Association Ladoum Sénégal'
        }
    },
    {
        id: '3',
        name: 'Petit Prince',
        tagId: 'LAD-003',
        photoUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800',
        gender: 'Male',
        birthDate: '2023-11-10',
        breed: 'Ladoum',
        status: 'Active',
        weight: 45,
        height: 60,
        length: 70,
        chestGirth: 65,
        sireId: '2',
        damId: '1',
        certification: {
            id: 'CERT-003',
            type: 'Animal',
            level: 'Silver',
            date: '2024-02-01',
            expiryDate: '2025-02-01',
            authority: 'Association Ladoum Sénégal'
        }
    },
    {
        id: '4',
        name: 'Reine Awa',
        tagId: 'LAD-004',
        photoUrl: 'https://images.unsplash.com/photo-1484557985045-6f550a8527b6?auto=format&fit=crop&q=80&w=800',
        gender: 'Female',
        birthDate: '2020-05-01',
        breed: 'Ladoum',
        status: 'Active',
        weight: 90,
        height: 98,
        length: 105,
        chestGirth: 100,
    },
    {
        id: '5',
        tagId: 'LAD-005',
        name: 'Guerrier',
        gender: 'Male',
        birthDate: '2022-08-05',
        photoUrl: 'https://images.unsplash.com/photo-1518306727298-4c17e1bf6942?auto=format&fit=crop&q=80&w=800',
        breed: 'Ladoum',
        status: 'Active',
        weight: 100,
        height: 100,
        length: 110,
        chestGirth: 105,
    }
];

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Oumar Diop', role: 'Owner', photoUrl: 'https://i.pravatar.cc/150?u=u1' },
    { id: 'u2', name: 'Moussa Sow', role: 'Shepherd', photoUrl: 'https://i.pravatar.cc/150?u=u2' },
    { id: 'u3', name: 'Dr. Ndiaye', role: 'Vet', photoUrl: 'https://i.pravatar.cc/150?u=u3' },
];

export const MOCK_TASKS: Task[] = [
    { id: '1', title: 'Vaccination Clavelée', date: '2023-12-10', status: 'Todo', priority: 'High', type: 'Health', assignedTo: 'u3' },
    { id: '2', title: 'Pesée mensuelle', date: '2023-12-05', status: 'In Progress', priority: 'Medium', type: 'General', assignedTo: 'u2' },
    { id: '3', title: 'Achat aliment', date: '2023-12-01', status: 'Done', priority: 'High', type: 'Feeding', assignedTo: 'u1' },
    { id: '4', title: 'Nettoyage Bergerie', date: '2023-12-12', status: 'Todo', priority: 'Medium', type: 'General', assignedTo: 'u2' },
    { id: '5', title: 'Échographie Princesse', date: '2023-12-15', status: 'Todo', priority: 'High', type: 'Reproduction', assignedTo: 'u3' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Aliment Concentré', category: 'Feed', quantity: 50, unit: 'kg', minThreshold: 100 },
    { id: '2', name: 'Vermifuge', category: 'Medicine', quantity: 5, unit: 'flacons', minThreshold: 2 },
    { id: '3', name: 'Paille', category: 'Feed', quantity: 200, unit: 'bottes', minThreshold: 50 },
];

export const MOCK_VETERINARIANS: Veterinarian[] = [
    {
        id: 'vet1',
        name: 'Dr. Amadou Diop',
        photoUrl: 'https://i.pravatar.cc/150?u=vet1',
        specialty: 'General',
        availability: 'Available',
        rating: 4.8,
        consultationCount: 156,
        phone: '+221 77 123 45 67',
        email: 'dr.diop@vetsenegal.sn'
    },
    {
        id: 'vet2',
        name: 'Dr. Fatou Ndiaye',
        photoUrl: 'https://i.pravatar.cc/150?u=vet2',
        specialty: 'Reproduction',
        availability: 'Available',
        rating: 4.9,
        consultationCount: 203,
        phone: '+221 77 234 56 78',
        email: 'dr.ndiaye@vetsenegal.sn'
    },
    {
        id: 'vet3',
        name: 'Dr. Ibrahima Sow',
        photoUrl: 'https://i.pravatar.cc/150?u=vet3',
        specialty: 'Nutrition',
        availability: 'Busy',
        rating: 4.7,
        consultationCount: 89,
        phone: '+221 77 345 67 89',
        email: 'dr.sow@vetsenegal.sn'
    },
    {
        id: 'vet4',
        name: 'Dr. Mariama Fall',
        photoUrl: 'https://i.pravatar.cc/150?u=vet4',
        specialty: 'Surgery',
        availability: 'Offline',
        rating: 4.6,
        consultationCount: 112,
        phone: '+221 77 456 78 90',
        email: 'dr.fall@vetsenegal.sn'
    }
];

