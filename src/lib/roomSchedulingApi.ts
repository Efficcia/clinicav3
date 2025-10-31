/**
 * API para Sistema de Ensalamento
 *
 * Integração com Supabase RPC para alocação automática de salas
 * Funções prontas para usar no frontend
 */

import { supabaseClient } from './supabaseClient';
import type {
  Room,
  RoomAllocation,
  RoomAllocationFull,
  RoomBlocking,
  DoctorRoomPreference,
  CandidateRoom,
  AlternativeSlot,
  RoomScheduleEntry,
  ProfessionalScheduleEntry,
  RoomStats,
  AllocationAudit,
} from '@/types';

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function handleSupabaseError(error: unknown, context: string): never {
  console.error(`[RoomScheduling] ${context}:`, error);

  // Log detalhado do erro
  if (error && typeof error === 'object') {
    console.error('Error details:', JSON.stringify(error, null, 2));
  }

  const errorMessage = error instanceof Error
    ? error.message
    : (error && typeof error === 'object' && 'message' in error)
      ? String(error.message)
      : 'Erro desconhecido';

  throw new Error(`Erro no ensalamento (${context}): ${errorMessage}`);
}

function convertToISO(date: string, time: string): string {
  return `${date}T${time}:00-03:00`; // America/Sao_Paulo
}

// ============================================================================
// SALAS (ROOMS)
// ============================================================================

/**
 * Busca todas as salas ativas
 */
