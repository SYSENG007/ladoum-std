// Staff Management Types - Ladoum STD

/**
 * Extended member information with permissions
 */
export interface StaffMember {
    id: string;
    farmId: string;
    userId: string;
    email: string;
    displayName: string;
    role: 'owner' | 'manager' | 'worker';
    canAccessFinances: boolean; // Configurable for managers
    phone?: string;
    photoUrl?: string;
    joinedAt: string;
    status: 'active' | 'inactive' | 'pending';
}

/**
 * Attendance record for tracking presence
 */
export interface Attendance {
    id: string;
    memberId: string;
    memberName: string;
    farmId: string;
    date: string; // YYYY-MM-DD
    checkIn?: string; // ISO datetime
    checkOut?: string; // ISO datetime
    status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Work shift for scheduling
 */
export interface Shift {
    id: string;
    memberId: string;
    memberName: string;
    farmId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    type: 'normal' | 'overtime' | 'on-call';
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: string;
}

/**
 * Performance review for tracking employee metrics
 */
export interface PerformanceReview {
    id: string;
    memberId: string;
    memberName: string;
    farmId: string;
    period: string; // 'YYYY-MM'
    tasksCompleted: number;
    tasksAssigned: number;
    attendanceRate: number; // 0-100%
    rating: 1 | 2 | 3 | 4 | 5;
    strengths?: string[];
    improvements?: string[];
    notes?: string;
    reviewedBy: string;
    reviewerName: string;
    createdAt: string;
}

/**
 * Invitation to join the farm
 */
export interface StaffInvitation {
    id: string;
    farmId: string;
    farmName: string;
    email: string;
    displayName: string;
    role: 'manager' | 'worker';
    canAccessFinances: boolean;
    invitedBy: string;
    inviterName: string;
    token: string; // Unique token for accepting invitation
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expiresAt: string;
    createdAt: string;
    acceptedAt?: string;
}

/**
 * Attendance statistics for a member
 */
export interface AttendanceStats {
    memberId: string;
    period: string; // 'YYYY-MM'
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    daysLeave: number;
    attendanceRate: number; // Percentage
}

/**
 * Task assignment extension
 */
export interface TaskAssignment {
    assignedTo: string; // userId
    assignedToName: string;
    assignedAt: string;
    assignedBy: string;
}
