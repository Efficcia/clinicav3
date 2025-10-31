'use client';

import React from 'react';
import { Check, UserPlus, Clock } from 'lucide-react';
import useStore from '@/store/useStore';
import { PatientWithStatus } from '@/types';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import { fetchAppointments, updateAppointmentRemote } from '@/lib/supabaseData';

interface PatientStatusManagerProps {
  patient: PatientWithStatus;
  onStatusChange?: () => void;
}

export default function PatientStatusManager({ patient, onStatusChange }: PatientStatusManagerProps) {
  const { updateAppointment, setAppointments } = useStore();
  const supabaseActive = isSupabaseEnabled();

  const handleStatusChange = async (newStatus: string) => {
    if (!patient.currentAppointment) {
      return;
    }

    if (supabaseActive) {
      try {
        await updateAppointmentRemote(patient.currentAppointment.id, { status: newStatus });
        const refreshed = await fetchAppointments();
        setAppointments(refreshed);
        onStatusChange?.();
      } catch (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
      }
    } else {
      updateAppointment(patient.currentAppointment.id, { status: newStatus });
      onStatusChange?.();
    }
  };

  const getActionButtons = () => {
    switch (patient.status) {
      case 'waiting':
        return (
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => handleStatusChange('in-progress')}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              <span>Chamar</span>
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors"
            >
              <span>Cancelar</span>
            </button>
          </div>
        );
      
      case 'in-consultation':
        return (
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => handleStatusChange('completed')}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>Finalizar</span>
            </button>
          </div>
        );
      
      case 'scheduled':
        return (
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => handleStatusChange('confirmed')}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded-lg text-xs hover:bg-yellow-700 transition-colors"
            >
              <Clock className="w-3 h-3" />
              <span>Confirmar</span>
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors"
            >
              <span>Cancelar</span>
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      {getActionButtons()}
    </div>
  );
}