export async function fetchRooms(): Promise<Room[]> {
  if (!supabaseClient) {
    console.warn('[RoomScheduling] Supabase não configurado');
    return [];
  }

  const { data, error } = await supabaseClient
    .from('rooms')
    .select('*')
    .eq('isActive', true)
    .order('name');

  if (error) {
    // Se a tabela não existe, retorna array vazio em vez de erro
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.warn('[RoomScheduling] Tabela rooms não existe. Execute as migrações SQL.');
      return [];
    }
    handleSupabaseError(error, 'fetchRooms');
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    features: row.features || {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Busca uma sala por ID
 */
export async function fetchRoomById(roomId: string): Promise<Room | null> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    handleSupabaseError(error, 'fetchRoomById');
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    isActive: data.isActive,
    features: data.features || {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Cria uma nova sala
 */
export async function createRoom(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .from('rooms')
    .insert({
      name: room.name,
      isActive: room.isActive,
      features: room.features || {},
    })
    .select()
    .single();

  if (error) handleSupabaseError(error, 'createRoom');

  return {
    id: data.id,
    name: data.name,
    isActive: data.isActive,
    features: data.features || {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Atualiza uma sala
 */
export async function updateRoom(roomId: string, updates: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Room> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.isActive !== undefined) payload.isActive = updates.isActive;
  if (updates.features !== undefined) payload.features = updates.features;

  const { data, error } = await supabaseClient
    .from('rooms')
    .update(payload)
    .eq('id', roomId)
    .select()
    .single();

  if (error) handleSupabaseError(error, 'updateRoom');

  return {
    id: data.id,
    name: data.name,
    isActive: data.isActive,
    features: data.features || {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// ============================================================================
// BLOQUEIOS DE SALA (ROOM BLOCKINGS)
// ============================================================================

/**
 * Cria bloqueio de sala (manutenção, limpeza, etc)
 */
export async function createRoomBlocking(blocking: Omit<RoomBlocking, 'id' | 'createdAt'>): Promise<RoomBlocking> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error} = await supabaseClient
    .from('room_blocking')
    .insert({
      roomId: blocking.roomId,
      startsAt: blocking.startsAt,
      endsAt: blocking.endsAt,
      reason: blocking.reason,
      createdBy: blocking.createdBy,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error, 'createRoomBlocking');

  return {
    id: data.id,
    roomId: data.roomId,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    reason: data.reason,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
  };
}

/**
 * Remove bloqueio de sala
 */
export async function deleteRoomBlocking(blockingId: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { error } = await supabaseClient
    .from('room_blocking')
    .delete()
    .eq('id', blockingId);

  if (error) handleSupabaseError(error, 'deleteRoomBlocking');
}

/**
 * Busca bloqueios de sala em um período
 */
export async function fetchRoomBlockings(roomId: string, startDate: string, endDate: string): Promise<RoomBlocking[]> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .from('room_blocking')
    .select('*')
    .eq('roomId', roomId)
    .gte('startsAt', startDate)
    .lte('endsAt', endDate)
    .order('startsAt');

  if (error) handleSupabaseError(error, 'fetchRoomBlockings');

  return (data || []).map(row => ({
    id: row.id,
    roomId: row.roomId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    reason: row.reason,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  }));
}

// ============================================================================
// ALOCAÇÃO DE SALAS (RPC FUNCTIONS)
// ============================================================================

/**
 * Busca salas candidatas disponíveis para um horário
 */
export async function getCandidateRooms(
  professionalId: string,
  startsAt: string,
  endsAt: string
): Promise<CandidateRoom[]> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .rpc('candidate_rooms', {
      p_professional_id: professionalId,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
    });

  if (error) handleSupabaseError(error, 'getCandidateRooms');

  return (data || []).map((row: {
    room_id: string;
    room_name: string;
    preference_priority: number;
    day_load_minutes: number;
    features: Record<string, unknown>;
  }) => ({
    roomId: row.room_id,
    roomName: row.room_name,
    preferencePriority: row.preference_priority,
    dayLoadMinutes: row.day_load_minutes,
    features: row.features || {},
  }));
}

/**
 * Aloca automaticamente uma sala para um appointment
 * Retorna roomId da sala alocada ou null se não conseguiu
 */
export async function allocateRoom(
  appointmentId: string,
  professionalId: string,
  startsAt: string,
  endsAt: string
): Promise<string | null> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  // Validação de parâmetros
  if (!appointmentId || appointmentId.trim() === '') {
    throw new Error('appointmentId é obrigatório e não pode ser vazio');
  }
  if (!professionalId || professionalId.trim() === '') {
    throw new Error('professionalId é obrigatório e não pode ser vazio');
  }
  if (!startsAt || startsAt.trim() === '') {
    throw new Error('startsAt é obrigatório e não pode ser vazio');
  }
  if (!endsAt || endsAt.trim() === '') {
    throw new Error('endsAt é obrigatório e não pode ser vazio');
  }

  console.log('[allocateRoom] Parâmetros recebidos:', {
    appointmentId,
    professionalId,
    startsAt,
    endsAt
  });

  const { data, error } = await supabaseClient
    .rpc('allocate_room', {
      p_appointment_id: appointmentId,
      p_professional_id: professionalId,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
    });

  if (error) handleSupabaseError(error, 'allocateRoom');

  return data; // UUID da sala ou null
}

/**
 * Remove alocação de sala de um appointment
 */
export async function deallocateRoom(appointmentId: string): Promise<boolean> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .rpc('deallocate_room', {
      p_appointment_id: appointmentId,
    });

  if (error) handleSupabaseError(error, 'deallocateRoom');

  return data; // true se removeu, false se não havia alocação
}

/**
 * Realoca sala (atualiza horário ou troca de sala)
 * Tenta manter mesma sala; se conflitar, busca outra
 */
export async function reallocateRoom(
  appointmentId: string,
  professionalId: string,
  newStartsAt: string,
  newEndsAt: string
): Promise<string | null> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .rpc('reallocate_room', {
      p_appointment_id: appointmentId,
      p_professional_id: professionalId,
      p_new_starts_at: newStartsAt,
      p_new_ends_at: newEndsAt,
    });

  if (error) handleSupabaseError(error, 'reallocateRoom');

  return data; // UUID da sala ou null
}

/**
 * Sugere horários e salas alternativos quando não há disponibilidade
 */
export async function suggestAlternativeSlots(
  professionalId: string,
  desiredStartsAt: string,
  desiredEndsAt: string,
  maxSuggestions = 3
): Promise<AlternativeSlot[]> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .rpc('suggest_alternative_slots', {
      p_professional_id: professionalId,
      p_desired_starts_at: desiredStartsAt,
      p_desired_ends_at: desiredEndsAt,
      p_max_suggestions: maxSuggestions,
    });

  if (error) handleSupabaseError(error, 'suggestAlternativeSlots');

  return (data || []).map((row: {
    room_id: string;
    room_name: string;
    suggested_starts: string;
    suggested_ends: string;
    offset_minutes: number;
  }) => ({
    roomId: row.room_id,
    roomName: row.room_name,
    suggestedStarts: row.suggested_starts,
    suggestedEnds: row.suggested_ends,
    offsetMinutes: row.offset_minutes,
  }));
}

// ============================================================================
// CONSULTAS DE AGENDA
// ============================================================================

/**
 * Busca agenda de uma sala em um período
 */
export async function getRoomSchedule(
  roomId: string,
  dateStart: string,
  dateEnd: string
): Promise<RoomScheduleEntry[]> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .rpc('get_room_schedule', {
      p_room_id: roomId,
      p_date_start: dateStart,
      p_date_end: dateEnd,
    });

  if (error) handleSupabaseError(error, 'getRoomSchedule');

  return (data || []).map((row: {
    allocation_id: string;
    appointment_id: string;
    professional_id: string;
    professional_name: string;
    starts_at: string;
    ends_at: string;
    duration_minutes: number;
  }) => ({
    allocationId: row.allocation_id,
    appointmentId: row.appointment_id,
    professionalId: row.professional_id,
    professionalName: row.professional_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
  }));
}

