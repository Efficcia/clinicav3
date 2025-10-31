'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Heart, AlertTriangle } from 'lucide-react';
import { Patient } from '@/types';
import useStore from '@/store/useStore';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import { createPatient, fetchPatients, updatePatientRemote } from '@/lib/supabaseData';
import { validateCPF, validateEmail, validatePhone } from '@/utils/validators';
import { useNotification } from '@/hooks/useNotification';
import NotificationToast from '@/components/dashboard/NotificationToast';

interface PatientFormProps {
  patient?: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export default function PatientForm({ patient, isOpen, onClose, onSave }: PatientFormProps) {
  const { addPatient, updatePatient, setPatients } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const supabaseActive = isSupabaseEnabled();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birthDate: '',
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: ''
    },
    medicalHistory: '',
    allergies: '',
    medications: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (patient) {
        // Editing existing patient - populate with patient data
        console.log('Loading patient for edit:', patient);
        setFormData({
          ...patient,
          // Ensure birthDate is in YYYY-MM-DD format for date input
          birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
          address: {
            street: patient.address?.street || '',
            number: patient.address?.number || '',
            complement: patient.address?.complement || '',
            district: patient.address?.district || '',
            city: patient.address?.city || '',
            state: patient.address?.state || '',
            zipCode: patient.address?.zipCode || ''
          },
          emergencyContact: {
            name: patient.emergencyContact?.name || '',
            phone: patient.emergencyContact?.phone || '',
            relationship: patient.emergencyContact?.relationship || ''
          }
        });
      } else {
        // New patient - clear form
        console.log('Opening new patient form');
        setFormData({
          name: '',
          email: '',
          phone: '',
          cpf: '',
          birthDate: '',
          address: {
            street: '',
            number: '',
            complement: '',
            district: '',
            city: '',
            state: '',
            zipCode: ''
          },
          medicalHistory: '',
          allergies: '',
          medications: '',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          }
        });
      }
      setErrors({});
    }
  }, [patient, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Nome é obrigatório
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Validar email se preenchido
    if (formData.email?.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar telefone se preenchido
    if (formData.phone?.trim() && !validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone inválido. Use (XX) XXXXX-XXXX';
    }

    // Validar CPF se preenchido
    if (formData.cpf?.trim() && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [section, subfield] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] && typeof prev[section as keyof typeof prev] === 'object'
            ? (prev[section as keyof typeof prev] as Record<string, unknown>)
            : {}),
          [subfield]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

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
      const isEditing = Boolean(patient);

      // Generate ID for new patients
      const newPatientId = !isEditing ? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tmp-${Date.now()}`) : undefined;

      const payload = {
        ...formData,
        updatedAt: timestamp,
        ...(isEditing ? {} : {
          createdAt: timestamp,
          id: newPatientId
        }),
      } as Partial<Patient>;

      console.log('Salvando paciente...', { isEditing, payload });

      if (supabaseActive) {
        let savedPatient: Patient;

        if (isEditing && patient) {
          await updatePatientRemote(patient.id, payload);
          const refreshed = await fetchPatients();
          setPatients(refreshed);
          savedPatient = refreshed.find((record) => record.id === patient.id) ?? (payload as Patient);
        } else {
          // Create new patient
          console.log('Criando novo paciente no Supabase...');
          await createPatient(payload as Required<typeof payload>);

          // Refresh data to get the newly created patient
          console.log('Recarregando lista de pacientes...');
          const refreshed = await fetchPatients();
          setPatients(refreshed);

          // Find the newly created patient - try multiple methods
          savedPatient = refreshed.find((record) => record.id === newPatientId) ||
                       refreshed.find((record) => record.email === payload.email && record.name === payload.name) ||
                       refreshed[refreshed.length - 1]; // fallback to last created

          console.log('Paciente salvo:', savedPatient);
        }

        onSave(savedPatient);
      } else {
        // Local storage mode
        const localId = patient?.id ?? newPatientId;
        const patientData: Patient = {
          ...(payload as Patient),
          id: localId!,
          createdAt: patient?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (isEditing && patient) {
          updatePatient(patient.id, patientData);
        } else {
          addPatient(patientData);
        }

        onSave(patientData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      if (error instanceof Error) {
        showNotification(`Erro ao salvar paciente: ${error.message}`, 'error');
      } else {
        showNotification('Erro desconhecido ao salvar paciente.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {patient ? 'Editar Paciente' : 'Novo Paciente'}
              </h2>
              <p className="text-slate-700">
                {patient ? 'Atualize as informações do paciente' : 'Cadastre um novo paciente no sistema'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Informações Pessoais */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Informações Pessoais</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Digite o nome completo"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="exemplo@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Endereço</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Rua/Avenida
                </label>
                <input
                  type="text"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Nome da rua"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.address?.number || ''}
                  onChange={(e) => handleInputChange('address.number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.address?.complement || ''}
                  onChange={(e) => handleInputChange('address.complement', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.address?.district || ''}
                  onChange={(e) => handleInputChange('address.district', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Nome do bairro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Cidade"
                />
                {errors['address.city'] && <p className="text-red-500 text-xs mt-1">{errors['address.city']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.address?.state || ''}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.address?.zipCode || ''}
                  onChange={(e) => handleInputChange('address.zipCode', formatCEP(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          {/* Informações Médicas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>Informações Médicas</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Histórico Médico
                </label>
                <textarea
                  value={formData.medicalHistory || ''}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Descreva o histórico médico relevante..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Alergias
                  </label>
                  <input
                    type="text"
                    value={formData.allergies || ''}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Ex: Dipirona, Penicilina"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Medicações em Uso
                  </label>
                  <input
                    type="text"
                    value={formData.medications || ''}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Ex: Losartana 50mg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contato de Emergência */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span>Contato de Emergência</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Nome completo"
                />
                {errors['emergencyContact.name'] && <p className="text-red-500 text-xs mt-1">{errors['emergencyContact.name']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact?.phone || ''}
                  onChange={(e) => handleInputChange('emergencyContact.phone', formatPhone(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                {errors['emergencyContact.phone'] && <p className="text-red-500 text-xs mt-1">{errors['emergencyContact.phone']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Relacionamento
                </label>
                <select
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Selecione...</option>
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Esposo(a)">Esposo(a)</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
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
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Paciente'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notification Toast */}
      <NotificationToast
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
