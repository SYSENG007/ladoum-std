export type Gender = 'Male' | 'Female';

export interface Measurement {
    date: string;
    weight: number; // kg
    height_hg: number; // Hauteur au garrot (cm)
    length_lcs: number; // Longueur corps scapulo-ischiale (cm)
    chest_tp: number; // Tour de poitrine (cm)
}

export type CertificationLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite';
export type CertificationStatus = 'Pending' | 'Certified' | 'Rejected';

export interface Certification {
    id: string;
    type: 'Bergerie' | 'Animal';
    level: CertificationLevel;
    date: string;
    expiryDate: string;
    authority: string;
}

export interface HealthRecord {
    id: string;
    date: string;
    type: 'Vaccination' | 'Treatment' | 'Vitamin' | 'Checkup';
    description: string;
    medicationId?: string; // Link to InventoryItem
    dose?: string;
    nextDueDate?: string;
    performer: string;
}

export interface NutritionItem {
    inventoryItemId: string; // Link to InventoryItem
    quantity: number;
    unit: string;
    frequency: 'Daily' | 'Weekly';
}

export interface NutritionPlan {
    id: string;
    name: string;
    items: NutritionItem[];
    notes?: string;
}

// Extended reproduction event types
export type ReproductionEventType =
    | 'Heat' | 'Mating' | 'Ultrasound' | 'Birth' | 'Abortion' | 'Weaning' | 'Lactation';

// Heat cycle record for individual heat events
export interface HeatRecord {
    id: string;
    date: string;
    duration?: number; // hours
    intensity?: 'Low' | 'Medium' | 'High';
    notes?: string;
    resultedInMating?: boolean;
}

// Heat prediction result
export interface HeatPrediction {
    nextHeatDate: string;
    windowStart: string; // -2 days
    windowEnd: string;   // +2 days
    confidence: 'Low' | 'Medium' | 'High';
    basedOnCycles: number;
    averageCycleLength: number;
    reproductiveStatus: ReproductiveStatus;
}

// Current reproductive status of a female
export type ReproductiveStatus =
    | 'Available'
    | 'InHeat'
    | 'AwaitingConfirmation'  // 0-20 days post-mating: monitoring for heat return (failed) or ultrasound
    | 'Pregnant'
    | 'Lactating'
    | 'Resting';

// Comprehensive Reproduction Event (NEW - for service-based event tracking)
export interface ReproductionEvent {
    id: string;
    farmId?: string;
    animalId: string;       // Female animal
    type: 'Heat' | 'Mating' | 'Pregnancy' | 'Birth' | 'Abortion' | 'Weaning';
    date: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;

    // Heat specific
    intensity?: 'Low' | 'Medium' | 'High';
    duration?: number; // hours

    // Mating specific
    maleId?: string;
    matingType?: 'Natural' | 'AI'; // Artificial Insemination

    // Pregnancy specific
    confirmedDate?: string;
    confirmationMethod?: 'Ultrasound' | 'Observation';
    expectedDueDate?: string;

    // Birth specific
    litterSize?: number;
    offspringIds?: string[];
    complications?: string;

    // Weaning specific
    weaningWeight?: number; // kg (aggregate or individual)
}

// Gestation prediction result
export interface GestationPrediction {
    expectedBirthDate: string;
    windowStart: string;      // -5 days
    windowEnd: string;        // +5 days
    daysRemaining: number;
    matingDate: string;
    confidence: 'Low' | 'Medium' | 'High';
}

// Morphometric prediction result
export interface MorphometricPrediction {
    predictedHG: number; // Hauteur au garrot
    predictedLCS: number; // Longueur corps
    predictedTP: number; // Tour de poitrine
    confidenceHG: 'Low' | 'Medium' | 'High';
    confidenceLCS: 'Low' | 'Medium' | 'High';
    confidenceTP: 'Low' | 'Medium' | 'High';
    comparedToHerdAverage: {
        hg: number; // percentage difference
        lcs: number;
        tp: number;
    };
}

// Breeding compatibility result
export interface BreedingCompatibility {
    overallScore: number; // 0-100
    inbreedingCoefficient: number; // 0-1, lower is better
    inbreedingRisk: 'Low' | 'Medium' | 'High';
    morphometricScore: number; // 0-100
    morphometricPrediction: MorphometricPrediction;
    commonAncestors: string[]; // ancestor IDs
    recommendation: 'Excellent' | 'Good' | 'Caution' | 'NotRecommended';
}

export interface ReproductionRecord {
    id: string;
    date: string;
    type: ReproductionEventType;
    mateId?: string;
    notes?: string;
    outcome?: string;
    // Additional fields for specific event types
    heatIntensity?: 'Low' | 'Medium' | 'High'; // For Heat events
    heatDuration?: number; // hours, for Heat events
    offspringCount?: number; // For Birth events
    weaningDate?: string; // For tracking weaning
    ultrasoundResult?: 'Positive' | 'Negative'; // For Ultrasound events
}

