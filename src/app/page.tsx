'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import PatientCard from '@/components/dashboard/PatientCard';
import QuickStats from '@/components/dashboard/QuickStats';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientModal from '@/components/dashboard/PatientModal';
import NotificationToast from '@/components/dashboard/NotificationToast';
import WaitlistPanel from '@/components/dashboard/WaitlistPanel';
import useStore from '@/store/useStore';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import {
  fetchAppointments,
  fetchCompany,
  fetchFinancialEntries,
  fetchPatients,
  fetchProfessionals,
  fetchTeamMembers,
  fetchWaitlistEntries,
  fetchInitialData,
  updateAppointmentRemote,
  updateWaitlistEntryRemote,
} from '@/lib/supabaseData';
import { PatientWithStatus, WaitlistEntry } from '@/types';

export default function Dashboard() {
  const {
    patients,
    setPatients,
    setAppointments,
    setFinancialEntries,
    setCompany,
    getPatientsWithStatus,
    getMetrics,
    updateAppointment,
    waitlist,
    setWaitlist,
    updateWaitlistEntry,
    professionals,
    teamMembers,
    setProfessionals,
    setTeamMembers,
    isInitialized,
    setInitialized,
  } = useStore();

  const router = useRouter();

  const [selectedPatient, setSelectedPatient] = useState<PatientWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const waitlistSectionRef = useRef<HTMLDivElement | null>(null);
  const supabaseActive = isSupabaseEnabled();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!supabaseActive || isInitialized) {
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadInitialData = async () => {
      // Timeout de 5 segundos - força inicialização mesmo que não carregue
      timeoutId = setTimeout(() => {
        if (isMounted && !isInitialized) {
          console.warn('Timeout ao carregar dados - liberando página');
          setInitialized(true);
        }
      }, 5000);

      try {
        const data = await fetchInitialData();

        if (!isMounted) {
          return;
        }

        clearTimeout(timeoutId);

        setPatients(data.patients);
        setAppointments(data.appointments);
        setFinancialEntries(data.financialEntries);
        setWaitlist(data.waitlist);
        setProfessionals(data.professionals);
        setTeamMembers(data.teamMembers);

        if (data.company) {
          setCompany(data.company);
        }

        setInitialized(true);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais do Supabase:', error);
        clearTimeout(timeoutId);
        // Mesmo com erro, marcar como inicializado para não travar a página
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    supabaseActive,
    isInitialized,
    setInitialized,
    setAppointments,
    setCompany,
    setFinancialEntries,
    setPatients,
    setProfessionals,
    setTeamMembers,
    setWaitlist,
  ]);

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const patientsWithStatus = getPatientsWithStatus();
  const metrics = getMetrics();

  const todayPatients = patientsWithStatus.filter(p =>
    ['scheduled', 'waiting', 'confirmed', 'in-progress', 'completed'].includes(p.status)
  );

  const waitingPatients = todayPatients.filter(p => p.status === 'waiting' || p.status === 'confirmed');

  // Calcular métricas do mês passado para comparação
  const calculatePreviousMonthMetrics = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const lastMonthAppointments = useStore.getState().appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= lastMonth && aptDate <= lastMonthEnd;
    });

    const lastMonthRevenue = useStore.getState().financialEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return entry.type === 'income' && entryDate >= lastMonth && entryDate <= lastMonthEnd;
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      appointments: lastMonthAppointments.length,
      revenue: lastMonthRevenue,
    };
  };

  const previousMonth = isClient ? calculatePreviousMonthMetrics() : { appointments: 0, revenue: 0 };

  // Calcular variações percentuais
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const metricsCards = isClient ? [
    {
      title: 'Pacientes Hoje',
      value: todayPatients.length.toString(),
      change: 0, // Não há comparação diária
      icon: Users,
      color: 'blue' as const
    },
    {
      title: 'Consultas Agendadas',
      value: metrics.scheduledAppointments.toString(),
      change: 0, // Não há comparação diária
      icon: Calendar,
      color: 'green' as const
    },
    {
      title: 'Taxa de Ocupação',
      value: `${metrics.occupancyRate}%`,
      change: 0, // Não há comparação diária
      icon: Activity,
      color: 'purple' as const
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${(metrics.monthlyRevenue / 1000).toFixed(1)}k`,
      change: calculateChange(metrics.monthlyRevenue, previousMonth.revenue),
      icon: TrendingUp,
      color: 'orange' as const
    }
  ] : [
    { 
      title: 'Pacientes Hoje', 
      value: '0', 
      change: 12, 
      icon: Users, 
      color: 'blue' as const
    },
    { 
      title: 'Consultas Agendadas', 
      value: '0', 
      change: -5, 
      icon: Calendar, 
      color: 'green' as const
    },
    { 
      title: 'Taxa de Ocupação', 
      value: '0%', 
      change: 8, 
      icon: Activity, 
      color: 'purple' as const
    },
    { 
      title: 'Receita Mensal', 
      value: 'R$ 0.0k', 
      change: 15, 
      icon: TrendingUp, 
      color: 'orange' as const
    }
  ];

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const handlePatientClick = (patient: PatientWithStatus) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleStatusChange = () => {
    setLastUpdated(new Date());
    showNotification('Status do paciente atualizado com sucesso!', 'success');
  };

  const handleCallNext = async () => {
    const nextPatient = waitingPatients
      .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''))[0];
    
    if (nextPatient && nextPatient.currentAppointment) {
      try {
        if (supabaseActive) {
          await updateAppointmentRemote(nextPatient.currentAppointment.id, { status: 'in-progress' });
          const refreshed = await fetchAppointments();
          setAppointments(refreshed);
        } else {
          updateAppointment(nextPatient.currentAppointment.id, { status: 'in-progress' });
        }

        setLastUpdated(new Date());
        showNotification(`${nextPatient.name} foi chamado para consulta!`, 'success');
      } catch (error) {
        console.error('Erro ao chamar próximo paciente:', error);
        showNotification('Não foi possível chamar o paciente.', 'error');
      }
    } else {
      showNotification('Nenhum paciente na fila de espera', 'warning');
    }
  };

  const handleScheduleFromWaitlist = async (entry: WaitlistEntry) => {
    try {
      if (supabaseActive) {
        await updateWaitlistEntryRemote(entry.id, { status: 'scheduled' });
        const refreshed = await fetchWaitlistEntries();
        setWaitlist(refreshed);
      } else {
        updateWaitlistEntry(entry.id, { status: 'scheduled' });
      }

      showNotification(`${entry.patientName} marcado como agendado. Abra a agenda para concluir o encaixe.`, 'success');
      router.push('/appointments');
    } catch (error) {
      console.error('Erro ao atualizar lista de espera:', error);
      showNotification('Não foi possível atualizar a lista de espera.', 'error');
    }
  };

  const handleMarkWaitlistContacted = async (entry: WaitlistEntry) => {
    try {
      if (supabaseActive) {
        await updateWaitlistEntryRemote(entry.id, { status: 'contacted' });
        const refreshed = await fetchWaitlistEntries();
        setWaitlist(refreshed);
      } else {
        updateWaitlistEntry(entry.id, { status: 'contacted' });
      }

      showNotification(`Contato registrado para ${entry.patientName}.`, 'info');
    } catch (error) {
      console.error('Erro ao atualizar contato da lista de espera:', error);
      showNotification('Não foi possível atualizar o contato.', 'error');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      showNotification('Dados atualizados!', 'info');
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Dashboard</h1>
            <p className="text-slate-600 text-base">Visão geral da clínica em tempo real</p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-sm text-slate-500 font-medium">
              {isClient ? `Última atualização: ${lastUpdated.toLocaleTimeString('pt-BR')}` : 'Carregando...'}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200/60 rounded-lg hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">Atualizar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsCards.map((metric, index) => (
            <div
              key={metric.title}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in"
            >
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 rounded-xl p-6 border border-slate-200/60">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pacientes de Hoje</h2>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600 font-medium">Tempo real</span>
                  </div>
                  {isClient && waitingPatients.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">{waitingPatients.length} aguardando</span>
                    </div>
                  )}
                </div>
              </div>
            
            <div className="space-y-4">
              {isClient && todayPatients.map((patient, index) => (
                <div
                  key={patient.currentAppointment?.id || `${patient.id}-${index}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="animate-fade-in"
                >
                  <PatientCard
                    patient={patient}
                    onClick={() => handlePatientClick(patient)}
                    onStatusChange={handleStatusChange}
                    showActions={patient.status === 'waiting' || patient.status === 'confirmed' || patient.status === 'in-progress'}
                  />
                </div>
              ))}
            </div>

              {isClient && todayPatients.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Nenhum paciente agendado</h3>
                  <p className="text-slate-600">Não há consultas marcadas para hoje.</p>
                </div>
              )}
            </div>

            <div ref={waitlistSectionRef}>
              <WaitlistPanel
                entries={waitlist}
                onSchedule={handleScheduleFromWaitlist}
                onMarkContacted={handleMarkWaitlistContacted}
              />
            </div>
          </div>

          <div className="space-y-8">
            <QuickStats />
            <QuickActions
              waitingPatientsCount={waitingPatients.length}
              waitlistCount={waitlist.length}
              onCallNext={handleCallNext}
              onOpenWaitlist={() => waitlistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </div>
        </div>
      </div>

      {/* Patient Modal */}
      {selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatient(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Notification Toast */}
      <NotificationToast
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
    </DashboardLayout>
  );
}
