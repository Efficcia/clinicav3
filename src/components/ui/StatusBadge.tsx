'use client';

import React from 'react';
import { Clock, User, Check, Calendar, XCircle, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { color: string; icon: LucideIcon; label: string; pulse: boolean }> = {
  waiting: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Aguardando',
    pulse: true,
  },
  'in-consultation': {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: User,
    label: 'Em Consulta',
    pulse: true,
  },
  'in-progress': {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Play,
    label: 'Em Andamento',
    pulse: true,
  },
  completed: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Check,
    label: 'Finalizado',
    pulse: false,
  },
  scheduled: {
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Calendar,
    label: 'Agendado',
    pulse: false,
  },
  confirmed: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Confirmado',
    pulse: true,
  },
  cancelled: {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
    label: 'Cancelado',
    pulse: false,
  },
  'no-show': {
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: XCircle,
    label: 'Não Compareceu',
    pulse: false,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.scheduled;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${config.color} ${
        config.pulse ? 'animate-pulse' : ''
      } transition-all duration-200`}
    >
      <IconComponent className="w-3 h-3 mr-1.5" />
      {config.label}
    </span>
  );
}
