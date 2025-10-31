'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import useStore from '@/store/useStore';

export default function QuickStats() {
  const { getTodayAppointments, waitlist } = useStore();

  const todayAppointments = getTodayAppointments();

  const waitingCount = todayAppointments.filter(apt => apt.status === 'confirmed').length;
  const inConsultationCount = todayAppointments.filter(apt => apt.status === 'in-progress').length;

  const nextAppointment = todayAppointments
    .filter(apt => apt.status === 'scheduled')
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-yellow-900">Em Desenvolvimento</p>
          <p className="text-xs text-yellow-800">
            Funcionalidade em ajustes
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Estatísticas Rápidas</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-100">Sala de Espera</span>
            <span className="font-bold">{waitingCount} paciente{waitingCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-100">Lista de Espera</span>
            <span className="font-bold">{waitlist.length} paciente{waitlist.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-100">Em Atendimento</span>
            <span className="font-bold">{inConsultationCount} paciente{inConsultationCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-100">Próxima Consulta</span>
            <span className="font-bold">
              {nextAppointment ? nextAppointment.time : 'Nenhuma'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
