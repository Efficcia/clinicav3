import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Patient,
  Appointment,
  FinancialEntry,
  Company,
  DashboardMetrics,
  PatientWithStatus,
  User,
  WaitlistEntry,
  PatientHistory,
  Professional,
  TeamMember,
} from '@/types';

const DEFAULT_INCOME_CATEGORIES = [
  'Consultas',
  'Procedimentos',
  'Exames',
  'Convênios',
  'Particular',
  'Venda de Equipamentos',
  'Venda de Móveis',
  'Empréstimos',
  'Aporte de Sócios',
  'Financiamentos',
  'Outros',
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Salários',
  'Encargos',
  'Aluguel',
  'Materiais Médicos',
  'Medicamentos',
  'Energia Elétrica',
  'Telefone/Internet',
  'Manutenção',
  'Marketing',
  'Contabilidade',
  'Seguros',
  'Impostos',
  'Equipamentos Médicos',
  'Móveis e Utensílios',
  'Tecnologia',
  'Reformas',
  'Pagamento de Empréstimos',
  'Dividendos',
  'Amortização de Financiamentos',
  'Outros',
];

type CategoryType = 'income' | 'expense';
export const FALLBACK_CATEGORY = 'Outros';

interface StoreState {
  patients: Patient[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
  company: Company | null;
  currentUser: User | null;
  waitlist: WaitlistEntry[];
  professionals: Professional[];
  teamMembers: TeamMember[];
  isInitialized: boolean;
  cashBalance: number;

  // Dashboard
  metrics: DashboardMetrics;

  categories: Record<CategoryType, string[]>;
  
  // Actions
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  setFinancialEntries: (entries: FinancialEntry[]) => void;
  addFinancialEntry: (entry: FinancialEntry) => void;
  updateFinancialEntry: (id: string, entry: Partial<FinancialEntry>) => void;
  deleteFinancialEntry: (id: string) => void;
  
  setCompany: (company: Company) => void;
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
  setCurrentUser: (user: User | null) => void;

  setWaitlist: (entries: WaitlistEntry[]) => void;
  addWaitlistEntry: (entry: WaitlistEntry) => void;
  updateWaitlistEntry: (id: string, entry: Partial<WaitlistEntry>) => void;
  removeWaitlistEntry: (id: string) => void;

  setProfessionals: (entries: Professional[]) => void;
  addProfessional: (entry: Professional) => void;
  updateProfessional: (id: string, entry: Partial<Professional>) => void;
  removeProfessional: (id: string) => void;

  setTeamMembers: (entries: TeamMember[]) => void;
  addTeamMember: (entry: TeamMember) => void;
  updateTeamMember: (id: string, entry: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;

  addCategory: (type: CategoryType, name: string) => void;
  updateCategory: (type: CategoryType, oldName: string, newName: string) => void;
  deleteCategory: (type: CategoryType, name: string) => void;
  setCashBalance: (balance: number) => void;
  
  // Derived data
  getPatientsWithStatus: () => PatientWithStatus[];
  getTodayAppointments: () => Appointment[];
  getMetrics: () => DashboardMetrics;
  getPatientHistory: (patientId: string) => PatientHistory;
  setInitialized: (value: boolean) => void;
}

const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        patients: [],
        appointments: [],
        financialEntries: [],
        company: null,
        currentUser: null,
        waitlist: [],
        professionals: [],
        teamMembers: [],
        isInitialized: false,
        cashBalance: 15000,
        metrics: {
          todayPatients: 0,
          scheduledAppointments: 0,
          occupancyRate: 0,
          monthlyRevenue: 0,
          waitingPatients: 0,
          inConsultationPatients: 0,
          completedToday: 0,
        },
        categories: {
          income: [...DEFAULT_INCOME_CATEGORIES],
          expense: [...DEFAULT_EXPENSE_CATEGORIES],
        },

        // Patient actions
        setPatients: (patients) => set({ patients }),
        addPatient: (patient) => {
          const currentUserName = get().currentUser?.name ?? 'Administrador';
          const now = new Date().toISOString();
          const patientRecord: Patient = {
            ...patient,
            createdAt: patient.createdAt ?? now,
            updatedAt: patient.updatedAt ?? now,
            createdBy: patient.createdBy ?? currentUserName,
            updatedBy: patient.updatedBy ?? currentUserName,
          };
          set((state) => ({ patients: [...state.patients, patientRecord] }));
        },
        updatePatient: (id, patientData) => {
          const currentUserName = get().currentUser?.name ?? 'Administrador';
          const timestamp = new Date().toISOString();
          set((state) => ({
            patients: state.patients.map((p) =>
              p.id === id
                ? {
                    ...p,
                    ...patientData,
                    updatedAt: timestamp,
                    updatedBy: currentUserName,
                  }
                : p
            ),
          }));
        },
        deletePatient: (id) =>
          set((state) => ({
            patients: state.patients.filter((p) => p.id !== id),
          })),

        // Appointment actions
        setAppointments: (appointments) => set({ appointments }),
        addAppointment: (appointment) =>
          set((state) => ({ appointments: [...state.appointments, appointment] })),
        updateAppointment: (id, appointmentData) =>
          set((state) => ({
            appointments: state.appointments.map((a) =>
              a.id === id ? { ...a, ...appointmentData } : a
            ),
          })),
        deleteAppointment: (id) =>
          set((state) => ({
            appointments: state.appointments.filter((a) => a.id !== id),
          })),

        // Financial actions
        setFinancialEntries: (entries) => set({ financialEntries: entries }),
        addFinancialEntry: (entry) =>
          set((state) => ({ financialEntries: [...state.financialEntries, entry] })),
        updateFinancialEntry: (id, entryData) =>
          set((state) => ({
            financialEntries: state.financialEntries.map((e) =>
              e.id === id ? { ...e, ...entryData } : e
            ),
          })),
        deleteFinancialEntry: (id) =>
          set((state) => ({
            financialEntries: state.financialEntries.filter((e) => e.id !== id),
          })),

        // Company actions
        setCompany: (company) => set({ company }),
        updateMetrics: (newMetrics) =>
          set((state) => ({ metrics: { ...state.metrics, ...newMetrics } })),
        setCurrentUser: (user) => set({ currentUser: user }),

        setWaitlist: (entries) => set({ waitlist: entries }),
        addWaitlistEntry: (entry) =>
          set((state) => ({ waitlist: [...state.waitlist, entry] })),
        updateWaitlistEntry: (id, entryData) =>
          set((state) => ({
            waitlist: state.waitlist.map((entry) =>
              entry.id === id ? { ...entry, ...entryData } : entry
            ),
          })),
        removeWaitlistEntry: (id) =>
          set((state) => ({
            waitlist: state.waitlist.filter((entry) => entry.id !== id),
          })),

        setProfessionals: (entries) => set({ professionals: entries }),
        addProfessional: (entry) =>
          set((state) => ({ professionals: [...state.professionals, entry] })),
        updateProfessional: (id, entryData) =>
          set((state) => ({
            professionals: state.professionals.map((entry) =>
              entry.id === id
                ? { ...entry, ...entryData, updatedAt: new Date().toISOString() }
                : entry
            ),
          })),
        removeProfessional: (id) =>
          set((state) => ({
            professionals: state.professionals.filter((entry) => entry.id !== id),
          })),

        setTeamMembers: (entries) => set({ teamMembers: entries }),
        addTeamMember: (entry) =>
          set((state) => ({ teamMembers: [...state.teamMembers, entry] })),
        updateTeamMember: (id, entryData) =>
          set((state) => ({
            teamMembers: state.teamMembers.map((entry) =>
              entry.id === id
                ? { ...entry, ...entryData, updatedAt: new Date().toISOString() }
                : entry
            ),
          })),
        removeTeamMember: (id) =>
          set((state) => ({
            teamMembers: state.teamMembers.filter((entry) => entry.id !== id),
          })),

        setInitialized: (value) => set({ isInitialized: value }),

        setCashBalance: (balance) => set({ cashBalance: balance }),

        addCategory: (type, name) =>
          set((state) => {
            const trimmedName = name.trim();
            if (!trimmedName) {
              return {};
            }

            const exists = state.categories[type].some(
              (category) => category.toLowerCase() === trimmedName.toLowerCase()
            );

            if (exists) {
              return {};
            }

            return {
              categories: {
                ...state.categories,
                [type]: [...state.categories[type], trimmedName],
              },
            };
          }),

        updateCategory: (type, oldName, newName) =>
          set((state) => {
            if (oldName === FALLBACK_CATEGORY) {
              return {};
            }

            const trimmedName = newName.trim();
            if (!trimmedName) {
              return {};
            }

            const targetList = state.categories[type];
            const exists = targetList.some(
              (category) =>
                category.toLowerCase() === trimmedName.toLowerCase() &&
                category !== oldName
            );

            if (exists) {
              return {};
            }

            const updatedCategories = targetList.map((category) =>
              category === oldName ? trimmedName : category
            );

            const updatedEntries = state.financialEntries.map((entry) =>
              entry.type === type && entry.category === oldName
                ? { ...entry, category: trimmedName }
                : entry
            );

            return {
              categories: { ...state.categories, [type]: updatedCategories },
              financialEntries: updatedEntries,
            };
          }),

        deleteCategory: (type, name) =>
          set((state) => {
            if (name === FALLBACK_CATEGORY) {
              return {};
            }

            const remainingCategories = state.categories[type].filter(
              (category) => category !== name
            );

            if (remainingCategories.length === 0) {
              remainingCategories.push(FALLBACK_CATEGORY);
            }

            const fallback = remainingCategories.includes(FALLBACK_CATEGORY)
              ? FALLBACK_CATEGORY
              : remainingCategories[0];

            const updatedEntries = state.financialEntries.map((entry) =>
              entry.type === type && entry.category === name
                ? { ...entry, category: fallback }
                : entry
            );

            return {
              categories: {
                ...state.categories,
                [type]: remainingCategories,
              },
              financialEntries: updatedEntries,
            };
          }),

        // Derived data
        getPatientsWithStatus: () => {
          const { patients, appointments } = get();
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          const patientMap = new Map<string, PatientWithStatus>();

          const statusPriority: Record<Appointment['status'], number> = {
            'in-progress': 5,
            'confirmed': 4, // Mapeia para 'waiting'
            'scheduled': 3,
            'completed': 2,
            'cancelled': 1,
            'no-show': 1, // Adicionado com prioridade baixa
          };

          appointments.forEach((apt) => {
            if (apt.date !== today) return; // Apenas consultas de hoje

            const patient = patients.find(p => p.id === apt.patientId);
            if (!patient) return;

            let patientStatus: PatientWithStatus['status'] = 'scheduled';
            switch (apt.status) {
              case 'confirmed':
                patientStatus = 'waiting';
                break;
              case 'in-progress':
                patientStatus = 'in-consultation';
                break;
              case 'completed':
                patientStatus = 'completed';
                break;
              case 'cancelled':
                patientStatus = 'scheduled'; // Cancelled appointments are still "scheduled" but not active
                break;
              default:
                patientStatus = 'scheduled';
            }

            const newPatientWithStatus: PatientWithStatus = {
              ...patient,
              status: patientStatus,
              appointmentTime: apt.time,
              currentAppointment: apt,
            };

            const existingPatient = patientMap.get(patient.id);

            if (!existingPatient || statusPriority[apt.status] > statusPriority[existingPatient.currentAppointment?.status || 'scheduled']) {
              patientMap.set(patient.id, newPatientWithStatus);
            }
          });

          const result = Array.from(patientMap.values());

          // Ordenar por horário da consulta mais relevante
          return result.sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
        },

        getTodayAppointments: () => {
          const { appointments } = get();
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          return appointments.filter((apt) => apt.date === today);
        },

        getMetrics: () => {
          const { appointments, financialEntries, company } = get();
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const todayAppointments = appointments.filter((apt) => apt.date === today);
          const monthlyEntries = financialEntries.filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
          });

