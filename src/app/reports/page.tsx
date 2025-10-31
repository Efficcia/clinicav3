'use client';

import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, PieChart, Users, DollarSign, UserCheck, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import useStore from '@/store/useStore';
import PeriodSelector from '@/components/ui/PeriodSelector';
import { PeriodRange } from '@/types/period';
import { formatPeriodLabel, getDefaultMonthlyPeriod, periodRangeToDates } from '@/utils/period';
import { Appointment, FinancialEntry } from '@/types';

type ReportType = 'general' | 'financial' | 'patients' | 'appointments';

export default function ReportsPage() {
  const { appointments, patients, financialEntries } = useStore();
  const [period, setPeriod] = useState<PeriodRange>(getDefaultMonthlyPeriod());
  const [reportType, setReportType] = useState<ReportType>('general');

  type AppointmentWithDate = Appointment & { dateObj: Date };
  type FinancialEntryWithDate = FinancialEntry & { dateObj: Date };

  const appointmentsWithDate = useMemo<AppointmentWithDate[]>(
    () => appointments.map((apt) => ({ ...apt, dateObj: new Date(apt.date) })),
    [appointments]
  );

  const financialEntriesWithDate = useMemo<FinancialEntryWithDate[]>(
    () => financialEntries.map((entry) => ({ ...entry, dateObj: new Date(entry.date) })),
    [financialEntries]
  );

  const filteredAppointments = useMemo(() => {
    const { start, end } = periodRangeToDates(period);
    return appointmentsWithDate.filter(({ dateObj }) => dateObj >= start && dateObj <= end);
  }, [appointmentsWithDate, period]);

  const filteredFinancials = useMemo(() => {
    const { start, end } = periodRangeToDates(period);
    return financialEntriesWithDate.filter(({ dateObj }) => dateObj >= start && dateObj <= end);
  }, [financialEntriesWithDate, period]);

  const generalStats = {
    totalPatients: patients.length,
    totalAppointments: filteredAppointments.length,
    completedAppointments: filteredAppointments.filter(apt => apt.status === 'completed').length,
    cancelledAppointments: filteredAppointments.filter(apt => apt.status === 'cancelled').length,
    totalRevenue: filteredFinancials.filter(entry => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0),
    totalExpenses: filteredFinancials.filter(entry => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
  };

  const appointmentsByDoctor = filteredAppointments.reduce((acc, apt) => {
    acc[apt.doctorName] = (acc[apt.doctorName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const appointmentsByStatus = filteredAppointments.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenueByCategory = filteredFinancials
    .filter(entry => entry.type === 'income')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

  const expensesByCategory = filteredFinancials
    .filter(entry => entry.type === 'expense')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToCSV = () => {
    const data = [
      ['Relatório Clinic[IA] - ' + formatPeriodLabel(period)],
      [''],
      ['MÉTRICAS GERAIS'],
      ['Total de Pacientes', generalStats.totalPatients],
      ['Total de Consultas', generalStats.totalAppointments],
      ['Consultas Finalizadas', generalStats.completedAppointments],
      ['Consultas Canceladas', generalStats.cancelledAppointments],
      ['Receita Total', formatCurrency(generalStats.totalRevenue)],
      ['Despesas Totais', formatCurrency(generalStats.totalExpenses)],
      ['Resultado Líquido', formatCurrency(generalStats.totalRevenue - generalStats.totalExpenses)],
      [''],
      ['CONSULTAS POR MÉDICO'],
      ...Object.entries(appointmentsByDoctor).map(([doctor, count]) => [doctor, count]),
      [''],
      ['RECEITAS POR CATEGORIA'],
      ...Object.entries(revenueByCategory).map(([category, amount]) => [category, formatCurrency(amount)]),
      [''],
      ['DESPESAS POR CATEGORIA'],
      ...Object.entries(expensesByCategory).map(([category, amount]) => [category, formatCurrency(amount)])
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-clinictech-${period.type}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Dados para evolução temporal (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return Array.from({ length: 6 }, (_, index) => 5 - index).map((offset) => {
      const reference = new Date(currentYear, currentMonth - offset, 1);

      const monthAppointments = appointmentsWithDate.filter(
        ({ dateObj }) =>
          dateObj.getFullYear() === reference.getFullYear() &&
          dateObj.getMonth() === reference.getMonth()
      );

      const monthFinancials = financialEntriesWithDate.filter(
        ({ dateObj }) =>
          dateObj.getFullYear() === reference.getFullYear() &&
          dateObj.getMonth() === reference.getMonth()
      );

      const revenue = monthFinancials
        .filter((entry) => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const expenses = monthFinancials
        .filter((entry) => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      return {
        month: reference.toLocaleDateString('pt-BR', { month: 'short' }),
        appointments: monthAppointments.length,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });
  }, [appointmentsWithDate, financialEntriesWithDate]);

  // Análise de pacientes
  const patientStats = useMemo(() => {
    const { start, end } = periodRangeToDates(period);
    const newPatients = patients.filter((patient) => {
      const createdDate = new Date(patient.createdAt);
      return createdDate >= start && createdDate <= end;
    }).length;

    const filteredPatients = patients.filter((patient) => {
      const createdDate = new Date(patient.createdAt);
      return createdDate <= end;
    });

    const ageGroups = filteredPatients.reduce((acc, patient) => {
      if (patient.birthDate) {
        const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
        if (age < 18) acc['0-17']++;
        else if (age < 30) acc['18-29']++;
        else if (age < 50) acc['30-49']++;
        else if (age < 65) acc['50-64']++;
        else acc['65+']++;
      }
      return acc;
    }, { '0-17': 0, '18-29': 0, '30-49': 0, '50-64': 0, '65+': 0 });

    const genderDistribution = filteredPatients.reduce((acc, patient) => {
      const gender = patient.gender || 'Não informado';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { newPatients, ageGroups, genderDistribution };
  }, [patients, period]);

  const reportTypes: Array<{ id: ReportType; label: string; icon: typeof BarChart3 }> = [
    { id: 'general', label: 'Visão Geral', icon: BarChart3 },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'appointments', label: 'Consultas', icon: Calendar },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 bg-white min-h-screen">
      <PageHeader
        title="Relatórios e Analytics"
        description="Análise completa do desempenho da clínica"
        icon={BarChart3}
      >
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/25"
        >
          <Download className="w-5 h-5" />
          <span>Exportar Relatório</span>
        </button>
      </PageHeader>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    reportType === type.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Período: <span className="font-medium text-gray-900">{formatPeriodLabel(period)}</span>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{generalStats.totalPatients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Consultas</p>
              <p className="text-2xl font-bold text-gray-900">{generalStats.totalAppointments}</p>
              <p className="text-sm text-green-600">
                {generalStats.completedAppointments} finalizadas
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(generalStats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Resultado</p>
              <p className={`text-2xl font-bold ${generalStats.totalRevenue - generalStats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(generalStats.totalRevenue - generalStats.totalExpenses)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${generalStats.totalRevenue - generalStats.totalExpenses >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${generalStats.totalRevenue - generalStats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {reportType === 'general' && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Consultas por Status</h3>
                <div className="space-y-4">
                  {Object.entries(appointmentsByStatus).map(([status, count]) => {
                    const percentage = (count / generalStats.totalAppointments) * 100;
                    const statusLabels = {
                      'scheduled': { label: 'Agendadas', color: 'bg-purple-500' },
                      'confirmed': { label: 'Confirmadas', color: 'bg-yellow-500' },
                      'in-progress': { label: 'Em Andamento', color: 'bg-blue-500' },
                      'completed': { label: 'Finalizadas', color: 'bg-green-500' },
                      'cancelled': { label: 'Canceladas', color: 'bg-red-500' },
                      'no-show': { label: 'Não Compareceu', color: 'bg-gray-500' }
                    };
                    
                    const statusInfo = statusLabels[status as keyof typeof statusLabels] || { label: status, color: 'bg-gray-500' };
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 ${statusInfo.color} rounded-full`}></div>
                          <span className="text-gray-700">{statusInfo.label}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 ${statusInfo.color} rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Produtividade por Médico</h3>
                <div className="space-y-4">
                  {Object.entries(appointmentsByDoctor).map(([doctor, count]) => {
                    const percentage = (count / generalStats.totalAppointments) * 100;
                    
                    return (
                      <div key={doctor} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {doctor.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-gray-700">{doctor}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {reportType === 'financial' && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Receitas por Categoria</h3>
                <div className="space-y-4">
                  {Object.entries(revenueByCategory).map(([category, amount]) => {
                    const percentage = (amount / generalStats.totalRevenue) * 100;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700">{category}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Despesas por Categoria</h3>
                <div className="space-y-4">
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    const percentage = (amount / generalStats.totalExpenses) * 100;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-gray-700">{category}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-red-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {reportType === 'patients' && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Faixa Etária</h3>
                <div className="space-y-4">
                  {Object.entries(patientStats.ageGroups).map(([ageGroup, count]) => {
                    const percentage = patients.length > 0 ? (count / patients.length) * 100 : 0;
                    
                    return (
                      <div key={ageGroup} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700">{ageGroup} anos</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-purple-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Gênero</h3>
                <div className="space-y-4">
                  {Object.entries(patientStats.genderDistribution).map(([gender, count]) => {
                    const percentage = patients.length > 0 ? (count / patients.length) * 100 : 0;
                    const colors = {
                      'Masculino': 'bg-blue-500',
                      'Feminino': 'bg-pink-500',
                      'Outro': 'bg-gray-500',
                      'Não informado': 'bg-gray-400'
                    };
                    const color = colors[gender as keyof typeof colors] || 'bg-gray-500';
                    
                    return (
                      <div key={gender} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 ${color} rounded-full`}></div>
                          <span className="text-gray-700">{gender}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 ${color} rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {reportType === 'appointments' && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Evolução de Consultas</h3>
                <div className="space-y-4">
                  {monthlyData.map((month, index) => {
                    const maxAppointments = Math.max(...monthlyData.map(m => m.appointments));
                    const percentage = maxAppointments > 0 ? (month.appointments / maxAppointments) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 w-12">{month.month}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="h-3 bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{month.appointments}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Mensal</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Novos Pacientes</div>
                      <div className="text-lg font-bold text-blue-600">{patientStats.newPatients}</div>
                    </div>
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Taxa de Finalização</div>
                      <div className="text-lg font-bold text-green-600">
                        {generalStats.totalAppointments > 0 ? Math.round((generalStats.completedAppointments / generalStats.totalAppointments) * 100) : 0}%
                      </div>
                    </div>
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Média de Consultas/Dia</div>
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(generalStats.totalAppointments / 30)}
                      </div>
                    </div>
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumo do Período</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Taxa de Finalização</div>
                  <div className="text-xl font-bold text-green-600">
                    {generalStats.totalAppointments > 0 ? Math.round((generalStats.completedAppointments / generalStats.totalAppointments) * 100) : 0}%
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Ticket Médio</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(generalStats.completedAppointments > 0 ? generalStats.totalRevenue / generalStats.completedAppointments : 0)}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Pacientes Novos</div>
                  <div className="text-xl font-bold text-purple-600">
                    {patientStats.newPatients}
                  </div>
                  <div className="text-xs text-gray-500">no período</div>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>

              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Margem de Lucro</div>
                  <div className={`text-xl font-bold ${
                    generalStats.totalRevenue > 0 
                      ? ((generalStats.totalRevenue - generalStats.totalExpenses) / generalStats.totalRevenue) * 100 >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {generalStats.totalRevenue > 0 
                      ? Math.round(((generalStats.totalRevenue - generalStats.totalExpenses) / generalStats.totalRevenue) * 100)
                      : 0
                    }%
                  </div>
                </div>
                <PieChart className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Evolução Financeira (6 meses)</h3>
            <div className="space-y-4">
              {monthlyData.map((month, index) => {
                const maxRevenue = Math.max(...monthlyData.map(m => m.revenue));
                const revenuePercentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                const isProfit = month.profit >= 0;
                
                return (
                  <div key={index} className="">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{month.month}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{formatCurrency(month.revenue)}</div>
                        <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(month.profit)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${revenuePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Receita Média</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Crescimento</div>
                  <div className={`font-semibold ${
                    monthlyData.length > 1 && monthlyData[monthlyData.length - 1].revenue > monthlyData[0].revenue 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {monthlyData.length > 1 && monthlyData[0].revenue > 0 
                      ? `${Math.round(((monthlyData[monthlyData.length - 1].revenue - monthlyData[0].revenue) / monthlyData[0].revenue) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
