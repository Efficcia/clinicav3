'use client';

import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { PatientWithStatus } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PatientStatusManager from './PatientStatusManager';

interface PatientModalProps {
  patient: PatientWithStatus;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function PatientModal({ patient, isOpen, onClose, onStatusChange }: PatientModalProps) {
  if (!isOpen) return null;

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const getAge = (birthDate: string) => {
    return new Date().getFullYear() - new Date(birthDate).getFullYear();
  };

  const handleStatusChange = () => {
    onStatusChange?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {patient.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <StatusBadge status={patient.status} />
                {patient.appointmentTime && (
                  <span className="text-sm text-slate-600">às {patient.appointmentTime}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-sm text-slate-700">Idade</div>
                  <div className="font-medium text-gray-900">{getAge(patient.birthDate)} anos</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-sm text-slate-700">Telefone</div>
                  <div className="font-medium text-gray-900">{formatPhone(patient.phone)}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-sm text-slate-700">Email</div>
                  <div className="font-medium text-gray-900">{patient.email}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-sm text-slate-700">Cidade</div>
                  <div className="font-medium text-gray-900">{patient.address.city}, {patient.address.state}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico Médico */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico Médico</h3>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Histórico</div>
                    <div className="text-sm text-blue-700">{patient.medicalHistory || 'Nenhum histórico registrado'}</div>
                  </div>
                </div>
              </div>
              
              {patient.allergies && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-900">Alergias</div>
                      <div className="text-sm text-red-700">{patient.allergies}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {patient.medications && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-600 rounded-full mt-0.5"></div>
                    <div>
                      <div className="text-sm font-medium text-green-900">Medicações</div>
                      <div className="text-sm text-green-700">{patient.medications}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Consulta Atual */}
          {patient.currentAppointment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consulta Atual</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-700">Médico</div>
                    <div className="font-medium text-gray-900">{patient.currentAppointment.doctorName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-700">Horário</div>
                    <div className="font-medium text-gray-900">{patient.currentAppointment.time}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-700">Tipo</div>
                    <div className="font-medium text-gray-900">
                      {patient.currentAppointment.type === 'consultation' ? 'Consulta' :
                       patient.currentAppointment.type === 'exam' ? 'Exame' :
                       patient.currentAppointment.type === 'procedure' ? 'Procedimento' : 'Retorno'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-700">Valor</div>
                    <div className="font-medium text-gray-900">
                      R$ {patient.currentAppointment.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
                
                {patient.currentAppointment.notes && (
                  <div className="mt-3">
                    <div className="text-sm text-slate-700">Observações</div>
                    <div className="text-sm text-gray-900">{patient.currentAppointment.notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contato de Emergência */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato de Emergência</h3>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-700">Nome</div>
                  <div className="font-medium text-gray-900">{patient.emergencyContact.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-700">Telefone</div>
                  <div className="font-medium text-gray-900">{formatPhone(patient.emergencyContact.phone)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-slate-700">Relacionamento</div>
                  <div className="font-medium text-gray-900">{patient.emergencyContact.relationship}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Ações da Consulta</h4>
              <p className="text-sm text-slate-700">Gerencie o status do atendimento</p>
            </div>
            <PatientStatusManager patient={patient} onStatusChange={handleStatusChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
