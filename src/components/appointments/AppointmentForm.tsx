'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, User, DollarSign, FileText, DoorOpen } from 'lucide-react';
import { Appointment, Room, Professional } from '@/types';
import useStore from '@/store/useStore';
import { isSupabaseEnabled, supabaseClient } from '@/lib/supabaseClient';
import { createAppointment, fetchAppointments, updateAppointmentRemote, fetchProfessionals } from '@/lib/supabaseData';
import { fetchRooms, allocateRoom, deallocateRoom } from '@/lib/roomSchedulingApi';

interface AppointmentFormProps {
  appointment?: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
}

export default function AppointmentForm({ appointment, isOpen, onClose, onSave }: AppointmentFormProps) {
  const { addAppointment, updateAppointment, setAppointments, patients } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const supabaseActive = isSupabaseEnabled();

  const [formData, setFormData] = useState<Partial<Appointment>>({
    patientId: '',
    doctorName: '',
    date: '',
    time: '',
    type: 'consultation',
    status: 'scheduled',
    price: 0,
    notes: '',
    paid: false
  });

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Editing existing appointment
        setFormData({
          ...appointment,
          date: appointment.date || '',
          time: appointment.time || ''
        });
        setDuration(appointment.duration || 60);
      } else {
        // New appointment
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        setFormData({
          patientId: '',
          doctorName: '',
          date: todayStr,
          time: '09:00',
          type: 'consultation',
          status: 'scheduled',
          price: 150,
          notes: '',
          paid: false
        });
        setDuration(60);
      }
      setErrors({});
      setSelectedRoomId('');
      setSelectedProfessionalId('');

      // Carregar salas e profissionais disponíveis
      if (supabaseActive) {
        loadRooms();
        loadProfessionals();
      }
    }
  }, [appointment, isOpen, supabaseActive]);

  async function loadRooms() {
    try {
      const roomsData = await fetchRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  }

  async function loadProfessionals() {
    try {
      console.log('[AppointmentForm] Carregando profissionais...');
      const professionalsData = await fetchProfessionals();
      console.log('[AppointmentForm] Profissionais carregados:', professionalsData);
      setProfessionals(professionalsData);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId?.trim()) {
      newErrors.patientId = 'Paciente é obrigatório';
    }

    if (!formData.doctorName?.trim()) {
      newErrors.doctorName = 'Nome do médico é obrigatório';
    }

    if (!formData.date?.trim()) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!formData.time?.trim()) {
      newErrors.time = 'Horário é obrigatório';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valor deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();
      const isEditing = Boolean(appointment);
      const payload = {
        ...formData,
        updatedAt: timestamp,
        ...(isEditing ? {} : { createdAt: timestamp }),
      } as Partial<Appointment>;

      if (supabaseActive) {
        let savedAppointmentId: string;

        if (isEditing && appointment) {
          await updateAppointmentRemote(appointment.id, payload);
          savedAppointmentId = appointment.id;
        } else {
          // Gerar ID antes de criar para poder usar na alocação de sala
          const newId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `tmp-${Date.now()}`;
          savedAppointmentId = newId;
          await createAppointment({ ...payload, id: newId });
        }

        const refreshed = await fetchAppointments();
        setAppointments(refreshed);
        const saved = refreshed.find((item) => item.id === savedAppointmentId) ?? (payload as Appointment);

        // Criar alocação de sala se um profissional foi escolhido (sala é opcional - será alocada automaticamente)
        if (selectedProfessionalId && selectedProfessionalId.trim() !== '' && formData.date && formData.time) {
          try {
            // Se está editando, primeiro remove a alocação antiga
            if (isEditing && appointment) {
              await deallocateRoom(appointment.id);
            }

            // Cria nova alocação (sala será escolhida automaticamente pela RPC function)
            const startsAt = `${formData.date}T${formData.time}:00-03:00`;
            const endsAt = new Date(new Date(startsAt).getTime() + duration * 60000).toISOString();

            console.log('[AppointmentForm] Alocando sala:', {
              appointmentId: savedAppointmentId,
              professionalId: selectedProfessionalId,
              startsAt,
              endsAt
            });

            await allocateRoom(
              savedAppointmentId,
              selectedProfessionalId, // ID do profissional selecionado
              startsAt,
              endsAt
            );
          } catch (error) {
            console.error('Erro ao alocar sala:', error);
            // Não bloqueia o salvamento do appointment
          }
        } else if (selectedProfessionalId === '' || !selectedProfessionalId) {
          console.log('[AppointmentForm] Alocação de sala não realizada - profissional não selecionado');
        }

        onSave(saved as Appointment);
      } else {
        const localId = appointment?.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tmp-${Date.now()}`);
        const appointmentData: Appointment = {
          ...(payload as Appointment),
          id: localId,
          createdAt: appointment?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (isEditing && appointment) {
          updateAppointment(appointment.id, appointmentData);
        } else {
          addAppointment(appointmentData);
        }

        onSave(appointmentData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <p className="text-slate-700">
                {appointment ? 'Atualize as informações do agendamento' : 'Crie um novo agendamento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Paciente */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Paciente *
            </label>
            <select
              value={formData.patientId || ''}
              onChange={(e) => handleInputChange('patientId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                errors.patientId ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Selecione um paciente...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
            {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
          </div>

          {/* Profissional */}
          {supabaseActive && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Profissional *
              </label>
              <select
                value={selectedProfessionalId}
                onChange={(e) => {
                  const profId = e.target.value;
                  setSelectedProfessionalId(profId);
                  // Atualiza o doctorName com o nome do profissional selecionado
                  const selectedProf = professionals.find(p => p.id === profId);
                  if (selectedProf) {
                    handleInputChange('doctorName', selectedProf.name);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Selecione um profissional...</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} {prof.specialty ? `- ${prof.specialty}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {professionals.length === 0 ? 'Nenhum profissional cadastrado - cadastre na página Equipe' : 'Necessário para alocar sala automaticamente'}
              </p>
            </div>
          )}

          {!supabaseActive && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Médico *
              </label>
              <input
                type="text"
                value={formData.doctorName || ''}
                onChange={(e) => handleInputChange('doctorName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.doctorName ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Nome do médico"
              />
              {errors.doctorName && <p className="text-red-500 text-xs mt-1">{errors.doctorName}</p>}
            </div>
          )}

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data *
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.date ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário *
              </label>
              <select
                value={formData.time || ''}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.time ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Tipo de Consulta
              </label>
              <select
                value={formData.type || 'consultation'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="consultation">Consulta</option>
                <option value="exam">Exame</option>
                <option value="procedure">Procedimento</option>
                <option value="return">Retorno</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'scheduled'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="scheduled">Agendado</option>
                <option value="confirmed">Confirmado</option>
                <option value="in-progress">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
                <option value="no-show">Não Compareceu</option>
              </select>
            </div>
          </div>

          {/* Valor e Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.price ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="150.00"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Pagamento
              </label>
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  checked={formData.paid || false}
                  onChange={(e) => handleInputChange('paid', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-slate-800">
                  Pagamento realizado
                </label>
              </div>
            </div>
          </div>

          {/* Sala e Duração */}
          {supabaseActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  <DoorOpen className="w-4 h-4 inline mr-2" />
                  Sala
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Selecione uma sala...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {rooms.length === 0 ? 'Nenhuma sala cadastrada - vá em Ensalamento para criar' : 'Opcional - deixe em branco para alocar automaticamente'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duração (minutos)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1h 30min</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Observações
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Observações adicionais sobre a consulta..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-slate-800 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
