export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  medicalHistory: string;
  allergies?: string;
  medications?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'exam' | 'procedure' | 'return';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  price: number;
  paid: boolean;
  paymentMethod?: 'cash' | 'card' | 'pix' | 'insurance';
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod?: 'cash' | 'card' | 'pix' | 'bank_transfer';
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  appointmentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  specialties: string[];
  logo?: string;
  aiConfig?: {
    enabled: boolean;
    knowledgeBase: string;
    tone: 'professional' | 'friendly' | 'casual';
    autoScheduling: boolean;
  };
  whatsappConfig?: {
    enabled: boolean;
    evolutionApiUrl: string;
    webhookUrl: string;
    qrCode?: string;
  };
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
  security?: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
    auditLog: boolean;
  };
  backup?: {
    autoBackup: boolean;
    frequency: string;
    retention: number;
    lastBackup?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  permissions: string[];
  createdAt: string;
}

export interface DashboardMetrics {
  todayPatients: number;
  scheduledAppointments: number;
  occupancyRate: number;
  monthlyRevenue: number;
  waitingPatients: number;
  inConsultationPatients: number;
  completedToday: number;
}

export type PatientStatus = 'waiting' | 'in-consultation' | 'completed' | 'scheduled' | 'cancelled';

export interface PatientWithStatus extends Patient {
  status: PatientStatus;
  appointmentTime?: string;
  currentAppointment?: Appointment;
}

export interface WaitlistEntry {
  id: string;
  patientId?: string;
  patientName: string;
  contact: string;
  preferredDoctor?: string;
  preferredDate?: string;
  createdAt: string;
  status: 'waiting' | 'contacted' | 'scheduled';
  notes?: string;
}

export interface PatientHistory {
  totalAppointments: number;
  lastAppointment?: Appointment;
  lastAppointmentDate?: string;
  lastExam?: Appointment;
  isNew: boolean;
}

export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  license?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'secretary';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIPOS PARA SISTEMA DE ENSALAMENTO
// ============================================================================

export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  features: RoomFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface RoomFeatures {
  area_m2?: number;
  macas?: number;
  maca_exame?: number;
  computador?: boolean;
  ar_condicionado?: boolean;
  pia?: boolean;
  equipamentos_cirurgicos?: boolean;
  laser?: boolean;
  som_ambiente?: boolean;
  iluminacao_ajustavel?: boolean;
  ultrassom?: boolean;
  ecg?: boolean;
  multiplo_uso?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface DoctorRoomPreference {
  professionalId: string;
  roomId: string;
  priority: number;
  createdAt: string;
}

export interface RoomBlocking {
  id: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

export interface RoomAllocation {
  id: string;
  appointmentId: string;
  roomId: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAllocationFull extends RoomAllocation {
  roomName: string;
  professionalName: string;
  professionalSpecialty?: string;
  durationMinutes: number;
}

export interface CandidateRoom {
  roomId: string;
  roomName: string;
  preferencePriority: number;
  dayLoadMinutes: number;
  features: RoomFeatures;
}

export interface AlternativeSlot {
  roomId: string;
  roomName: string;
  suggestedStarts: string;
  suggestedEnds: string;
  offsetMinutes: number;
}

export interface RoomScheduleEntry {
  allocationId: string;
  appointmentId: string;
  professionalId: string;
  professionalName: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
}

export interface ProfessionalScheduleEntry {
  allocationId: string;
  appointmentId: string;
  roomId: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
}

export interface RoomStats {
  id: string;
  name: string;
  isActive: boolean;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  minutesUsedToday: number;
  occupancyRateTodayPct: number;
}

export interface AllocationAudit {
  id: string;
  allocationId?: string;
  appointmentId?: string;
  action: 'created' | 'updated' | 'deleted' | 'conflict';
  oldRoomId?: string;
  newRoomId?: string;
  oldTime?: string;
  newTime?: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

// Tipos para eventos do calendário de ensalamento
export interface RoomCalendarEvent {
  id: string;
  resourceId: string; // roomId ou professionalId
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    appointmentId: string;
    professionalId?: string;
    professionalName?: string;
    roomId?: string;
    roomName?: string;
    specialty?: string;
    allocationId?: string;
  };
}

export interface RoomCalendarResource {
  id: string;
  title: string;
  eventBackgroundColor?: string;
  eventBorderColor?: string;
  extendedProps?: {
    features?: RoomFeatures;
    specialty?: string;
    isActive?: boolean;
  };
}
