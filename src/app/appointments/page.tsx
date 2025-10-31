'use client';

import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';
import { addDays, addMonths, addWeeks, differenceInCalendarDays, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useStore from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal';
import PeriodSelector from '@/components/ui/PeriodSelector';
import { PeriodRange } from '@/types/period';
import {
  formatPeriodLabel,
  getDefaultDailyPeriod,
  getDefaultMonthlyPeriod,
  getDefaultWeeklyPeriod,
  periodRangeToDates,
  toIsoDate,
} from '@/utils/period';
import { Appointment, Patient } from '@/types';

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

const getAppointmentTypeLabel = (type: Appointment['type']) => {
  switch (type) {
    case 'consultation':
      return 'Consulta';
    case 'exam':
      return 'Exame';
    case 'procedure':
      return 'Procedimento';
    case 'return':
      return 'Retorno';
    default:
      return type;
  }
};

export default function AppointmentsPage() {
  const { appointments, patients, deleteAppointment } = useStore();
  const [period, setPeriod] = useState<PeriodRange>(getDefaultWeeklyPeriod());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  type AppointmentWithMeta = Appointment & { dateObj: Date; patient?: Patient };

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((patient) => {
      map.set(patient.id, patient);
    });
    return map;
  }, [patients]);

  const normalizedAppointments = useMemo<AppointmentWithMeta[]>(
    () => {
      console.log('[AppointmentsPage] Total de agendamentos:', appointments.length);
      const aptsWithTime = appointments.map(a => ({
        id: a.id.substring(0, 8),
        date: a.date,
        time: a.time,
        patient: a.patientId?.substring(0, 8)
      }));
      console.log('[AppointmentsPage] Agendamentos raw:', aptsWithTime);
      console.log('[AppointmentsPage] Agendamentos SEM horário:', aptsWithTime.filter(a => !a.time).length);

      return appointments.map((appointment) => ({
        ...appointment,
        dateObj: new Date(appointment.date),
        patient: patientMap.get(appointment.patientId),
      }));
    },
    [appointments, patientMap]
  );

  const { start: periodStartDate, end: periodEndDate } = useMemo(() => periodRangeToDates(period), [period]);

  const periodAppointmentsDetailed = useMemo<AppointmentWithMeta[]>(() => {
    const { start, end } = periodRangeToDates(period);

    console.log('[AppointmentsPage] Período selecionado:', {
      type: period.type,
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });

    const filtered = normalizedAppointments.filter(({ dateObj }) => {
      const isInRange = dateObj >= start && dateObj <= end;
      console.log('[AppointmentsPage] Verificando agendamento:', {
        date: format(dateObj, 'yyyy-MM-dd'),
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
        isInRange
      });
      return isInRange;
    });

    console.log('[AppointmentsPage] Agendamentos filtrados no período:', filtered.length);

    return filtered.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [normalizedAppointments, period]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentWithMeta[]>();

    periodAppointmentsDetailed.forEach((apt) => {
      const list = map.get(apt.date);
      if (list) {
        list.push(apt);
      } else {
        map.set(apt.date, [apt]);
      }
    });

    return map;
  }, [periodAppointmentsDetailed]);

  const getAppointmentsForDate = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    return appointmentsByDate.get(key) ?? [];
  };

  const rangeDays = useMemo(() => {
    const days: Date[] = [];
    let cursor = periodStartDate;
    while (cursor <= periodEndDate) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [periodStartDate, periodEndDate]);

  const weekDays = period.type === 'week' ? rangeDays : [];
  const dayAppointments = period.type === 'day' ? getAppointmentsForDate(periodStartDate) : [];
  const tableAppointments = period.type === 'day' ? dayAppointments : periodAppointmentsDetailed;
  const showDateColumn = period.type !== 'day';

  const periodStats = useMemo(() => ({
    total: periodAppointmentsDetailed.length,
    confirmed: periodAppointmentsDetailed.filter((apt) => apt.status === 'confirmed').length,
    completed: periodAppointmentsDetailed.filter((apt) => apt.status === 'completed').length,
    cancelled: periodAppointmentsDetailed.filter((apt) => apt.status === 'cancelled').length,
  }), [periodAppointmentsDetailed]);

  const totalLabel = useMemo(() => {
    switch (period.type) {
      case 'day':
        return 'Total no dia';
      case 'week':
        return 'Total na semana';
      case 'month':
        return 'Total no mês';
      default:
        return 'Total no período';
    }
  }, [period.type]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-purple-100 border-purple-200 text-purple-800';
      case 'confirmed':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'cancelled':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const handleNavigate = (direction: 1 | -1) => {
    const { type } = period;
    const { start, end } = periodRangeToDates(period);

    if (type === 'day') {
      const next = addDays(start, direction);
      setPeriod({ type: 'day', startDate: toIsoDate(next), endDate: toIsoDate(next) });
      return;
    }

    if (type === 'week') {
      const nextStart = startOfWeek(addWeeks(start, direction), WEEK_OPTIONS);
      const nextEnd = endOfWeek(nextStart, WEEK_OPTIONS);
      setPeriod({ type: 'week', startDate: toIsoDate(nextStart), endDate: toIsoDate(nextEnd) });
      return;
    }

    if (type === 'month') {
      const currentStart = startOfMonth(start);
      const nextStart = startOfMonth(addMonths(currentStart, direction));
      const nextEnd = endOfMonth(nextStart);
      setPeriod({ type: 'month', startDate: toIsoDate(nextStart), endDate: toIsoDate(nextEnd) });
      return;
    }

    const span = differenceInCalendarDays(end, start) + 1;
    const nextStart = addDays(start, span * direction);
    const nextEnd = addDays(end, span * direction);
    setPeriod({ type: 'custom', startDate: toIsoDate(nextStart), endDate: toIsoDate(nextEnd) });
  };

  const handleToday = () => {
    switch (period.type) {
      case 'day':
        setPeriod(getDefaultDailyPeriod());
        break;
      case 'week':
        setPeriod(getDefaultWeeklyPeriod());
        break;
      case 'month':
        setPeriod(getDefaultMonthlyPeriod());
        break;
      case 'custom':
      default:
        setPeriod(getDefaultMonthlyPeriod());
        break;
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleDelete = (appointmentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteAppointment(appointmentId);
    }
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setSelectedAppointment(null);
  };

  const periodLabel = formatPeriodLabel(period);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 bg-white min-h-screen">
        <PageHeader
          title="Agenda de Consultas"
          description="Gerencie todos os agendamentos da clínica"
          icon={CalendarIcon}
        >
          <button
            onClick={() => {
              setSelectedAppointment(null);
              setIsFormOpen(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Agendamento</span>
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-medium">{totalLabel}</p>
                <p className="text-2xl font-bold text-gray-900">{periodStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-medium">Confirmadas</p>
                <p className="text-2xl font-bold text-yellow-600">{periodStats.confirmed}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-medium">Finalizadas</p>
                <p className="text-2xl font-bold text-green-600">{periodStats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-medium">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{periodStats.cancelled}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <div className="w-6 h-6 bg-red-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <PeriodSelector value={period} onChange={setPeriod} />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate(-1)}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-slate-700">{periodLabel}</span>
                <button
                  type="button"
                  onClick={() => handleNavigate(1)}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {period.type === 'week' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-4 bg-gray-50 font-medium text-slate-800">Horário</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-4 bg-gray-50 text-center">
                  <div className={`font-medium ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-2xl font-bold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(day, 'dd')}
                  </div>
                </div>
              ))}
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b border-gray-100">
                  <div className="p-3 text-sm text-slate-700 bg-gray-50 border-r border-gray-200">
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const dayApts = getAppointmentsForDate(day);
                    const slots = dayApts.filter((apt) => {
                      // Remover segundos do horário para comparação
                      const aptTime = apt.time?.substring(0, 5); // "09:00:00" -> "09:00"
                      return aptTime === time;
                    });
                    return (
                      <div key={`${day.toISOString()}-${time}`} className="p-2 min-h-[60px] border-r border-gray-100">
                        {slots.map((apt) => (
                          <button
                            type="button"
                            key={apt.id}
                            onClick={() => handleEdit(apt)}
                            className={`w-full text-left p-2 rounded-lg text-xs font-semibold border mb-1 transition-colors ${getStatusColor(apt.status)} hover:shadow-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                          >
                            <div className="truncate">{apt.patient?.name ?? 'Paciente'}</div>
                            <div className="truncate text-[11px] opacity-80">{apt.doctorName}</div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : period.type === 'day' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="p-4 bg-gray-50 font-medium text-slate-800">Horário</div>
              <div className="p-4 bg-gray-50 text-center">
                <div className="font-medium text-blue-600">
                  {format(periodStartDate, 'EEEE', { locale: ptBR })}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {format(periodStartDate, 'dd/MM/yyyy')}
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map((time) => {
                const dayApts = getAppointmentsForDate(periodStartDate);
                const slots = dayApts.filter((apt) => {
                  // Remover segundos do horário para comparação
                  const aptTime = apt.time?.substring(0, 5); // "09:00:00" -> "09:00"
                  return aptTime === time;
                });
                return (
                  <div key={time} className="grid grid-cols-2 border-b border-gray-100">
                    <div className="p-3 text-sm text-slate-700 bg-gray-50 border-r border-gray-200">
                      {time}
                    </div>
                    <div className="p-2 min-h-[60px]">
                      {slots.map((apt) => (
                        <button
                          type="button"
                          key={apt.id}
                          onClick={() => handleEdit(apt)}
                          className={`w-full text-left p-3 rounded-lg text-sm font-semibold border mb-1 transition-colors ${getStatusColor(apt.status)} hover:shadow-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                        >
                          <div className="truncate">{apt.patient?.name ?? 'Paciente'}</div>
                          <div className="truncate text-xs opacity-80">{apt.doctorName}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {period.type === 'day'
                  ? `Consultas de ${format(periodStartDate, 'dd MMMM yyyy', { locale: ptBR })}`
                  : 'Consultas no período selecionado'}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {showDateColumn && (
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Data</th>
                    )}
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Horário</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Paciente</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Médico</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Tipo</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Valor</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-800">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {console.log('[AppointmentsPage] Renderizando tabela com', tableAppointments.length, 'agendamentos')}
                  {tableAppointments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhum agendamento encontrado no período selecionado
                      </td>
                    </tr>
                  )}
                  {tableAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {showDateColumn && (
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {appointment.date.split('-').reverse().join('/')}
                        </td>
                      )}
                      <td className="py-4 px-6 font-medium text-gray-900">{appointment.time}</td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{appointment.patient?.name ?? 'Paciente'}</div>
                        <div className="text-sm text-slate-600">{appointment.patient?.phone}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-700">{appointment.doctorName}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {getAppointmentTypeLabel(appointment.type)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{formatCurrency(appointment.price)}</div>
                        {appointment.paid ? (
                          <div className="text-sm text-green-600">✓ Pago</div>
                        ) : (
                          <div className="text-sm text-red-600">Pendente</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(appointment)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(appointment.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tableAppointments.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma consulta encontrada</h3>
                <p className="text-gray-500">Nenhuma consulta cadastrada para o período selecionado.</p>
              </div>
            )}
          </div>
        )}

        {/* Appointment Form Modal */}
        <AppointmentForm
          appointment={selectedAppointment ?? undefined}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedAppointment(null);
          }}
          onSave={handleSave}
        />

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedAppointment(null);
            }}
            onEdit={handleEdit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
