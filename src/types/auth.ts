// ============================================
// AUTHENTICATION TYPES
// ============================================

import type { User as FirebaseUser } from 'firebase/auth';

// Invitation pour le système d'inscription sur invitation
export interface Invitation {
    id: string;
    email: string;
    code: string;
    invitedBy: string; // userId de l'inviteur
    farmId?: string; // Si invité à rejoindre une ferme existante
    role?: 'owner' | 'manager' | 'worker';
    usedAt?: string;
    createdAt: string;
    expiresAt: string;
}

// Profil utilisateur stocké dans Firestore
export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    photoUrl?: string;
    phone?: string;
    farms: string[]; // Liste des farmIds
    activeFarmId: string;
    onboardingCompleted: boolean;
    settings: UserSettings;
    createdAt: string;
    updatedAt: string;
}

// Préférences utilisateur
export interface UserSettings {
    language: 'fr' | 'en' | 'wo'; // Français, English, Wolof
    theme: 'light' | 'dark' | 'system';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
    notifications: NotificationPreferences;
}

// Préférences de notifications
export interface NotificationPreferences {
    enabled: boolean;
    taskReminders: boolean;
    heatPredictions: boolean;
    birthAlerts: boolean;
    lowStock: boolean;
    vetAppointments: boolean;
    vaccinationDue: boolean;
    quietHoursStart?: string; // "22:00"
    quietHoursEnd?: string;   // "07:00"
}

// État du contexte d'authentification
export interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, invitationCode: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

// Données d'onboarding
export interface OnboardingData {
    step: number;
    userInfo: {
        displayName: string;
        phone?: string;
    };
    farmInfo: {
        name: string;
        location?: string;
        defaultBreed?: string;
        estimatedAnimals?: number;    // Nombre estimé de sujets
        estimatedEmployees?: number;  // Nombre d'employés
    };
}

// Default settings pour nouvel utilisateur
export const defaultUserSettings: UserSettings = {
    language: 'fr',
    theme: 'system',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
        enabled: true,
        taskReminders: true,
        heatPredictions: true,
        birthAlerts: true,
        lowStock: true,
        vetAppointments: true,
        vaccinationDue: true,
    },
};
