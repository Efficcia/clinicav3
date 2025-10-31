'use client';

import React from 'react';
import { useMemo } from 'react';
import { PatientWithStatus } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PatientStatusManager from './PatientStatusManager';
import useStore from '@/store/useStore';

interface PatientCardProps {
  patient: PatientWithStatus;
  onClick?: () => void;
  onStatusChange?: () => void;
  showActions?: boolean;
}

export default function PatientCard({ patient, onClick, onStatusChange, showActions = false }: PatientCardProps) {
  const getPatientHistory = useStore((state) => state.getPatientHistory);
  const history = useMemo(() => getPatientHistory(patient.id), [getPatientHistory, patient.id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getSpecialty = () => {
    if (!patient.currentAppointment) return 'Consulta geral';
    
    if (patient.currentAppointment.doctorName.includes('Cardio')) return 'Cardiologia';
    if (patient.currentAppointment.doctorName.includes('Endocrino')) return 'Endocrinologia';
    if (patient.currentAppointment.doctorName.includes('Pneumo')) return 'Pneumologia';
    if (patient.currentAppointment.doctorName.includes('Reumato')) return 'Reumatologia';
    
    return 'Consulta geral';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <div 
      className="bg-white/80 rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300/60 hover:bg-white transition-all duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center space-x-5">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-sm">
          {getInitials(patient.name)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-lg tracking-tight mb-1">
            {patient.name}
          </h3>
          <p className="text-slate-600 text-sm font-medium mb-3">{getSpecialty()}</p>
          
          <div className="flex items-center justify-between">
            <StatusBadge status={patient.status} />
            {patient.appointmentTime && (
              <span className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-lg">
                {patient.appointmentTime}
              </span>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-600 space-y-1">
            {history.isNew ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Novo paciente
              </span>
            ) : (
              <>
                {history.lastAppointment && (
                  <div>
                    Última consulta: <span className="font-semibold text-slate-700">{new Date(history.lastAppointment.date + 'T' + history.lastAppointment.time).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {history.totalAppointments > 0 && (
                  <div>Total de atendimentos: <span className="font-semibold text-slate-700">{history.totalAppointments}</span></div>
                )}
              </>
            )}
          </div>
          
          {showActions && (
            <div className="mt-4">
              <PatientStatusManager patient={patient} onStatusChange={onStatusChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
