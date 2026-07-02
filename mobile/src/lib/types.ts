// Ported from clinic-app/src/types/index.ts — keep in sync with the web app.

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
    expoPushTokens?: string[];
}

// Therapist extends user with additional info
export interface Therapist {
    id: string; // Same as user id
    name: string;
    email: string;
    specialization: string;
    bio: string;
    photoUrl?: string;
    isEnabled: boolean;
    hourlyRate: number;
    qualifications?: string[];
    languages?: string[];
    rating?: number;
    reviewCount?: number;
    // Enhanced Profile Fields
    about?: string;
    patientsHelped?: number;
    research?: string;
    recommendedFor?: string[];
    recommendations?: string[];
    testimonials?: { id: string; author: string; content: string; rating: number }[];
    certificates?: { id: string; title: string; url: string }[];
    referralLinks?: { name: string; url: string }[];
    mediaMentions?: { id: string; title: string; url: string; publisher: string; date: string }[];
    therapyModes?: string[];
    availabilitySummary?: string;
    // Discount Pricing
    discountEnabled?: boolean;
    discountedRate?: number;
    // Admin Display Order
    displayOrder?: number;
    // Dynamic Scheduling Fields
    sessionDuration?: string; // e.g. "50-60 Minutes"
    workingHoursStart?: string; // "10:00"
    workingHoursEnd?: string; // "19:00"
    lunchBreakStart?: string; // "13:00"
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
export type BookingStatus = 'pending_payment' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
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
    isRated?: boolean;
    meetLink?: string;
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

// Time slot for availability display
export interface TimeSlot {
    time: string; // HH:mm format
    date: Date;
    isAvailable: boolean;
}

// Therapist patient note
export interface PatientNote {
    id: string;
    therapistId: string;
    clientId: string;
    content: string;
    createdAt: Date;
}

// Therapist patient attachment metadata
export interface PatientAttachment {
    id: string;
    therapistId: string;
    clientId: string;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    storagePath?: string;
    createdAt: Date;
}

// Manually added patient (pre-existing, no account)
export interface ManualPatient {
    id: string;
    therapistId: string;
    name: string;
    email?: string;
    phone?: string;
    createdAt: Date;
}

// Blog post
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    authorId: string;
    authorName: string;
    imageUrls?: string[];
    videoUrl?: string;
    createdAt: Date;
}
