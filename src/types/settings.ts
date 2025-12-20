// ============================================
// SETTINGS TYPES
// ============================================

export type Language = 'fr' | 'en' | 'wo'; // Français, English, Wolof

export type ThemeMode = 'light' | 'dark' | 'system';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export type Currency = 'XOF' | 'EUR' | 'USD'; // FCFA, Euro, Dollar

// ============================================
// APP SETTINGS
// ============================================

export interface AppSettings {
    // Apparence
    theme: ThemeMode;
    language: Language;

    // Formats
    dateFormat: DateFormat;
    currency: Currency;

    // Unités
    weightUnit: 'kg' | 'lb';
    measurementUnit: 'cm' | 'in';

    // Dashboard
    dashboardLayout: 'grid' | 'list';
    showQuickActions: boolean;

    // Données
    autoSync: boolean;
    syncInterval: number; // minutes

    // Notifications (lié à NotificationPreferences)
    notificationsEnabled: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;

    // Herd
    defaultBreed: string;
    showInactiveAnimals: boolean;

    // Tasks
    defaultTaskView: 'kanban' | 'list' | 'calendar';
    showCompletedTasks: boolean;
    taskReminderDays: number; // Jours avant l'échéance

    // Inventory
    lowStockAlertEnabled: boolean;

    // Reproduction
    heatCycleLength: number; // Jours (default 17 pour moutons)
    heatSurveillanceWindow: number; // Jours (default 2)
    gestationLength: number; // Jours (default 150 pour moutons)
    gestationSurveillanceWindow: number; // Jours (default 5)
}

export const defaultAppSettings: AppSettings = {
    // Apparence
    theme: 'light',
    language: 'fr',

    // Formats
    dateFormat: 'DD/MM/YYYY',
    currency: 'XOF',

    // Unités
    weightUnit: 'kg',
    measurementUnit: 'cm',

    // Dashboard
    dashboardLayout: 'grid',
    showQuickActions: true,

    // Données
    autoSync: true,
    syncInterval: 5,

    // Notifications
    notificationsEnabled: true,
    pushNotifications: true,
    emailNotifications: false,

    // Herd
    defaultBreed: 'Ladoum',
    showInactiveAnimals: false,

    // Tasks
    defaultTaskView: 'kanban',
    showCompletedTasks: false,
    taskReminderDays: 1,

    // Inventory
    lowStockAlertEnabled: true,

    // Reproduction
    heatCycleLength: 17,
    heatSurveillanceWindow: 2,
    gestationLength: 150,
    gestationSurveillanceWindow: 5,
};

// ============================================
// TRANSLATIONS
// ============================================

