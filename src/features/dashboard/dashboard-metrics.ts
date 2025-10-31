import { PatientWithStatus, Appointment, FinancialEntry } from '@/types';

export interface DashboardMetrics {
  todayPatients: number;
  scheduledAppointments: number;
  occupancyRate: number;
  monthlyRevenue: number;
  waitingPatients: number;
  completedToday: number;
  nextAppointment: string | null;
  weeklyGrowth: number;
}

export const calculateDashboardMetrics = (
  patients: PatientWithStatus[],
  appointments: Appointment[],
  financialEntries: FinancialEntry[]
): DashboardMetrics => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Today's patients
  const todayPatients = patients.filter(p => 
    ['waiting', 'confirmed', 'in-progress', 'completed'].includes(p.status)
  ).length;

  // Scheduled appointments
  const scheduledAppointments = appointments.filter(a => 
    a.status === 'scheduled' || a.status === 'confirmed'
  ).length;

  // Waiting patients
  const waitingPatients = patients.filter(p => 
    p.status === 'waiting' || p.status === 'confirmed'
  ).length;

  // Completed today
  const completedToday = patients.filter(p => p.status === 'completed').length;

  // Monthly revenue
  const monthlyRevenue = financialEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entry.type === 'income' && 
             entryDate.getMonth() === currentMonth &&
             entryDate.getFullYear() === currentYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  // Occupancy rate (simplified calculation)
  const totalSlots = 40; // 8 hours * 5 slots per hour
  const occupancyRate = Math.round((todayPatients / totalSlots) * 100);

  // Next appointment
  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' || a.status === 'confirmed')
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  
  const nextAppointment = upcomingAppointments.length > 0 
    ? upcomingAppointments[0].time 
    : null;

  return {
    todayPatients,
    scheduledAppointments,
    occupancyRate,
    monthlyRevenue,
    waitingPatients,
    completedToday,
    nextAppointment,
    weeklyGrowth: 12 // Mock value
  };
};
