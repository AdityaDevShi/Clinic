// User roles
export type UserRole = 'client' | 'therapist' | 'admin';

// Base user type
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    photoUrl?: string;
}

// Therapist extends user with additional info
export interface Therapist {
    id: string; // Same as user id
    name: string;
    email: string;
    specialization: string;
    bio: string;
    photoUrl?: string;
    isOnline: boolean;
    isEnabled: boolean;
    hourlyRate: number;
    lastOnline: Date;
    qualifications?: string[];
    languages?: string[];
    rating?: number;
    reviewCount?: number;
}

// Therapist availability schedule
export interface Availability {
    id: string;
    therapistId: string;
    dayOfWeek: number; // 0-6, Sunday-Saturday
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    isBreak: boolean;
}

// Therapist busy/unavailable slots
export interface BusySlot {
    id: string;
    therapistId: string;
    startTime: Date;
    endTime: Date;
    reason?: string;
}

// Booking status
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

// Booking type
export interface Booking {
    id: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    therapistId: string;
    therapistName: string;
    sessionTime: Date;
    duration: number; // in minutes
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    amount: number;
    serviceId?: string;
    serviceName?: string;
    createdAt: Date;
    notes?: string;
}

// Session notes by therapist
export interface Session {
    id: string;
    bookingId: string;
    therapistId: string;
    clientId: string;
    notes: string; // Rich text
    sessionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Files uploaded for sessions
export interface SessionFile {
    id: string;
    sessionId: string;
    therapistId: string;
    clientId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
}

// Feedback from clients
export interface Feedback {
    id: string;
    bookingId: string;
    clientId: string;
    clientName: string;
    therapistId: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: Date;
    isPublic: boolean;
}

// Services offered
export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number; // in minutes
    isPackage: boolean;
    sessionCount: number; // 1 for single consultations
    isActive: boolean;
}

// Time slot for availability display
export interface TimeSlot {
    time: string; // HH:mm format
    date: Date;
    isAvailable: boolean;
}