export const translations: Record<Language, Record<string, string>> = {
    fr: {
        // Navigation
        'nav.dashboard': 'Tableau de bord',
        'nav.herd': 'Troupeau',
        'nav.tasks': 'Tâches',
        'nav.inventory': 'Inventaire',
        'nav.accounting': 'Comptabilité',
        'nav.settings': 'Paramètres',
        'nav.profile': 'Profil',
        'nav.logout': 'Déconnexion',

        // Common
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.add': 'Ajouter',
        'common.search': 'Rechercher',
        'common.filter': 'Filtrer',
        'common.loading': 'Chargement...',
        'common.error': 'Erreur',
        'common.success': 'Succès',
        'common.all': 'Tout',
        'common.none': 'Aucun',

        // Animals
        'animal.name': 'Nom',
        'animal.tagId': 'Numéro d\'identification',
        'animal.gender': 'Sexe',
        'animal.male': 'Mâle',
        'animal.female': 'Femelle',
        'animal.birthDate': 'Date de naissance',
        'animal.breed': 'Race',
        'animal.status': 'Statut',
        'animal.active': 'Actif',
        'animal.sold': 'Vendu',
        'animal.deceased': 'Décédé',
        'animal.weight': 'Poids',
        'animal.height': 'Hauteur au garrot',
        'animal.length': 'Longueur',
        'animal.chestGirth': 'Tour de poitrine',

        // Tasks
        'task.title': 'Titre',
        'task.date': 'Date d\'échéance',
        'task.priority': 'Priorité',
        'task.high': 'Haute',
        'task.medium': 'Moyenne',
        'task.low': 'Basse',
        'task.status': 'Statut',
        'task.todo': 'À faire',
        'task.inProgress': 'En cours',
        'task.done': 'Terminé',

        // Settings
        'settings.title': 'Paramètres',
        'settings.appearance': 'Apparence',
        'settings.language': 'Langue',
        'settings.theme': 'Thème',
        'settings.notifications': 'Notifications',
        'settings.data': 'Données',
        'settings.units': 'Unités',
    },

    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.herd': 'Herd',
        'nav.tasks': 'Tasks',
        'nav.inventory': 'Inventory',
        'nav.accounting': 'Accounting',
        'nav.settings': 'Settings',
        'nav.profile': 'Profile',
        'nav.logout': 'Logout',

        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.add': 'Add',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.all': 'All',
        'common.none': 'None',

        // Animals
        'animal.name': 'Name',
        'animal.tagId': 'Tag ID',
        'animal.gender': 'Gender',
        'animal.male': 'Male',
        'animal.female': 'Female',
        'animal.birthDate': 'Birth Date',
        'animal.breed': 'Breed',
        'animal.status': 'Status',
        'animal.active': 'Active',
        'animal.sold': 'Sold',
        'animal.deceased': 'Deceased',
        'animal.weight': 'Weight',
        'animal.height': 'Height at withers',
        'animal.length': 'Length',
        'animal.chestGirth': 'Chest girth',

        // Tasks
        'task.title': 'Title',
        'task.date': 'Due date',
        'task.priority': 'Priority',
        'task.high': 'High',
        'task.medium': 'Medium',
        'task.low': 'Low',
        'task.status': 'Status',
        'task.todo': 'To do',
        'task.inProgress': 'In progress',
        'task.done': 'Done',

        // Settings
        'settings.title': 'Settings',
        'settings.appearance': 'Appearance',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        'settings.notifications': 'Notifications',
        'settings.data': 'Data',
        'settings.units': 'Units',
    },

    wo: {
        // Navigation
        'nav.dashboard': 'Xët',
        'nav.herd': 'Xar yi',
        'nav.tasks': 'Liggéey yi',
        'nav.inventory': 'Dépôt',
        'nav.accounting': 'Xaalis',
        'nav.settings': 'Paramètre yi',
        'nav.profile': 'Profil',
        'nav.logout': 'Génne',

        // Common
        'common.save': 'Denc',
        'common.cancel': 'Nëbb',
        'common.delete': 'Far',
        'common.edit': 'Soppi',
        'common.add': 'Yokk',
        'common.search': 'Seet',
        'common.filter': 'Tànn',
        'common.loading': 'Yééwal...',
        'common.error': 'Njuumte',
        'common.success': 'Baax na',
        'common.all': 'Yépp',
        'common.none': 'Dara',

        // Animals
        'animal.name': 'Tur',
        'animal.tagId': 'Numéro',
        'animal.gender': 'Jigéen/Góor',
        'animal.male': 'Góor',
        'animal.female': 'Jigéen',
        'animal.birthDate': 'Bis bu juddu',
        'animal.breed': 'Xeet',
        'animal.status': 'État',
        'animal.active': 'Aktif',
        'animal.sold': 'Jaay nañu ko',
        'animal.deceased': 'Dee na',
        'animal.weight': 'Diis',
        'animal.height': 'Kawewaay',
        'animal.length': 'Gudd',
        'animal.chestGirth': 'Takk',

        // Tasks
        'task.title': 'Tur',
        'task.date': 'Bis',
        'task.priority': 'Priorité',
        'task.high': 'Ndaw',
        'task.medium': 'Diggante',
        'task.low': 'Suuf',
        'task.status': 'État',
        'task.todo': 'Def',
        'task.inProgress': 'Ci biir',
        'task.done': 'Jeexal',

        // Settings
        'settings.title': 'Paramètre yi',
        'settings.appearance': 'Mel',
        'settings.language': 'Làkk',
        'settings.theme': 'Thème',
        'settings.notifications': 'Xëtu mbind',
        'settings.data': 'Données',
        'settings.units': 'Unités',
    },
};