/**
 * Busca agenda de um profissional em um período
 */
export async function getProfessionalSchedule(
  professionalId: string,
  dateStart: string,
  dateEnd: string
): Promise<ProfessionalScheduleEntry[]> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .rpc('get_professional_schedule', {
      p_professional_id: professionalId,
      p_date_start: dateStart,
      p_date_end: dateEnd,
    });

  if (error) handleSupabaseError(error, 'getProfessionalSchedule');

  return (data || []).map((row: {
    allocation_id: string;
    appointment_id: string;
    room_id: string;
    room_name: string;
    starts_at: string;
    ends_at: string;
    duration_minutes: number;
  }) => ({
    allocationId: row.allocation_id,
    appointmentId: row.appointment_id,
    roomId: row.room_id,
    roomName: row.room_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
  }));
}

/**
 * Busca estatísticas de uso das salas
 */
export async function getRoomStats(): Promise<RoomStats[]> {
  if (!supabaseClient) {
    console.warn('[RoomScheduling] Supabase não configurado');
    return [];
  }

  const { data, error } = await supabaseClient
    .from('v_room_stats')
    .select('*')
    .order('name');

  if (error) {
    // Se a view não existe, retorna array vazio
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.warn('[RoomScheduling] View v_room_stats não existe. Execute as migrações SQL.');
      return [];
    }
    handleSupabaseError(error, 'getRoomStats');
  }

  return (data || []).map((row: {
    id: string;
    name: string;
    is_active: boolean;
    appointments_today: number;
    appointments_this_week: number;
    minutes_used_today: number;
    occupancy_rate_today_pct: number;
  }) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    appointmentsToday: row.appointments_today,
    appointmentsThisWeek: row.appointments_this_week,
    minutesUsedToday: row.minutes_used_today,
    occupancyRateTodayPct: row.occupancy_rate_today_pct,
  }));
}

/**
 * Busca alocações completas em um período (para exibição no calendário)
 */
