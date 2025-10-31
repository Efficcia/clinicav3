'use client';

import React from 'react';
import { X, Calendar, User, DollarSign, FileText, Edit } from 'lucide-react';
import { Appointment } from '@/types';
import useStore from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentDetailsModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onEdit 
}: AppointmentDetailsModalProps) {
  const { patients } = useStore();
  
  if (!isOpen) return null;

  const patient = patients.find(p => p.id === appointment.patientId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consulta';
      case 'exam': return 'Exame';
      case 'procedure': return 'Procedimento';
      case 'follow-up': return 'Retorno';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detalhes da Consulta</h2>
              <p className="text-slate-700">{formatDate(appointment.date)} às {appointment.time}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(appointment)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Status da Consulta</h3>
            <StatusBadge status={appointment.status} />
          </div>

          {/* Patient Info */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Informações do Paciente</span>
            </h3>
            
            {patient ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-700">Nome</div>
                  <div className="font-medium text-gray-900">{patient.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-700">Telefone</div>
                  <div className="font-medium text-gray-900">{patient.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-700">Email</div>
                  <div className="font-medium text-gray-900">{patient.email}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-700">CPF</div>
                  <div className="font-medium text-gray-900">{patient.cpf}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-600">Paciente não encontrado</div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Detalhes da Consulta</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-700">Médico</div>
                <div className="font-medium text-gray-900">{appointment.doctorName}</div>
              </div>
              <div>
                <div className="text-sm text-slate-700">Tipo</div>
                <div className="font-medium text-gray-900">{getTypeLabel(appointment.type)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-700">Data</div>
                <div className="font-medium text-gray-900">{formatDate(appointment.date)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-700">Horário</div>
                <div className="font-medium text-gray-900">{appointment.time}</div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Informações de Pagamento</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-700">Valor</div>
                <div className="font-medium text-gray-900">{formatCurrency(appointment.price)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-700">Status do Pagamento</div>
                <div className={`font-medium ${appointment.paid ? 'text-green-600' : 'text-red-600'}`}>
                  {appointment.paid ? '✓ Pago' : 'Pendente'}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <span>Observações</span>
              </h3>
              <p className="text-slate-800">{appointment.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => onEdit(appointment)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Editar Consulta
            </button>
            <button 
              onClick={onClose}
              className="flex-1 border border-gray-200 text-slate-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
