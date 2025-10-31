'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Clock, Users, Bot, Save, X, Check, Trash2, Plus, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import useStore from '@/store/useStore';
import ProfessionalManager from '@/components/settings/ProfessionalManager';
import TeamMemberManager from '@/components/settings/TeamMemberManager';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import { fetchCompany, upsertCompany } from '@/lib/supabaseData';

type SettingsTab = 'general' | 'hours' | 'ai' | 'professionals' | 'users';
type FormValue = string | number | boolean;

function SettingsContent() {
  const { company, setCompany } = useStore();
  const supabaseActive = isSupabaseEnabled();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [formData, setFormData] = useState(company || {
    id: '1',
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: ''
    },
    businessHours: {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '08:00', close: '12:00', isOpen: true },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    },
    specialties: [],
    aiConfig: {
      enabled: false,
      knowledgeBase: '',
      tone: 'professional' as const,
      autoScheduling: false
    },
    whatsappConfig: {
      enabled: false,
      evolutionApiUrl: '',
      webhookUrl: ''
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'medium',
      auditLog: true
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      retention: 30,
      lastBackup: '2024-01-15 02:00:00'
    }
  });

  const [newSpecialty, setNewSpecialty] = useState('');

  // Check for URL parameter to set initial tab
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'ia') {
      setActiveTab('ai');
    }
  }, [searchParams]);

  // Load company data from Supabase on mount
  useEffect(() => {
    const loadCompanyData = async () => {
      if (supabaseActive) {
        const companyData = await fetchCompany();
        if (companyData) {
          setFormData(companyData);
          setCompany(companyData);
        }
      }
    };
    loadCompanyData();
  }, [supabaseActive, setCompany]);

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Building2 }> = [
    { id: 'general', label: 'Dados Gerais', icon: Building2 },
    { id: 'hours', label: 'Funcionamento', icon: Clock },
    { id: 'ai', label: 'Inteligência Artificial', icon: Bot },
    { id: 'professionals', label: 'Equipe Médica', icon: Users },
    { id: 'users', label: 'Equipe Administrativa', icon: Users }
  ];

  const weekDays = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const handleSave = async () => {
    try {
      if (supabaseActive) {
        await upsertCompany(formData);
        const updated = await fetchCompany();
        if (updated) {
          setCompany(updated);
        }
      } else {
        setCompany(formData);
      }

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Configurações salvas com sucesso!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações da clínica:', error);
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Não foi possível salvar as configurações.';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const handleInputChange = <Section extends keyof typeof formData>(
    section: Section,
    field: string,
    value: FormValue,
  ) => {
    setFormData(prev => {
      const sectionData = prev[section];
      if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
        return {
          ...prev,
          [section]: {
            ...(sectionData as Record<string, unknown>),
            [field]: value,
          },
        };
      }

      return prev;
    });
  };

  const handleNestedInputChange = <Section extends keyof typeof formData>(
    section: Section,
    subsection: string,
    field: string,
    value: FormValue,
  ) => {
    setFormData(prev => {
      const sectionData = prev[section];
      if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
        const subsectionData = (sectionData as Record<string, unknown>)[subsection];
        return {
          ...prev,
          [section]: {
            ...(sectionData as Record<string, unknown>),
            [subsection]: {
              ...(subsectionData && typeof subsectionData === 'object'
                ? (subsectionData as Record<string, unknown>)
                : {}),
              [field]: value,
            },
          },
        };
      }

      return prev;
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 bg-white min-h-screen">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações da sua clínica"
        icon={Building2}
      >
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/25"
        >
          <Save className="w-5 h-5" />
          <span>Salvar Alterações</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações da Empresa</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Clínica
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite o nome da clínica"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contato@clinica.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rua/Avenida
                      </label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.address.number}
                        onChange={(e) => handleInputChange('address', 'number', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={formData.address.complement || ''}
                        onChange={(e) => handleInputChange('address', 'complement', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.address.district}
                        onChange={(e) => handleInputChange('address', 'district', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Especialidades</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {specialty}
                        <button
                          onClick={() => removeSpecialty(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite uma especialidade"
                    />
                    <button
                      onClick={addSpecialty}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Horário de Funcionamento</h2>
                  
                  <div className="space-y-4">
                    {weekDays.map((day) => {
                      const dayHours = formData.businessHours?.[day.key as keyof typeof formData.businessHours] ||
                                      { open: '08:00', close: '18:00', isOpen: true };

                      return (
                        <div key={day.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={dayHours.isOpen}
                              onChange={(e) => handleNestedInputChange('businessHours', day.key, 'isOpen', e.target.checked)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium text-gray-900 w-32">{day.label}</span>
                          </div>

                          {dayHours.isOpen && (
                            <div className="flex items-center space-x-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Abertura</label>
                                <input
                                  type="time"
                                  value={dayHours.open}
                                  onChange={(e) => handleNestedInputChange('businessHours', day.key, 'open', e.target.value)}
                                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Fechamento</label>
                                <input
                                  type="time"
                                  value={dayHours.close}
                                  onChange={(e) => handleNestedInputChange('businessHours', day.key, 'close', e.target.value)}
                                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações de IA</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Ativar Inteligência Artificial</h3>
                        <p className="text-sm text-gray-600">Habilita respostas automáticas via WhatsApp</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.aiConfig?.enabled || false}
                        onChange={(e) => handleInputChange('aiConfig', 'enabled', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>

                    {formData.aiConfig?.enabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tom de Voz
                          </label>
                          <select
                            value={formData.aiConfig?.tone || 'professional'}
                            onChange={(e) => handleInputChange('aiConfig', 'tone', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="professional">Profissional</option>
                            <option value="friendly">Amigável</option>
                            <option value="casual">Casual</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Base de Conhecimento
                          </label>
                          <textarea
                            value={formData.aiConfig?.knowledgeBase || ''}
                            onChange={(e) => handleInputChange('aiConfig', 'knowledgeBase', e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Descreva os serviços da clínica, preços, políticas, horários de funcionamento, etc..."
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">Agendamento Automático</h3>
                            <p className="text-sm text-gray-600">Permite que a IA agende consultas automaticamente</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.aiConfig?.autoScheduling || false}
                            onChange={(e) => handleInputChange('aiConfig', 'autoScheduling', e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'professionals' && <ProfessionalManager />}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Em Ajustes e Testes</h3>
                    <p className="text-sm text-yellow-800">
                      Esta funcionalidade está em desenvolvimento e pode apresentar comportamentos inesperados.
                    </p>
                  </div>
                </div>
                <TeamMemberManager />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
