'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, UserPlus, Phone, UserCheck, ClipboardList } from 'lucide-react';

interface QuickActionsProps {
  waitingPatientsCount: number;
  waitlistCount: number;
  onCallNext?: () => void;
  onOpenWaitlist?: () => void;
}

export default function QuickActions({ waitingPatientsCount, waitlistCount, onCallNext, onOpenWaitlist }: QuickActionsProps) {
  const router = useRouter();
  const hasWaitingPatients = waitingPatientsCount > 0;

  const actions = [
    {
      label: 'Chamar Próximo',
      icon: UserCheck,
      action: onCallNext,
      color: hasWaitingPatients 
        ? 'bg-green-600 hover:bg-green-700 shadow-green-600/25' 
        : 'bg-gray-400 cursor-not-allowed',
      disabled: !hasWaitingPatients,
      description: hasWaitingPatients 
        ? `${waitingPatientsCount} paciente(s) aguardando` 
        : 'Nenhum paciente na fila'
    },
    {
      label: 'Lista de Espera',
      icon: ClipboardList,
      action: onOpenWaitlist,
      color: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25',
      disabled: waitlistCount === 0,
      description: waitlistCount > 0
        ? `${waitlistCount} paciente(s) aguardando encaixe`
        : 'Nenhum paciente na lista de espera'
    },
    {
      label: 'Novo Agendamento',
      icon: Calendar,
      action: () => router.push('/appointments'),
      color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
      disabled: false,
    },
    {
      label: 'Cadastrar Paciente',
      icon: UserPlus,
      action: () => router.push('/patients'),
      color: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25',
      disabled: false,
    },
    {
      label: 'WhatsApp',
      icon: Phone,
      action: () => router.push('/whatsapp'),
      color: 'bg-green-600 hover:bg-green-700 shadow-green-600/25',
      disabled: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.label}>
            <button
              onClick={action.action}
              disabled={action.disabled}
              className={`w-full text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ${action.color} flex items-center justify-center space-x-2 disabled:hover:scale-100`}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
            {action.description && (
              <p className="text-xs text-slate-600 mt-1 text-center">{action.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
