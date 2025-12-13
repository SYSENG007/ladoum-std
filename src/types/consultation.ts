// Veterinarian partner
export interface Veterinarian {
    id: string;
    name: string;
    photoUrl?: string;
    specialty: 'General' | 'Reproduction' | 'Nutrition' | 'Surgery';
    availability: 'Available' | 'Busy' | 'Offline';
    rating: number;
    consultationCount: number;
    phone?: string;
    email?: string;
}

// Consultation types
export type ConsultationType = 'Health' | 'Reproduction' | 'Nutrition';
export type ConsultationStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded';
export type PaymentMethod = 'MobileMoney' | 'Card';

// Main Consultation entity
export interface Consultation {
    id: string;
    farmerId: string;
    veterinarianId: string;
    veterinarianName?: string; // Denormalized for display
    animalIds: string[]; // Multiple animals possible
    type: ConsultationType;
    status: ConsultationStatus;
    scheduledDate: string;
    scheduledTime?: string;
    startedAt?: string;
    completedAt?: string;
    notes?: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    amount: number;
    createdAt: string;
}

// Chat message types
export type MessageType = 'text' | 'image' | 'video' | 'document';

export interface ConsultationMessage {
    id: string;
    consultationId: string;
    senderId: string;
    senderName: string;
    senderRole: 'Farmer' | 'Vet';
    type: MessageType;
    content: string;
    mediaUrl?: string;
    timestamp: string;
}

// Prescription within a report
export interface Prescription {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
}

// Follow-up task generated from consultation
export interface FollowUpTask {
    title: string;
    description: string;
    dueDate: string;
    type: 'Treatment' | 'Checkup' | 'Weighing' | 'Other';
    animalId: string;
}

// Consultation report (compte rendu)
export interface ConsultationReport {
    id: string;
    consultationId: string;
    diagnosis: string;
    recommendations: string[];
    prescriptions: Prescription[];
    followUpTasks: FollowUpTask[];
    createdAt: string;
    veterinarianId: string;
    veterinarianName: string;
}
