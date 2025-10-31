import type {
  Appointment,
  Company,
  FinancialEntry,
  Patient,
  Professional,
  TeamMember,
  WaitlistEntry,
} from '@/types';
import { supabaseClient } from './supabaseClient';

type Entity =
  | Professional
  | TeamMember
  | Patient
  | Appointment
  | FinancialEntry
  | WaitlistEntry
  | Company;

type PartialEntity<T extends Entity> = Omit<T, 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};

function generateId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  // UUID v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function fetchFromSupabase<T extends Entity>(table: string): Promise<T[]> {
  if (!supabaseClient) {
    return [];
  }

  // Define a ordem correta para cada tabela
  const getOrderConfig = (tableName: string) => {
    switch (tableName) {
      case 'appointments':
        return { column: 'date', ascending: false }; // Mais recentes primeiro
      case 'financial_entries':
        return { column: 'date', ascending: false };
      case 'waitlist':
        return { column: 'createdAt', ascending: false }; // Corrigido: camelCase
      case 'patients':
      case 'professionals':
      case 'team_members':
        return { column: 'name', ascending: true };
      case 'companies':
        return { column: 'name', ascending: true };
      default:
        return { column: 'createdAt', ascending: false }; // Corrigido: camelCase
    }
  };

  const orderConfig = getOrderConfig(table);

  const { data, error } = await supabaseClient
    .from<T>(table)
    .select('*')
    .order(orderConfig.column, { ascending: orderConfig.ascending });

  if (error) {
    console.error(`[Supabase] Erro ao buscar dados de ${table}:`, error);
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchProfessionals(): Promise<Professional[]> {
  return fetchFromSupabase<Professional>('professionals');
}

export async function createProfessional(payload: PartialEntity<Professional>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  } as Professional;

  const { error: supabaseError } = await supabaseClient.from('professionals').insert(record);
  if (supabaseError) {
    console.error('[Supabase] Erro ao criar profissional:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function updateProfessionalRemote(id: string, payload: Partial<Professional>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('professionals')
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao atualizar profissional:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function deleteProfessionalRemote(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient.from('professionals').delete().eq('id', id);
  if (supabaseError) {
    console.error('[Supabase] Erro ao remover profissional:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return fetchFromSupabase<TeamMember>('team_members');
}

export async function createTeamMember(payload: PartialEntity<TeamMember>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  } as TeamMember;

  const { error: supabaseError } = await supabaseClient.from('team_members').insert(record);
  if (supabaseError) {
    console.error('[Supabase] Erro ao criar membro da equipe:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function updateTeamMemberRemote(id: string, payload: Partial<TeamMember>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('team_members')
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao atualizar membro da equipe:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function deleteTeamMemberRemote(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('team_members')
    .delete()
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao remover membro da equipe:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

// Patients
export async function fetchPatients(): Promise<Patient[]> {
  return fetchFromSupabase<Patient>('patients');
}

export async function createPatient(payload: PartialEntity<Patient>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  } as Patient;

  const { error: supabaseError } = await supabaseClient.from('patients').insert(record);
  if (supabaseError) {
    console.error('[Supabase] Erro ao criar paciente:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function updatePatientRemote(id: string, payload: Partial<Patient>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('patients')
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao atualizar paciente:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function deletePatientRemote(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient.from('patients').delete().eq('id', id);
  if (supabaseError) {
    console.error('[Supabase] Erro ao remover paciente:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

// Appointments
export async function fetchAppointments(): Promise<Appointment[]> {
  return fetchFromSupabase<Appointment>('appointments');
}

export async function createAppointment(payload: PartialEntity<Appointment>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  } as Appointment;

  const { error: supabaseError } = await supabaseClient.from('appointments').insert(record);
  if (supabaseError) {
    console.error('[Supabase] Erro ao criar consulta:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function updateAppointmentRemote(id: string, payload: Partial<Appointment>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('appointments')
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao atualizar consulta:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function deleteAppointmentRemote(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient.from('appointments').delete().eq('id', id);
  if (supabaseError) {
    console.error('[Supabase] Erro ao remover consulta:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

// Financial entries
export async function fetchFinancialEntries(): Promise<FinancialEntry[]> {
  return fetchFromSupabase<FinancialEntry>('financial_entries');
}

export async function createFinancialEntry(payload: PartialEntity<FinancialEntry>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  } as FinancialEntry;

  const { error: supabaseError } = await supabaseClient.from('financial_entries').insert(record);
  if (supabaseError) {
    console.error('[Supabase] Erro ao criar lançamento financeiro:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function updateFinancialEntryRemote(id: string, payload: Partial<FinancialEntry>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('financial_entries')
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao atualizar lançamento financeiro:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function deleteFinancialEntryRemote(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('financial_entries')
    .delete()
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao remover lançamento financeiro:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

// Waitlist
export async function fetchWaitlistEntries(): Promise<WaitlistEntry[]> {
  return fetchFromSupabase<WaitlistEntry>('waitlist');
}

export async function createWaitlistEntry(payload: PartialEntity<WaitlistEntry>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id ?? generateId(),
    createdAt: now,
  } as WaitlistEntry;

  const { error: supabaseError } = await supabaseClient.from('waitlist').insert(record);
  if (supabaseError) {
    console.error('[Supabase] Erro ao criar registro na lista de espera:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function updateWaitlistEntryRemote(id: string, payload: Partial<WaitlistEntry>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('waitlist')
    .update({ ...payload })
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao atualizar registro da lista de espera:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

export async function deleteWaitlistEntryRemote(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const { error: supabaseError } = await supabaseClient
    .from('waitlist')
    .delete()
    .eq('id', id);

  if (supabaseError) {
    console.error('[Supabase] Erro ao remover registro da lista de espera:', supabaseError);
    throw new Error(supabaseError.message);
  }
}

// Company
export async function fetchCompany(): Promise<Company | null> {
  if (!supabaseClient) {
    return null;
  }

  const { data, error: supabaseError } = await supabaseClient.from('companies').select('*').limit(1).single();
  if (supabaseError && supabaseError.code !== 'PGRST116') {
    console.error('[Supabase] Erro ao buscar dados da clínica:', supabaseError);
    return null;
  }
  return data ?? null;
}

export async function upsertCompany(payload: PartialEntity<Company>): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase não está configurado.');
  }

  const now = new Date().toISOString();

  // Verificar se é um ID mockup (não é UUID válido)
  const isValidUUID = payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id);

  // Se não for UUID válido, buscar ou criar nova empresa
  if (!isValidUUID) {
    // Buscar empresa existente do usuário
    const { data: existingCompany } = await supabaseClient
      .from('companies')
      .select('*')
      .limit(1)
      .single();

    if (existingCompany) {
      // Atualizar empresa existente
      const updateRecord = {
        ...payload,
        updatedAt: now,
      };
      delete (updateRecord as any).id; // Não atualizar o ID
      delete (updateRecord as any).createdAt; // Não atualizar createdAt

      const { error: updateError } = await supabaseClient
        .from('companies')
        .update(updateRecord)
        .eq('id', existingCompany.id);

      if (updateError) {
        console.error('[Supabase] Erro ao atualizar dados da clínica:', updateError);
        throw new Error(updateError.message);
      }
    } else {
      // Criar nova empresa
      const newRecord = {
        ...payload,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as Company;

      const { error: insertError } = await supabaseClient
        .from('companies')
        .insert(newRecord);

      if (insertError) {
        console.error('[Supabase] Erro ao criar dados da clínica:', insertError);
        throw new Error(insertError.message);
      }
    }
  } else {
    // UUID válido, fazer upsert normal
    const record = {
      ...payload,
      updatedAt: now,
      createdAt: payload.createdAt ?? now,
    } as Company;

    const { error: supabaseError } = await supabaseClient.from('companies').upsert(record, { onConflict: 'id' });
    if (supabaseError) {
      console.error('[Supabase] Erro ao salvar dados da clínica:', supabaseError);
      throw new Error(supabaseError.message);
    }
  }
}

export interface BootstrapData {
  patients: Patient[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
  waitlist: WaitlistEntry[];
  professionals: Professional[];
  teamMembers: TeamMember[];
  company: Company | null;
}

export async function fetchInitialData(): Promise<BootstrapData> {
  console.log('[FETCH] 🚀 Iniciando fetchInitialData...');
  const startTime = performance.now();

  if (!supabaseClient) {
    console.log('[FETCH] ❌ Supabase client não disponível');
    return {
      patients: [],
      appointments: [],
      financialEntries: [],
      waitlist: [],
      professionals: [],
      teamMembers: [],
      company: null,
    };
  }

  console.log('[FETCH] 📡 Buscando dados do Supabase...');

  try {
    const [patients, appointments, financialEntries, waitlist, professionals, teamMembers, company] = await Promise.all([
      supabaseClient.from('patients').select('*'),
      supabaseClient.from('appointments').select('*'),
      supabaseClient.from('financial_entries').select('*'),
      supabaseClient.from('waitlist').select('*'),
      supabaseClient.from('professionals').select('*'),
      supabaseClient.from('team_members').select('*'),
      supabaseClient.from('companies').select('*').limit(1).maybeSingle(),
    ]);

    const duration = performance.now() - startTime;
    console.log(`[FETCH] ⏱️  Dados buscados em ${duration.toFixed(0)}ms`);

    const firstError = [patients.error, appointments.error, financialEntries.error, waitlist.error, professionals.error, teamMembers.error, company.error].find(Boolean);

    if (firstError) {
      console.error('[FETCH] ❌ Erro ao carregar dados:', firstError);
      throw new Error(firstError.message);
    }

    const result = {
      patients: patients.data ?? [],
      appointments: appointments.data ?? [],
      financialEntries: financialEntries.data ?? [],
      waitlist: waitlist.data ?? [],
      professionals: professionals.data ?? [],
      teamMembers: teamMembers.data ?? [],
      company: company.data ?? null,
    };

    console.log(`[FETCH] 📊 Dados retornados:`, {
      patients: result.patients.length,
      appointments: result.appointments.length,
      financialEntries: result.financialEntries.length,
      waitlist: result.waitlist.length,
      professionals: result.professionals.length,
      teamMembers: result.teamMembers.length,
      company: result.company ? 'OK' : 'NULL',
    });

    console.log(`[FETCH] ✅ Concluído! Total: ${duration.toFixed(0)}ms`);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.warn(`[FETCH] ⚠️ Timeout ou erro após ${duration.toFixed(0)}ms - retornando dados vazios`);
    console.error('[FETCH] Erro:', error);

    // Retorna dados vazios para não travar a aplicação
    return {
      patients: [],
      appointments: [],
      financialEntries: [],
      waitlist: [],
      professionals: [],
      teamMembers: [],
      company: null,
    };
  }
}
