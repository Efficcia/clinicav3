'use client';

import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, FileText, AlertTriangle, Heart, Edit } from 'lucide-react';
import { Patient } from '@/types';
import useStore from '@/store/useStore';

interface PatientDetailsModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
}

export default function PatientDetailsModal({ patient, isOpen, onClose, onEdit }: PatientDetailsModalProps) {
  const { appointments } = useStore();
  
  if (!isOpen) return null;

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const getAge = (birthDate: string) => {
    return new Date().getFullYear() - new Date(birthDate).getFullYear();
  };

  const patientAppointments = appointments
    .filter(apt => apt.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Finalizada';
      case 'scheduled':
        return 'Agendada';
      case 'cancelled':
        return 'Cancelada';
      case 'in-progress':
        return 'Em Andamento';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {patient.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <p className="text-slate-700">{getAge(patient.birthDate)} anos • {patient.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(patient)}
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
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Pessoais */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Informações de Contato</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-slate-700">Telefone</div>
                      <div className="font-medium text-gray-900">{formatPhone(patient.phone)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-slate-700">Email</div>
                      <div className="font-medium text-gray-900">{patient.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-slate-700">CPF</div>
                      <div className="font-medium text-gray-900">{patient.cpf}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-slate-700">Data de Nascimento</div>
                      <div className="font-medium text-gray-900">
                        {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Endereço</span>
                </h3>
                
                <div className="text-slate-800">
                  <p className="font-medium">
                    {patient.address.street}, {patient.address.number}
                    {patient.address.complement && ` - ${patient.address.complement}`}
                  </p>
                  <p>
                    {patient.address.district} - {patient.address.city}, {patient.address.state}
                  </p>
                  {patient.address.zipCode && <p>CEP: {patient.address.zipCode}</p>}
                </div>
              </div>

              {/* Histórico Médico */}
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span>Informações Médicas</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-slate-800 mb-1">Histórico Médico</div>
                    <div className="text-slate-700">
                      {patient.medicalHistory || 'Nenhum histórico registrado'}
                    </div>
                  </div>
                  
                  {patient.allergies && (
                    <div>
                      <div className="text-sm font-medium text-red-700 mb-1">⚠️ Alergias</div>
                      <div className="text-red-600 font-medium">{patient.allergies}</div>
                    </div>
                  )}
                  
                  {patient.medications && (
                    <div>
                      <div className="text-sm font-medium text-slate-800 mb-1">Medicações em Uso</div>
                      <div className="text-slate-700">{patient.medications}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contato de Emergência */}
              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>Contato de Emergência</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-700">Nome</div>
                    <div className="font-medium text-gray-900">{patient.emergencyContact.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-700">Telefone</div>
                    <div className="font-medium text-gray-900">{formatPhone(patient.emergencyContact.phone)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-700">Relacionamento</div>
                    <div className="font-medium text-gray-900">{patient.emergencyContact.relationship}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Appointments */}
            <div className="space-y-6">
              {/* Últimas Consultas */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Consultas</h3>
                
                {patientAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {patientAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('pt-BR')}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700">
                          <div>{appointment.doctorName}</div>
                          <div>{appointment.time} • R$ {appointment.price.toFixed(2)}</div>
                          {appointment.notes && (
                            <div className="mt-1 text-xs text-slate-600">{appointment.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhuma consulta registrada</p>
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Total de Consultas</span>
                    <span className="font-bold text-xl">{patientAppointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Última Consulta</span>
                    <span className="font-medium">
                      {patientAppointments.length > 0 
                        ? new Date(patientAppointments[0].date).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Paciente desde</span>
                    <span className="font-medium">
                      {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                  Agendar Consulta
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                  Ver Histórico Completo
                </button>
                <button 
                  onClick={() => onEdit(patient)}
                  className="w-full border border-gray-200 text-slate-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Editar Informações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}