export async function fetchAllocations(
  startDate: string,
  endDate: string
): Promise<RoomAllocationFull[]> {
  if (!supabaseClient) {
    console.warn('[RoomScheduling] Supabase não configurado');
    return [];
  }

  console.log('[fetchAllocations] Buscando alocações:', { startDate, endDate });

  const { data, error } = await supabaseClient
    .from('v_room_allocations_full')
    .select('*')
    .gte('starts_at', startDate)
    .lte('ends_at', endDate)
    .order('starts_at');

  console.log('[fetchAllocations] Resultado:', {
    error: error ? { code: error.code, message: error.message } : null,
    dataCount: data?.length || 0,
    data
  });

  if (error) {
    // Se a view não existe, retorna array vazio
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.warn('[RoomScheduling] View v_room_allocations_full não existe. Execute as migrações SQL.');
      return [];
    }
    handleSupabaseError(error, 'fetchAllocations');
  }

  return (data || []).map((row: {
    id: string;
    appointment_id: string;
    room_id: string;
    room_name: string;
    professional_id: string;
    professional_name: string;
    professional_specialty?: string;
    starts_at: string;
    ends_at: string;
    duration_minutes: number;
    created_at: string;
    updated_at: string;
  }) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    roomId: row.room_id,
    roomName: row.room_name,
    professionalId: row.professional_id,
    professionalName: row.professional_name,
    professionalSpecialty: row.professional_specialty,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Busca alocação de um appointment específico
 */
export async function getAllocationByAppointment(appointmentId: string): Promise<RoomAllocationFull | null> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .from('v_room_allocations_full')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    handleSupabaseError(error, 'getAllocationByAppointment');
  }

  if (!data) return null;

  return {
    id: data.id,
    appointmentId: data.appointment_id,
    roomId: data.room_id,
    roomName: data.room_name,
    professionalId: data.professional_id,
    professionalName: data.professional_name,
    professionalSpecialty: data.professional_specialty,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    durationMinutes: data.duration_minutes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================================================
// PREFERÊNCIAS DE SALA
// ============================================================================

/**
 * Busca preferências de sala de um profissional
 */
export async function fetchDoctorRoomPreferences(professionalId: string): Promise<DoctorRoomPreference[]> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabaseClient
    .from('doctor_room_preferences')
    .select('*')
    .eq('professionalId', professionalId)
    .order('priority');

  if (error) handleSupabaseError(error, 'fetchDoctorRoomPreferences');

  return (data || []).map(row => ({
    professionalId: row.professionalId,
    roomId: row.roomId,
    priority: row.priority,
    createdAt: row.createdAt,
  }));
}

/**
 * Define preferências de sala para um profissional
 */
export async function setDoctorRoomPreferences(
  professionalId: string,
  preferences: Array<{ roomId: string; priority: number }>
): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado');
  }

  // Remove preferências antigas
  const { error: deleteError } = await supabaseClient
    .from('doctor_room_preferences')
    .delete()
    .eq('professionalId', professionalId);

  if (deleteError) handleSupabaseError(deleteError, 'setDoctorRoomPreferences (delete)');

  // Insere novas preferências
  const { error: insertError } = await supabaseClient
    .from('doctor_room_preferences')
    .insert(
      preferences.map(pref => ({
        professionalId: professionalId,
        roomId: pref.roomId,
        priority: pref.priority,
      }))
    );

  if (insertError) handleSupabaseError(insertError, 'setDoctorRoomPreferences (insert)');
}

// ============================================================================
// HELPER: Alocar sala automaticamente ao criar/editar appointment
// ============================================================================

/**
 * Helper para uso em formulários de appointment
 * Aloca sala automaticamente e retorna resultado
 */
export async function autoAllocateRoomForAppointment(
  appointmentId: string,
  professionalId: string,
  date: string,
  time: string,
  durationMinutes = 60
): Promise<{
  success: boolean;
  roomId?: string;
  roomName?: string;
  alternatives?: AlternativeSlot[];
}> {
  try {
    const startsAt = convertToISO(date, time);
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();

    // Tenta alocar
    const roomId = await allocateRoom(appointmentId, professionalId, startsAt, endsAt);

    if (roomId) {
      // Sucesso: busca nome da sala
      const room = await fetchRoomById(roomId);
      return {
        success: true,
        roomId,
        roomName: room?.name,
      };
    }

    // Não conseguiu: busca alternativas
    const alternatives = await suggestAlternativeSlots(professionalId, startsAt, endsAt, 3);

    return {
      success: false,
      alternatives,
    };
  } catch (error) {
    console.error('[autoAllocateRoomForAppointment] Erro:', error);
    return {
      success: false,
    };
  }
}
