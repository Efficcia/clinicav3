'use client';

import React from 'react';
import { Clock, Calendar, Stethoscope, Phone, CheckCircle } from 'lucide-react';
import { WaitlistEntry } from '@/types';

interface WaitlistPanelProps {
  entries: WaitlistEntry[];
  onSchedule: (entry: WaitlistEntry) => void;
  onMarkContacted: (entry: WaitlistEntry) => void;
}

const statusStyles: Record<WaitlistEntry['status'], { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  waiting: {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    text: 'text-amber-700',
    label: 'Aguardando',
    icon: <Clock className="w-4 h-4" />,
  },
  contacted: {
    bg: 'bg-blue-50 border-blue-200 text-blue-700',
    text: 'text-blue-700',
    label: 'Contato Realizado',
    icon: <Phone className="w-4 h-4" />,
  },
  scheduled: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'text-emerald-700',
    label: 'Agendado',
    icon: <CheckCircle className="w-4 h-4" />,
  },
};

export default function WaitlistPanel({ entries, onSchedule, onMarkContacted }: WaitlistPanelProps) {
  return (
    <div className="bg-white/90 rounded-xl p-6 border border-slate-200/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pacientes em Espera</h2>
          <p className="text-sm text-slate-600">Pessoas aguardando encaixe para consultas futuras</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
          {entries.length} paciente{entries.length === 1 ? '' : 's'}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum paciente em espera</h3>
          <p className="text-slate-600 text-sm">
            Você será notificado quando novos pacientes solicitarem encaixe.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const statusStyle = statusStyles[entry.status];
            return (
              <div key={entry.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{entry.patientName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.bg}`}>
                        {statusStyle.icon}
                        {statusStyle.label}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{entry.contact}</span>
                      </div>
                      {entry.preferredDoctor && (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-slate-400" />
                          <span>{entry.preferredDoctor}</span>
                        </div>
                      )}
                      {entry.preferredDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Preferência: {new Date(entry.preferredDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {entry.notes && (
                        <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-2">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onSchedule(entry)}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      Agendar
                    </button>
                    {entry.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => onMarkContacted(entry)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                      >
                        Registrar contato
                      </button>
                    )}
                    {entry.status === 'contacted' && (
                      <span className="text-xs text-blue-600 font-medium inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                        <Phone className="w-3 h-3" /> Contato feito
                      </span>
                    )}
                    {entry.status === 'scheduled' && (
                      <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                        <CheckCircle className="w-3 h-3" /> Já agendado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
