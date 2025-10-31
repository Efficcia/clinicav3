'use client';

import React, { useEffect, useState } from 'react';
import { DoorOpen, Activity, Clock, Calendar, AlertTriangle, Plus, Lock, Unlock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import RoomEditModal from '@/components/rooms/RoomEditModal';
import {
  fetchRooms,
  getRoomStats,
  fetchAllocations,
  createRoomBlocking,
} from '@/lib/roomSchedulingApi';
import type { Room, RoomStats, RoomAllocationFull } from '@/types';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<RoomStats[]>([]);
  const [allocations, setAllocations] = useState<RoomAllocationFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedRoomForBlock, setSelectedRoomForBlock] = useState<Room | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    try {
      setLoading(true);
      console.log('[RoomsPage] Buscando dados para data:', selectedDate);

      const [roomsData, statsData, allocationsData] = await Promise.all([
        fetchRooms(),
        getRoomStats(),
        fetchAllocations(
          `${selectedDate}T00:00:00-03:00`,
          `${selectedDate}T23:59:59-03:00`
        ),
      ]);

      console.log('[RoomsPage] Dados carregados:', {
        rooms: roomsData.length,
        stats: statsData.length,
        allocations: allocationsData.length,
        allocationsData
      });

      console.log('[RoomsPage] Salas cadastradas:', roomsData.map(r => ({ id: r.id, name: r.name })));
      console.log('[RoomsPage] Alocações detalhadas:', allocationsData.map(a => ({
        roomId: a.roomId,
        roomName: a.roomName,
        professionalName: a.professionalName,
        startsAt: a.startsAt
      })));

      // Se não houver dados reais, usa dados fictícios para demonstração
      if (roomsData.length === 0) {
        console.log('[RoomsPage] Nenhuma sala encontrada, usando mockup');
        setRooms(getMockRooms());
        setStats(getMockStats());
        setAllocations(getMockAllocations());
      } else {
        console.log('[RoomsPage] Usando dados reais');
        setRooms(roomsData);
        setStats(statsData);
        setAllocations(allocationsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de salas:', error);
      // Em caso de erro, também usa dados fictícios
      setRooms(getMockRooms());
      setStats(getMockStats());
      setAllocations(getMockAllocations());
    } finally {
      setLoading(false);
    }
  }

  // Dados fictícios para demonstração
  function getMockRooms(): Room[] {
    return [
      {
        id: '1',
        name: 'Sala 1 - Consultório Principal',
        isActive: true,
        features: { area_m2: 20, macas: 1, computador: true, ar_condicionado: true, pia: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Sala 2 - Consultório Pequeno',
        isActive: true,
        features: { area_m2: 12, macas: 1, computador: true, ar_condicionado: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Sala 3 - Procedimentos',
        isActive: true,
        features: { area_m2: 25, macas: 2, equipamentos_cirurgicos: true, laser: true, pia: true, ar_condicionado: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Sala 4 - Terapia',
        isActive: true,
        features: { area_m2: 18, macas: 1, som_ambiente: true, iluminacao_ajustavel: true, ar_condicionado: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Sala 5 - Exames',
        isActive: true,
        features: { area_m2: 15, maca_exame: 1, ultrassom: true, ecg: true, computador: true, ar_condicionado: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        name: 'Sala 6 - Polivalente',
        isActive: true,
        features: { area_m2: 16, macas: 1, computador: true, multiplo_uso: true, ar_condicionado: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  function getMockStats(): RoomStats[] {
    return [
      { id: '1', name: 'Sala 1 - Consultório Principal', isActive: true, appointmentsToday: 8, appointmentsThisWeek: 42, minutesUsedToday: 420, occupancyRateTodayPct: 70 },
      { id: '2', name: 'Sala 2 - Consultório Pequeno', isActive: true, appointmentsToday: 6, appointmentsThisWeek: 35, minutesUsedToday: 330, occupancyRateTodayPct: 55 },
      { id: '3', name: 'Sala 3 - Procedimentos', isActive: true, appointmentsToday: 5, appointmentsThisWeek: 28, minutesUsedToday: 360, occupancyRateTodayPct: 60 },
      { id: '4', name: 'Sala 4 - Terapia', isActive: true, appointmentsToday: 7, appointmentsThisWeek: 38, minutesUsedToday: 390, occupancyRateTodayPct: 65 },
      { id: '5', name: 'Sala 5 - Exames', isActive: true, appointmentsToday: 9, appointmentsThisWeek: 45, minutesUsedToday: 450, occupancyRateTodayPct: 75 },
      { id: '6', name: 'Sala 6 - Polivalente', isActive: true, appointmentsToday: 4, appointmentsThisWeek: 22, minutesUsedToday: 240, occupancyRateTodayPct: 40 },
    ];
  }

  function getMockAllocations(): RoomAllocationFull[] {
    const today = selectedDate;
    return [
      // Sala 1
      { id: 'a1', appointmentId: 'apt1', roomId: '1', roomName: 'Sala 1', professionalId: 'p1', professionalName: 'Dr. Carlos Silva', professionalSpecialty: 'Clínico Geral', startsAt: `${today}T09:00:00-03:00`, endsAt: `${today}T10:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a2', appointmentId: 'apt2', roomId: '1', roomName: 'Sala 1', professionalId: 'p1', professionalName: 'Dr. Carlos Silva', professionalSpecialty: 'Clínico Geral', startsAt: `${today}T10:30:00-03:00`, endsAt: `${today}T11:30:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a3', appointmentId: 'apt3', roomId: '1', roomName: 'Sala 1', professionalId: 'p1', professionalName: 'Dr. Carlos Silva', professionalSpecialty: 'Clínico Geral', startsAt: `${today}T14:00:00-03:00`, endsAt: `${today}T15:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },

      // Sala 2
      { id: 'a4', appointmentId: 'apt4', roomId: '2', roomName: 'Sala 2', professionalId: 'p4', professionalName: 'Dra. Juliana Costa', professionalSpecialty: 'Psicologia', startsAt: `${today}T08:00:00-03:00`, endsAt: `${today}T09:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a5', appointmentId: 'apt5', roomId: '2', roomName: 'Sala 2', professionalId: 'p4', professionalName: 'Dra. Juliana Costa', professionalSpecialty: 'Psicologia', startsAt: `${today}T13:00:00-03:00`, endsAt: `${today}T14:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },

      // Sala 3
      { id: 'a6', appointmentId: 'apt6', roomId: '3', roomName: 'Sala 3', professionalId: 'p2', professionalName: 'Dra. Ana Paula Oliveira', professionalSpecialty: 'Dermatologia', startsAt: `${today}T09:00:00-03:00`, endsAt: `${today}T10:30:00-03:00`, durationMinutes: 90, createdAt: today, updatedAt: today },
      { id: 'a7', appointmentId: 'apt7', roomId: '3', roomName: 'Sala 3', professionalId: 'p2', professionalName: 'Dra. Ana Paula Oliveira', professionalSpecialty: 'Dermatologia', startsAt: `${today}T11:00:00-03:00`, endsAt: `${today}T12:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },

      // Sala 4
      { id: 'a8', appointmentId: 'apt8', roomId: '4', roomName: 'Sala 4', professionalId: 'p4', professionalName: 'Dra. Juliana Costa', professionalSpecialty: 'Psicologia', startsAt: `${today}T10:00:00-03:00`, endsAt: `${today}T11:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a9', appointmentId: 'apt9', roomId: '4', roomName: 'Sala 4', professionalId: 'p4', professionalName: 'Dra. Juliana Costa', professionalSpecialty: 'Psicologia', startsAt: `${today}T15:00:00-03:00`, endsAt: `${today}T16:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },

      // Sala 5
      { id: 'a10', appointmentId: 'apt10', roomId: '5', roomName: 'Sala 5', professionalId: 'p5', professionalName: 'Dr. Fernando Almeida', professionalSpecialty: 'Cardiologia', startsAt: `${today}T08:30:00-03:00`, endsAt: `${today}T09:30:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a11', appointmentId: 'apt11', roomId: '5', roomName: 'Sala 5', professionalId: 'p5', professionalName: 'Dr. Fernando Almeida', professionalSpecialty: 'Cardiologia', startsAt: `${today}T10:00:00-03:00`, endsAt: `${today}T11:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a12', appointmentId: 'apt12', roomId: '5', roomName: 'Sala 5', professionalId: 'p5', professionalName: 'Dr. Fernando Almeida', professionalSpecialty: 'Cardiologia', startsAt: `${today}T14:00:00-03:00`, endsAt: `${today}T15:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },

      // Sala 6
      { id: 'a13', appointmentId: 'apt13', roomId: '6', roomName: 'Sala 6', professionalId: 'p3', professionalName: 'Dr. Roberto Santos', professionalSpecialty: 'Ortopedia', startsAt: `${today}T09:00:00-03:00`, endsAt: `${today}T10:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
      { id: 'a14', appointmentId: 'apt14', roomId: '6', roomName: 'Sala 6', professionalId: 'p3', professionalName: 'Dr. Roberto Santos', professionalSpecialty: 'Ortopedia', startsAt: `${today}T11:00:00-03:00`, endsAt: `${today}T12:00:00-03:00`, durationMinutes: 60, createdAt: today, updatedAt: today },
    ];
  }

  const getRoomStatsById = (roomId: string) => {
    return stats.find((s) => s.id === roomId);
  };

  const getRoomAllocations = (roomId: string) => {
    const filtered = allocations.filter((a) => {
      console.log('[getRoomAllocations] Comparando:', {
        allocationRoomId: a.roomId,
        targetRoomId: roomId,
        match: a.roomId === roomId,
        allocation: a
      });
      return a.roomId === roomId;
    });
    console.log('[getRoomAllocations] Resultado para sala', roomId, ':', filtered.length, 'alocações');
    return filtered.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  };

  const handleBlockRoom = (room: Room) => {
    setSelectedRoomForBlock(room);
    setIsBlockModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Ensalamento"
          description="Gestão de salas e alocações"
          icon={DoorOpen}
          action={{
            label: '+ Nova Sala',
            onClick: () => {
              setSelectedRoomForEdit(undefined);
              setIsEditModalOpen(true);
            },
            variant: 'primary',
          }}
        />

        {/* Seletor de Data */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <span className="text-sm text-gray-600">
              {format(new Date(selectedDate), "EEEE, dd 'de' MMMM", {
                locale: ptBR,
              })}
            </span>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Salas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rooms.filter((r) => r.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DoorOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Consultas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.reduce((sum, s) => sum + s.appointmentsToday, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ocupação Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.length > 0
                    ? (
                        stats.reduce((sum, s) => sum + s.occupancyRateTodayPct, 0) /
                        stats.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Salas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando salas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rooms.map((room) => {
              const roomStats = getRoomStatsById(room.id);
              const roomAllocations = getRoomAllocations(room.id);

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header da Sala */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <DoorOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {room.name}
                          </h3>
                          <p className="text-sm text-blue-100">
                            {roomStats?.appointmentsToday || 0} consultas hoje
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRoomForEdit(room);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          title="Editar sala"
                        >
                          <Edit className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => handleBlockRoom(room)}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          title="Bloquear sala"
                        >
                          <Lock className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Ocupação</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {roomStats?.occupancyRateTodayPct.toFixed(1) || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tempo Usado</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {Math.floor((roomStats?.minutesUsedToday || 0) / 60)}h
                          {(roomStats?.minutesUsedToday || 0) % 60}min
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Esta Semana</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {roomStats?.appointmentsThisWeek || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Características */}
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      CARACTERÍSTICAS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(room.features)
                        .filter(([_, value]) => value === true || typeof value === 'number')
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {key.replace(/_/g, ' ')}
                            {typeof value === 'number' ? `: ${value}` : ''}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Alocações do Dia */}
                  <div className="p-4">
                    <p className="text-xs font-medium text-gray-500 mb-3">
                      AGENDA DO DIA
                    </p>
                    {roomAllocations.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Nenhuma consulta agendada
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {roomAllocations.map((allocation) => (
                          <div
                            key={allocation.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {allocation.professionalName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(
                                  new Date(allocation.startsAt),
                                  'HH:mm',
                                  { locale: ptBR }
                                )}{' '}
                                -{' '}
                                {format(new Date(allocation.endsAt), 'HH:mm', {
                                  locale: ptBR,
                                })}{' '}
                                ({allocation.durationMinutes}min)
                              </p>
                            </div>
                            {allocation.professionalSpecialty && (
                              <span className="text-xs text-gray-500">
                                {allocation.professionalSpecialty}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Bloqueio (placeholder) */}
        {isBlockModalOpen && selectedRoomForBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Bloquear Sala
              </h3>
              <p className="text-gray-600 mb-4">
                Funcionalidade de bloqueio em desenvolvimento.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                <strong>Sala:</strong> {selectedRoomForBlock.name}
              </p>
              <button
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setSelectedRoomForBlock(null);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Edição de Sala */}
        <RoomEditModal
          room={selectedRoomForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRoomForEdit(undefined);
          }}
          onSave={() => {
            loadData();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