export interface TransactionRecord {
    id: string;
    date: string;
    type: 'Purchase' | 'Sale' | 'Transfer';
    amount: number;
    party: string;
    notes?: string;
}

export type AnimalStatus = 'Active' | 'Sold' | 'Deceased' | 'External';

export interface Animal {
    id: string;
    farmId?: string; // Multi-farm support
    name: string;
    tagId: string;
    photoUrl: string;
    gender: 'Male' | 'Female';
    birthDate: string;
    breed: string;
    status: AnimalStatus;
    weight: number; // kg
    height: number; // cm
    length: number; // cm
    chestGirth: number; // cm
    sireId?: string;
    damId?: string;
    certification?: Certification;
    measurements?: Measurement[];
    healthRecords?: HealthRecord[];
    nutritionPlan?: NutritionPlan;
    reproductionRecords?: ReproductionRecord[];
    transactions?: TransactionRecord[];
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In Progress' | 'Blocked' | 'Done';
export type TaskType = 'Health' | 'Feeding' | 'Reproduction' | 'General';

export interface Task {
    id: string;
    farmId?: string; // Multi-farm support
    title: string;
    date: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    assignedTo?: string | string[]; // Single user ID or multiple user IDs for group tasks
    animalId?: string;   // Link to associated animal
    description?: string; // Task description
}

export type InventoryCategory = 'Feed' | 'Medicine' | 'Equipment';

export interface InventoryItem {
    id: string;
    farmId?: string; // Multi-farm support
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    minThreshold: number;
}

export interface User {
    id: string;
    name: string;
    role: 'Owner' | 'Shepherd' | 'Vet';
    photoUrl?: string;
}

// ============================================
// MARKETPLACE TYPES
// ============================================

// Listing categories
export type ListingCategory = 'Animal' | 'Feed' | 'Equipment' | 'Service';

// Listing status with visual tags
export type ListingStatus = 'Available' | 'Reserved' | 'Sold' | 'Closed';

// Service types for the Service category
export type ServiceType = 'Transport' | 'Insemination' | 'Veterinary' | 'Consultation' | 'Other';

// Region options for Senegal
export type SenegalRegion =
    | 'Dakar' | 'Thiès' | 'Diourbel' | 'Saint-Louis' | 'Louga'
    | 'Matam' | 'Tambacounda' | 'Kédougou' | 'Kolda' | 'Sédhiou'
    | 'Ziguinchor' | 'Fatick' | 'Kaolack' | 'Kaffrine';

// Animal data snapshot for listings
export interface ListingAnimalData {
    name: string;
    gender: Gender;
    birthDate: string;
    weight?: number;
    height_hg?: number;
    length_lcs?: number;
    chest_tp?: number;
    sireId?: string;
    sireName?: string;
    damId?: string;
    damName?: string;
    photoUrl?: string;
}

// Marketplace listing interface
export interface Listing {
    id: string;
    title: string;
    description: string;
    category: ListingCategory;
    status: ListingStatus;
    price: number;
    currency: 'XOF' | 'EUR';
    photos: string[];

    // Location
    region: SenegalRegion;
    city?: string;

    // Contact
    sellerName: string;
    sellerPhone?: string;
    sellerWhatsapp?: string;

    // For Animal listings - link to existing animal
    animalId?: string;
    animalData?: ListingAnimalData;

    // For Service listings
    serviceType?: ServiceType;

    // Metadata
    farmId?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

// ============================================
// ACCOUNTING TYPES
// ============================================

// Catégories de transactions adaptées à l'élevage
export type TransactionCategory =
    | 'Feed'           // Alimentation
    | 'Health'         // Santé/Soins vétérinaires
    | 'Reproduction'   // Frais reproduction
    | 'Personnel'      // Main-d'œuvre/Salaires
    | 'Infrastructure' // Équipements/Bâtiments
    | 'Sale'           // Vente d'animaux
    | 'Purchase'       // Achat d'animaux
    | 'Consultation'   // Téléconsultation vétérinaire
    | 'Marketplace'    // Ventes/Achats marketplace
    | 'Other';         // Divers

export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
    id: string;
    farmId?: string; // Multi-farm support
    date: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number; // en FCFA
    description: string;
    // Liens optionnels vers d'autres modules
    animalId?: string;        // Lien vers animal (vente/achat)
    inventoryItemId?: string; // Lien vers inventaire (achat)
    taskId?: string;          // Lien vers tâche
    consultationId?: string;  // Lien vers téléconsultation
    listingId?: string;       // Lien vers annonce marketplace
    createdAt: string;
    updatedAt: string;
}