          const monthlyRevenue = monthlyEntries
            .filter((entry) => entry.type === 'income')
            .reduce((sum, entry) => sum + entry.amount, 0);

          // Calcular slots disponíveis baseado nas horas de funcionamento
          const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
          const businessHours = company?.businessHours?.[dayOfWeek];
          let totalSlots = 20; // Default

          if (businessHours && businessHours.isOpen) {
            const [openHour] = businessHours.open.split(':').map(Number);
            const [closeHour] = businessHours.close.split(':').map(Number);
            const workingHours = closeHour - openHour;
            // Assumindo consultas de 30 minutos
            totalSlots = workingHours * 2;
          }

          const occupancyRate = totalSlots > 0 ? Math.round((todayAppointments.length / totalSlots) * 100) : 0;

          return {
            todayPatients: todayAppointments.length,
            scheduledAppointments: todayAppointments.filter((apt) => apt.status === 'scheduled').length,
            occupancyRate: Math.min(occupancyRate, 100), // Máximo 100%
            monthlyRevenue,
            waitingPatients: todayAppointments.filter((apt) => apt.status === 'confirmed').length,
            inConsultationPatients: todayAppointments.filter((apt) => apt.status === 'in-progress').length,
            completedToday: todayAppointments.filter((apt) => apt.status === 'completed').length,
          };
        },

        getPatientHistory: (patientId) => {
          const { appointments } = get();
          const patientAppointments = appointments
            .filter((apt) => apt.patientId === patientId)
            .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

          const lastAppointment = patientAppointments[0];
          const lastExam = patientAppointments.find((apt) => apt.type === 'exam');

          return {
            totalAppointments: patientAppointments.length,
            lastAppointment,
            lastAppointmentDate: lastAppointment ? `${lastAppointment.date} ${lastAppointment.time}` : undefined,
            lastExam,
            isNew: patientAppointments.length === 0,
          };
        },
      }),
      {
        name: 'clinictech-storage',
      }
    )
  )
);

export default useStore;
