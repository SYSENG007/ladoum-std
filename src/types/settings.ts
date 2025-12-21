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
        'nav.pedigree': 'Pédigrées',
        'nav.reproduction': 'Reproduction',
        'nav.tasks': 'Tâches',
        'nav.inventory': 'Inventaire',
        'nav.staff': 'Personnel',
        'nav.vet': 'Véto',
        'nav.accounting': 'Comptabilité',
        'nav.marketplace': 'Marketplace',
        'nav.settings': 'Paramètres',
        'nav.profile': 'Profil',
        'nav.logout': 'Déconnexion',

        // Theme
        'theme.light': 'Mode clair',
        'theme.dark': 'Mode sombre',
        'theme.system': 'Système',

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
        'common.confirm': 'Confirmer',
        'common.close': 'Fermer',
        'common.back': 'Retour',
        'common.next': 'Suivant',
        'common.previous': 'Précédent',
        'common.yes': 'Oui',
        'common.no': 'Non',
        'common.today': "Aujourd'hui",
        'common.tomorrow': 'Demain',
        'common.daysAgo': 'Il y a {days}j',
        'common.inDays': 'Dans {days}j',
        'task.unassigned': 'Non assigné',
        'task.dropHere': 'Déposer ici',
        'common.date': 'Date',
        'common.type': 'Type',
        'common.category': 'Catégorie',
        'common.description': 'Description',
        'common.amount': 'Montant',
        'common.actions': 'Actions',
        'common.link': 'Lien',
        'common.allTypes': 'Tous types',
        'common.allCategories': 'Toutes catégories',



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
        'animal.father': 'Père',
        'animal.mother': 'Mère',
        'animal.notes': 'Notes',

        // Herd Page
        'herd.title': 'Mon Cheptel',
        'herd.subtitle': 'Gérez vos moutons Ladoum',
        'herd.addAnimal': 'Ajouter un animal',
        'herd.searchPlaceholder': 'Rechercher par nom ou ID...',
        'herd.all': 'Tout',
        'herd.active': 'Actifs',
        'herd.sold': 'Vendus',
        'herd.noAnimals': 'Aucun animal trouvé.',


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
        'task.blocked': 'Bloqué',
        'task.done': 'Terminé',
        'task.newTask': 'Nouvelle tâche',
        'task.assignedTo': 'Assigné à',
        'task.type': 'Type',
        'task.subtitle': 'Gérez les activités de la bergerie.',
        'task.noTasks': 'Aucune tâche trouvée.',
        'task.changeStatus': 'Changer le statut',
        'task.deleteSuccess': 'Tâche supprimée',
        'task.deleteError': 'Erreur lors de la suppression de la tâche.',

        // Inventory
        'inventory.subtitle': 'Suivi du stock et du matériel.',
        'inventory.add': 'Ajouter un article',
        'inventory.totalItems': 'Total Articles',
        'inventory.lowStock': 'Stock Faible',
        'inventory.totalValue': 'Valeur Totale',
        'inventory.lowStockAlert': 'Alerte Stock Faible',
        'inventory.restockMessage': 'Nécessite(nt) un réapprovisionnement',
        'inventory.category.medicine': 'Santé',
        'inventory.category.feed': 'Alimentation',
        'inventory.category.equipment': 'Matériel',
        'inventory.addedTo': 'ajouté à',
        'inventory.removedFrom': 'retiré de',
        'inventory.quantity': 'Quantité',
        'inventory.threshold': 'Seuil',
        'inventory.expiry': 'Exp',
        'inventory.addStock': 'Ajouter du stock',
        'inventory.removeStock': 'Retirer du stock',
        'inventory.noItems': 'Aucun article trouvé',

        // Accounting
        'accounting.title': 'Comptabilité',
        'accounting.subtitle': 'Gérez vos finances',
        'accounting.addTransaction': 'Ajouter une transaction',
        'accounting.income': 'Revenus',
        'accounting.expense': 'Dépenses',
        'accounting.balance': 'Solde',
        'accounting.category.feed': 'Alimentation',
        'accounting.category.health': 'Santé',
        'accounting.category.reproduction': 'Reproduction',
        'accounting.category.personnel': 'Personnel',
        'accounting.category.infrastructure': 'Infrastructure',
        'accounting.category.sale': 'Vente',
        'accounting.category.purchase': 'Achat animaux',
        'accounting.category.consultation': 'Consultation',
        'accounting.category.marketplace': 'Marketplace',
        'accounting.category.other': 'Divers',
        'accounting.noTransactions': 'Aucune transaction trouvée',
        'accounting.transactionDeleted': 'Transaction supprimée',
        'accounting.deleteError': 'Erreur lors de la suppression de la transaction.',

        // Marketplace
        'marketplace.title': 'Marketplace',
        'marketplace.subtitle': 'Achetez et vendez animaux, aliments et services',
        'marketplace.new': 'Nouvelle Annonce',
        'marketplace.search': 'Rechercher une annonce...',
        'marketplace.filter': 'Filtres',
        'marketplace.category.animal': 'Animaux',
        'marketplace.category.feed': 'Aliments',
        'marketplace.category.equipment': 'Matériel',
        'marketplace.category.service': 'Services',
        'marketplace.status.available': 'Disponible',
        'marketplace.status.reserved': 'Réservé',
        'marketplace.status.sold': 'Vendu',
        'marketplace.allRegions': 'Toutes les régions',
        'marketplace.totalListings': 'Total Annonces',
        'marketplace.availableListings': 'Disponibles',
        'marketplace.animalListings': 'Animaux',
        'marketplace.noListings': 'Aucune annonce trouvée',
        'marketplace.createFirst': 'Commencez par créer votre première annonce',
        'marketplace.adjustFilters': 'Essayez de modifier vos critères de recherche',
        'marketplace.create': 'Créer une annonce',
        'marketplace.loading': 'Chargement des annonces...',
        'marketplace.error': 'Erreur lors du chargement',
        'marketplace.retry': 'Réessayer',
        'marketplace.deleteTitle': 'Supprimer l\'annonce',
        'marketplace.deleteConfirm': 'Êtes-vous sûr de vouloir supprimer "{title}" ?',
        'marketplace.deleteSuccess': 'Annonce supprimée',
        'marketplace.deleteError': 'Erreur lors de la suppression de l\'annonce',
        'marketplace.statusUpdateSuccess': 'Statut mis à jour: {status}',
        'marketplace.statusUpdateError': 'Erreur lors de la mise à jour du statut',



        // Teleconsultation
        'teleconsultation.title': 'Véto',
        'teleconsultation.subtitle': 'Consultez un vétérinaire à distance',
        'teleconsultation.new': 'Nouvelle consultation',
        'teleconsultation.scheduled': 'Programmées',
        'teleconsultation.inProgress': 'En cours',
        'teleconsultation.completed': 'Terminées',
        'teleconsultation.cancelled': 'Annulées',
        'teleconsultation.veterinarians': 'Vétérinaires',
        'teleconsultation.allStatuses': 'Tous les statuts',
        'teleconsultation.noConsultations': 'Aucune consultation',
        'teleconsultation.noResults': 'Aucun résultat',
        'teleconsultation.bookMessage': 'Prenez rendez-vous avec un vétérinaire pour commencer',
        'teleconsultation.filterMessage': 'Essayez de modifier vos filtres',
        'teleconsultation.bookingError': 'Erreur lors de la réservation. Veuillez réessayer.',





        // Settings
        'settings.title': 'Paramètres',
        'settings.appearance': 'Apparence',
        'settings.language': 'Langue',
        'settings.theme': 'Thème',
        'settings.notifications': 'Notifications',
        'settings.data': 'Données',
        'settings.units': 'Unités',
        'settings.reset': 'Réinitialiser',

        // Page Titles
        'page.dashboard': 'Tableau de bord',
        'page.herd': 'Gestion du Troupeau',
        'page.tasks': 'Tâches',
        'page.inventory': 'Inventaire',
        'page.accounting': 'Comptabilité',
        'page.settings': 'Paramètres',

        // Dashboard
        'dashboard.subtitle': 'Planifiez, priorisez et gérez votre élevage avec facilité.',
        'dashboard.welcome': 'Bienvenue sur Ladoum STD',
        'dashboard.myFarm': 'Ma Bergerie',
        'dashboard.user': 'Utilisateur',
        'dashboard.totalAnimals': 'Total Sujets',
        'dashboard.males': 'Mâles',
        'dashboard.females': 'Femelles',
        'dashboard.births': 'Naissances',
        'dashboard.births90d': 'Naissances (90j)',
        'dashboard.revenue': 'Revenus',
        'dashboard.featuredAnimals': 'Sujets en Vedette',
        'dashboard.viewAll': 'Voir tout',
        'dashboard.noAnimals': 'Aucun animal trouvé',
        'dashboard.filter.all': 'Tous',
        'dashboard.filter.males': 'Mâles',
        'dashboard.filter.females': 'Femelles',
        'dashboard.filter.certified': 'Certifiés',
        'dashboard.filter.recent': 'Récents',
        'dashboard.reminders': 'Rappels & Alertes',
        'dashboard.active': 'Actif',
        'dashboard.actives': 'Actifs',
        'dashboard.heats': 'Chaleurs à surveiller',
        'dashboard.heatsToWatch': 'brebis à surveiller',
        'dashboard.noHeats': 'Aucune chaleur prévue.',
        'dashboard.health': 'Santé à venir',
        'dashboard.healthReminders': 'rappel(s) sanitaire(s)',
        'dashboard.noHealth': 'Aucun rappel sanitaire.',
        'dashboard.stockAlerts': 'Alertes Stock',
        'dashboard.lowStock': 'article(s) en stock critique',
        'dashboard.noStock': 'Aucune alerte stock.',

        // Expert Card
        'expert.level': 'Niveau',
        'expert.certifiedFarm': 'Bergerie Certifiée',
        'expert.maxLevel': 'Niveau Maximum!',
        'expert.eliteProgress': 'Progression Elite',
        'expert.certified': 'Certifiés',
        'expert.goldPlus': 'Gold+',

        // Roles
        'role.owner': 'Propriétaire',
        'role.manager': 'Manager',
        'role.worker': 'Employé',
        'role.user': 'Utilisateur',
    },



    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.herd': 'Herd',
        'nav.pedigree': 'Pedigrees',
        'nav.reproduction': 'Reproduction',
        'nav.tasks': 'Tasks',
        'nav.inventory': 'Inventory',
        'nav.staff': 'Staff',
        'nav.vet': 'Vet',
        'nav.accounting': 'Accounting',
        'nav.marketplace': 'Marketplace',
        'nav.settings': 'Settings',
        'nav.profile': 'Profile',
        'nav.logout': 'Logout',

        // Theme
        'theme.light': 'Light Mode',
        'theme.dark': 'Dark Mode',
        'theme.system': 'System',

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
        'common.confirm': 'Confirm',
        'common.close': 'Close',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.today': 'Today',
        'common.tomorrow': 'Tomorrow',
        'common.daysAgo': '{days}d ago',
        'common.inDays': 'In {days}d',
        'task.unassigned': 'Unassigned',
        'task.dropHere': 'Drop here',
        'common.date': 'Date',
        'common.type': 'Type',
        'common.category': 'Category',
        'common.description': 'Description',
        'common.amount': 'Amount',
        'common.actions': 'Actions',
        'common.link': 'Link',
        'common.allTypes': 'All types',
        'common.allCategories': 'All categories',



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
        'animal.father': 'Father',
        'animal.mother': 'Mother',
        'animal.notes': 'Notes',

        // Herd Page
        'herd.title': 'My Herd',
        'herd.subtitle': 'Manage your Ladoum sheep',
        'herd.addAnimal': 'Add animal',
        'herd.searchPlaceholder': 'Search by name or ID...',
        'herd.all': 'All',
        'herd.active': 'Active',
        'herd.sold': 'Sold',
        'herd.noAnimals': 'No animals found.',


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
        'task.blocked': 'Blocked',
        'task.done': 'Done',
        'task.newTask': 'New Task',
        'task.assignedTo': 'Assigned to',
        'task.type': 'Type',
        'task.subtitle': 'Manage sheepfold activities.',
        'task.noTasks': 'No tasks found.',
        'task.changeStatus': 'Change status',
        'task.deleteSuccess': 'Task deleted',
        'task.deleteError': 'Error deleting task.',

        // Inventory
        'inventory.subtitle': 'Inventory and equipment tracking.',
        'inventory.add': 'Add item',
        'inventory.totalItems': 'Total Items',
        'inventory.lowStock': 'Low Stock',
        'inventory.totalValue': 'Total Value',
        'inventory.lowStockAlert': 'Low Stock Alert',
        'inventory.restockMessage': 'Need(s) restocking',
        'inventory.category.medicine': 'Medicine',
        'inventory.category.feed': 'Feed',
        'inventory.category.equipment': 'Equipment',
        'inventory.addedTo': 'added to',
        'inventory.removedFrom': 'removed from',
        'inventory.quantity': 'Quantity',
        'inventory.threshold': 'Threshold',
        'inventory.expiry': 'Auth',
        'inventory.addStock': 'Add stock',
        'inventory.removeStock': 'Remove stock',
        'inventory.noItems': 'No items found',

        // Accounting
        'accounting.title': 'Accounting',
        'accounting.subtitle': 'Manage your finances',
        'accounting.addTransaction': 'Add Transaction',
        'accounting.income': 'Income',
        'accounting.expense': 'Expenses',
        'accounting.balance': 'Balance',
        'accounting.category.feed': 'Feed',
        'accounting.category.health': 'Health',
        'accounting.category.reproduction': 'Reproduction',
        'accounting.category.personnel': 'Personnel',
        'accounting.category.infrastructure': 'Infrastructure',
        'accounting.category.sale': 'Sale',
        'accounting.category.purchase': 'Animal Purchase',
        'accounting.category.consultation': 'Consultation',
        'accounting.category.marketplace': 'Marketplace',
        'accounting.category.other': 'Other',
        'accounting.noTransactions': 'No transactions found',
        'accounting.transactionDeleted': 'Transaction deleted',
        'accounting.deleteError': 'Error deleting transaction.',

        // Marketplace
        'marketplace.title': 'Marketplace',
        'marketplace.subtitle': 'Buy and sell animals, feed and services',
        'marketplace.new': 'New Listing',
        'marketplace.search': 'Search a listing...',
        'marketplace.filter': 'Filters',
        'marketplace.category.animal': 'Animals',
        'marketplace.category.feed': 'Feed',
        'marketplace.category.equipment': 'Equipment',
        'marketplace.category.service': 'Services',
        'marketplace.status.available': 'Available',
        'marketplace.status.reserved': 'Reserved',
        'marketplace.status.sold': 'Sold',
        'marketplace.allRegions': 'All regions',
        'marketplace.totalListings': 'Total Listings',
        'marketplace.availableListings': 'Available',
        'marketplace.animalListings': 'Animals',
        'marketplace.noListings': 'No listings found',
        'marketplace.createFirst': 'Start by creating your first listing',
        'marketplace.adjustFilters': 'Try adjusting your search criteria',
        'marketplace.create': 'Create a listing',
        'marketplace.loading': 'Loading listings...',
        'marketplace.error': 'Error loading listings',
        'marketplace.retry': 'Retry',
        'marketplace.deleteTitle': 'Delete listing',
        'marketplace.deleteConfirm': 'Are you sure you want to delete "{title}"?',
        'marketplace.deleteSuccess': 'Listing deleted',
        'marketplace.deleteError': 'Error deleting listing',
        'marketplace.statusUpdateSuccess': 'Status updated: {status}',
        'marketplace.statusUpdateError': 'Error updating status',



        // Teleconsultation
        'teleconsultation.title': 'Vet',
        'teleconsultation.subtitle': 'Consult a veterinarian remotely',
        'teleconsultation.new': 'New Consultation',
        'teleconsultation.scheduled': 'Scheduled',
        'teleconsultation.inProgress': 'In Progress',
        'teleconsultation.completed': 'Completed',
        'teleconsultation.cancelled': 'Cancelled',
        'teleconsultation.veterinarians': 'Veterinarians',
        'teleconsultation.allStatuses': 'All Statuses',
        'teleconsultation.noConsultations': 'No consultations',
        'teleconsultation.noResults': 'No results',
        'teleconsultation.bookMessage': 'Book an appointment to start',
        'teleconsultation.filterMessage': 'Try adjusting your filters',
        'teleconsultation.bookingError': 'Booking error. Please try again.',





        // Settings
        'settings.title': 'Settings',
        'settings.appearance': 'Appearance',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        'settings.notifications': 'Notifications',
        'settings.data': 'Data',
        'settings.units': 'Units',
        'settings.reset': 'Reset',

        // Page Titles
        'page.dashboard': 'Dashboard',
        'page.herd': 'Herd Management',
        'page.tasks': 'Tasks',
        'page.inventory': 'Inventory',
        'page.accounting': 'Accounting',
        'page.settings': 'Settings',

        // Dashboard
        'dashboard.subtitle': 'Plan, prioritize and manage your farm with ease.',
        'dashboard.welcome': 'Welcome to Ladoum STD',
        'dashboard.myFarm': 'My Farm',
        'dashboard.user': 'User',
        'dashboard.totalAnimals': 'Total Animals',
        'dashboard.males': 'Males',
        'dashboard.females': 'Females',
        'dashboard.births': 'Births',
        'dashboard.births90d': 'Births (90d)',
        'dashboard.revenue': 'Revenue',
        'dashboard.featuredAnimals': 'Featured Animals',
        'dashboard.viewAll': 'View all',
        'dashboard.noAnimals': 'No animals found',
        'dashboard.filter.all': 'All',
        'dashboard.filter.males': 'Males',
        'dashboard.filter.females': 'Females',
        'dashboard.filter.certified': 'Certified',
        'dashboard.filter.recent': 'Recent',
        'dashboard.reminders': 'Reminders & Alerts',
        'dashboard.active': 'Active',
        'dashboard.actives': 'Actives',
        'dashboard.heats': 'Heats to watch',
        'dashboard.heatsToWatch': 'ewes to watch',
        'dashboard.noHeats': 'No heats expected.',
        'dashboard.health': 'Upcoming health',
        'dashboard.healthReminders': 'health reminder(s)',
        'dashboard.noHealth': 'No health reminders.',
        'dashboard.stockAlerts': 'Stock Alerts',
        'dashboard.lowStock': 'item(s) low on stock',
        'dashboard.noStock': 'No stock alerts.',

        // Expert Card
        'expert.level': 'Level',
        'expert.certifiedFarm': 'Certified Farm',
        'expert.maxLevel': 'Max Level!',
        'expert.eliteProgress': 'Elite Progress',
        'expert.certified': 'Certified',
        'expert.goldPlus': 'Gold+',

        // Roles
        'role.owner': 'Owner',
        'role.manager': 'Manager',
        'role.worker': 'Worker',
        'role.user': 'User',

    },


    wo: {
        // Navigation
        'nav.dashboard': 'Xët',
        'nav.herd': 'Xar yi',
        'nav.pedigree': 'Askan',
        'nav.reproduction': 'Liggant',
        'nav.tasks': 'Liggéey yi',
        'nav.inventory': 'Dépôt',
        'nav.staff': 'Ligéeykatu yi',
        'nav.vet': 'Doktoor',
        'nav.accounting': 'Xaalis',
        'nav.marketplace': 'Marse',
        'nav.settings': 'Paramètre yi',
        'nav.profile': 'Profil',
        'nav.logout': 'Génne',

        // Theme
        'theme.light': 'Ci leer',
        'theme.dark': 'Ci lëndëm',
        'theme.system': 'Système',

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
        'common.confirm': 'Dugal',
        'common.close': 'Tëj',
        'common.back': 'Dellu',
        'common.next': 'Jëm kanam',
        'common.previous': 'Jàll',
        'common.yes': 'Waaw',
        'common.no': 'Déet',
        'common.today': 'Tay',
        'common.tomorrow': 'Suba',
        'common.daysAgo': 'Am na {days} bés',
        'common.inDays': 'Ci {days} bés',
        'task.unassigned': 'Kenn ñowul ci',
        'task.dropHere': 'Tek fi',
        'common.date': 'Taarix',
        'common.type': 'Xeet',
        'common.category': 'Wàll',
        'common.description': 'Leeral',
        'common.amount': 'Njëkk',
        'common.actions': 'Jëf',
        'common.link': 'Lien',
        'common.allTypes': 'Xeet yépp',
        'common.allCategories': 'Wàll yépp',



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
        'animal.father': 'Baay',
        'animal.mother': 'Yaay',
        'animal.notes': 'Xam-xam',

        // Herd Page
        'herd.title': 'Sama Xar yi',
        'herd.subtitle': 'Saytu sa xar Ladoum yi',
        'herd.addAnimal': 'Yokk xar',
        'herd.searchPlaceholder': 'Seet tur walla numéro...',
        'herd.all': 'Yépp',
        'herd.active': 'Yuñ aktif',
        'herd.sold': 'Yuñ jaay',
        'herd.noAnimals': 'Amul xar.',


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
        'task.blocked': 'Tëj nañu ko',
        'task.done': 'Jeexal',
        'task.newTask': 'Liggéey bu bees',
        'task.assignedTo': 'Jox ko',
        'task.type': 'Xeet',
        'task.subtitle': 'Saytu liggéey kër gi.',
        'task.noTasks': 'Amul liggéey.',
        'task.changeStatus': 'Soppi état',
        'task.deleteSuccess': 'Liggéey far na',
        'task.deleteError': 'Am na njuumte ci far liggéey bi.',

        // Inventory
        'inventory.subtitle': 'Saytu stock ak matériel bi.',
        'inventory.add': 'Yokk article',
        'inventory.totalItems': 'Article yi yépp',
        'inventory.lowStock': 'Stock bu néew',
        'inventory.totalValue': 'Njëkk li yépp',
        'inventory.lowStockAlert': 'Alerte Stock bu néew',
        'inventory.restockMessage': 'soxla na yokkuaat',
        'inventory.category.medicine': 'Faju',
        'inventory.category.feed': 'Dund',
        'inventory.category.equipment': 'Jumtukay',
        'inventory.addedTo': 'yokk nañu ci',
        'inventory.removedFrom': 'waññi nañu ci',
        'inventory.quantity': 'Lim',
        'inventory.threshold': 'Lim bu néew',
        'inventory.expiry': 'Exp',
        'inventory.addStock': 'Yokk stock',
        'inventory.removeStock': 'Waññi stock',
        'inventory.noItems': 'Amul benn article',

        // Accounting
        'accounting.title': 'Xaalis',
        'accounting.subtitle': 'Saytu sa alal',
        'accounting.addTransaction': 'Yokk transaction',
        'accounting.income': 'Dugal',
        'accounting.expense': 'Génne',
        'accounting.balance': 'Desit',
        'accounting.category.feed': 'Dund',
        'accounting.category.health': 'Wergu yaram',
        'accounting.category.reproduction': 'Liggant',
        'accounting.category.personnel': 'Ligéeykatu',
        'accounting.category.infrastructure': 'Tabax',
        'accounting.category.sale': 'Jaay',
        'accounting.category.purchase': 'Jënd',
        'accounting.category.consultation': 'Consultation',
        'accounting.category.marketplace': 'Marse',
        'accounting.category.other': 'Yeneen',

        // Marketplace
        'marketplace.title': 'Marse',
        'marketplace.subtitle': 'Jënd ak jaay xar, dund ak yeneen',
        'marketplace.new': 'Annonce bu bees',
        'marketplace.search': 'Seet annonce...',
        'marketplace.filter': 'Filtre',
        'marketplace.category.animal': 'Xar yi',
        'marketplace.category.feed': 'Dund',
        'marketplace.category.equipment': 'Jumtukay',
        'marketplace.category.service': 'Service',
        'marketplace.status.available': 'Jaafe na',
        'marketplace.status.reserved': 'Téye nañu ko',
        'marketplace.status.sold': 'Jaay nañu ko',
        'marketplace.allRegions': 'Gox yépp',
        'marketplace.totalListings': 'Annonce yépp',
        'marketplace.availableListings': 'Li jaafe',
        'marketplace.animalListings': 'Xar yi',
        'marketplace.noListings': 'Amul benn annonce',
        'marketplace.createFirst': 'Defal sa première annonce',
        'marketplace.adjustFilters': 'Soppil sa seet',
        'marketplace.create': 'Defar annonce',
        'marketplace.loading': 'Mingiy yéewal...',
        'marketplace.error': 'Am na njuumte ci charge bi',
        'marketplace.retry': 'Jéemaat',
        'marketplace.deleteTitle': 'Far annonce bi',
        'marketplace.deleteConfirm': 'Danga bëgg far "{title}"?',
        'marketplace.deleteSuccess': 'Annonce bi far na',
        'marketplace.deleteError': 'Am na njuumte ci far bi',
        'marketplace.statusUpdateSuccess': 'Statut bi soppéku na: {status}',
        'marketplace.statusUpdateError': 'Am na njuumte ci soppi statut bi',


        // Teleconsultation
        'teleconsultation.title': 'Doktoor',
        'teleconsultation.subtitle': 'Waxtaan ak doktoor',
        'teleconsultation.new': 'Consultation bu bees',
        'teleconsultation.scheduled': 'Programmé',
        'teleconsultation.inProgress': 'Ci biir',
        'teleconsultation.completed': 'Paré',
        'teleconsultation.cancelled': 'Annulé',
        'teleconsultation.veterinarians': 'Doktoor yi',
        'teleconsultation.allStatuses': 'État yépp',
        'teleconsultation.noConsultations': 'Amul consultation',
        'teleconsultation.noResults': 'Amul résulat',
        'teleconsultation.bookMessage': 'Jëllal rendez-vous',
        'teleconsultation.filterMessage': 'Soppil sa filtre',
        'teleconsultation.bookingError': 'Am na njuumte.',





        // Settings
        'settings.title': 'Paramètre yi',
        'settings.appearance': 'Mel',
        'settings.language': 'Làkk',
        'settings.theme': 'Thème',
        'settings.notifications': 'Xëtu mbind',
        'settings.data': 'Données',
        'settings.units': 'Unités',
        'settings.reset': 'Soppi',

        // Page Titles
        'page.dashboard': 'Xët',
        'page.herd': 'Xar yi',
        'page.tasks': 'Liggéey yi',
        'page.inventory': 'Dépôt',
        'page.accounting': 'Xaalis',
        'page.settings': 'Paramètre yi',

        // Dashboard
        'dashboard.subtitle': 'Planifie, organise sa keroog yi.',
        'dashboard.welcome': 'Dalal jàmm ci Ladoum STD',
        'dashboard.myFarm': 'Sama Kër',
        'dashboard.user': 'Jëfandikukat',
        'dashboard.totalAnimals': 'Xar yi yépp',
        'dashboard.males': 'Góor yi',
        'dashboard.females': 'Jigéen yi',
        'dashboard.births': 'Juddu',
        'dashboard.births90d': 'Juddu (90 fan)',
        'dashboard.revenue': 'Xaalis bi',
        'dashboard.featuredAnimals': 'Xar yuñu tànn',
        'dashboard.viewAll': 'Xool yépp',
        'dashboard.noAnimals': 'Amul xar',
        'dashboard.filter.all': 'Yépp',
        'dashboard.filter.males': 'Góor yi',
        'dashboard.filter.females': 'Jigéen yi',
        'dashboard.filter.certified': 'Yuñu sertifié',
        'dashboard.filter.recent': 'Yu bees',
        'dashboard.reminders': 'Fàttali yi',
        'dashboard.active': 'Aktif',
        'dashboard.actives': 'Aktif yi',
        'dashboard.heats': 'Chaleurs yuñ seet',
        'dashboard.heatsToWatch': 'jigéen yu seet',
        'dashboard.noHeats': 'Amul chaleur.',
        'dashboard.health': 'Wéram bu ñëw',
        'dashboard.healthReminders': 'fàttali wéram',
        'dashboard.noHealth': 'Amul fàttali wéram.',
        'dashboard.stockAlerts': 'Alertes Stock',
        'dashboard.lowStock': 'yu néew ci stock',
        'dashboard.noStock': 'Amul alerte stock.',

        // Expert Card
        'expert.level': 'Tolliwaay',
        'expert.certifiedFarm': 'Bergerie Certifiée',
        'expert.maxLevel': 'Tolliwaay bu Kawé!',
        'expert.eliteProgress': 'Jëm Elite',
        'expert.certified': 'Certifiés',
        'expert.goldPlus': 'Gold+',

        // Roles
        'role.owner': 'Borom',
        'role.manager': 'Manager',
        'role.worker': 'Ligéeykatu',
        'role.user': 'Jëfandikukat',
    },
};


