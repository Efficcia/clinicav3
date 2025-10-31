'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, Users, Eye, Edit, Trash2, Download } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useStore from '@/store/useStore';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import { deletePatientRemote, fetchPatients } from '@/lib/supabaseData';
import StatusBadge from '@/components/ui/StatusBadge';
import PatientForm from '@/components/patients/PatientForm';
import PatientDetailsModal from '@/components/patients/PatientDetailsModal';
import DeleteConfirmModal from '@/components/patients/DeleteConfirmModal';
import NotificationToast from '@/components/dashboard/NotificationToast';
import PageHeader from '@/components/ui/PageHeader';
import { Patient, PatientWithStatus } from '@/types';

type StatusFilter = 'all' | 'waiting' | 'in-consultation' | 'completed' | 'scheduled';
type SortOption = 'name' | 'date' | 'status';

export default function PatientsPage() {
  const { patients, getPatientsWithStatus, deletePatient, setPatients } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isClient, setIsClient] = useState(false);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Notification
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const supabaseActive = isSupabaseEnabled();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const patientsWithStatus = useMemo(() => getPatientsWithStatus(), [getPatientsWithStatus]);

  const filteredPatients = useMemo(() => {
    let filtered = patientsWithStatus.filter((patient) => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.phone.includes(searchTerm) ||
                          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.cpf.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [patientsWithStatus, searchTerm, statusFilter, sortBy, sortOrder]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const calculateAge = (birthDate: string) => {
    if (!isClient) return '';
    return `${new Date().getFullYear() - new Date(birthDate).getFullYear()} anos`;
  };

  const getPatientsThisMonth = () => {
    if (!isClient) return 0;
    const now = new Date();
    return patientsWithStatus.filter(p => {
      const patientDate = new Date(p.createdAt);
      return patientDate.getMonth() === now.getMonth() && patientDate.getFullYear() === now.getFullYear();
    }).length;
  };

  const statusCounts = patientsWithStatus.reduce((acc, patient) => {
    acc[patient.status] = (acc[patient.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    console.log('Editing patient:', patient);
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPatient) return;
    
    setIsDeleting(true);
    
    try {
      if (supabaseActive) {
        await deletePatientRemote(selectedPatient.id);
        const refreshed = await fetchPatients();
        setPatients(refreshed);
      } else {
        deletePatient(selectedPatient.id);
      }
      showNotification('Paciente excluído com sucesso!', 'success');
      setIsDeleteOpen(false);
      setSelectedPatient(null);
    } catch {
      showNotification('Erro ao excluir paciente', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSave = (patient: Patient) => {
    if (selectedPatient) {
      showNotification(`Paciente ${patient.name} atualizado com sucesso!`, 'success');
    } else {
      showNotification(`Paciente ${patient.name} cadastrado com sucesso!`, 'success');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'CPF', 'Cidade', 'Status'],
      ...filteredPatients.map(patient => [
        patient.name,
        patient.email,
        patient.phone,
        patient.cpf,
        patient.address.city,
        patient.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pacientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Dados exportados com sucesso!', 'success');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Gestão de Pacientes"
          description="Gerencie todos os pacientes da clínica"
          icon={Users}
        >
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={handleNewPatient}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Paciente</span>
          </button>
        </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Aguardando</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.waiting || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Em Consulta</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts['in-consultation'] || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Cadastrados Este Mês</p>
              <p className="text-2xl font-bold text-green-600">
                {getPatientsThisMonth()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="waiting">Aguardando</option>
                <option value="in-consultation">Em Consulta</option>
                <option value="completed">Finalizados</option>
                <option value="scheduled">Agendados</option>
              </select>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Ordenar por Nome</option>
              <option value="date">Ordenar por Data</option>
              <option value="status">Ordenar por Status</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            
            <div className="text-sm text-gray-500">
              {isClient ? `${filteredPatients.length} de ${patients.length} pacientes` : 'Carregando...'}
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Paciente</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Contato</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Consulta Atual</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(patient.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">
                          {calculateAge(patient.birthDate)} {calculateAge(patient.birthDate) && '•'} {patient.address.city}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <div className="text-gray-900">{formatPhone(patient.phone)}</div>
                      <div className="text-gray-500 truncate max-w-[200px]" title={patient.email}>
                        {patient.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      {patient.currentAppointment ? (
                        <>
                          <div className="text-gray-900">{patient.currentAppointment.time}</div>
                          <div className="text-gray-500 truncate max-w-[150px]">
                            {patient.currentAppointment.doctorName}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">Nenhuma consulta hoje</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={patient.status} />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewPatient(patient)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Visualizar detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditPatient(patient)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                        title="Editar paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePatient(patient)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Excluir paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum paciente encontrado</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando seu primeiro paciente'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button 
                onClick={handleNewPatient}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Cadastrar Primeiro Paciente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PatientForm
        patient={selectedPatient || undefined}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          // Don't clear selectedPatient immediately to allow useEffect to process
          setTimeout(() => setSelectedPatient(null), 100);
        }}
        onSave={handleFormSave}
      />

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedPatient(null);
          }}
          onEdit={handleEditPatient}
        />
      )}

      {selectedPatient && (
        <DeleteConfirmModal
          patient={selectedPatient}
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedPatient(null);
          }}
          onConfirm={confirmDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Notification Toast */}
      <NotificationToast
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
      </div>
    </div>
    </DashboardLayout>
  );
}
