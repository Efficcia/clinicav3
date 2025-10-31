/**
 * Notificações WhatsApp para Sistema de Ensalamento
 *
 * Integração com Evolution API para enviar alertas quando:
 * - Não há sala disponível (conflito)
 * - Sala é alocada com sucesso
 * - Mudança de sala
 */

import type { AlternativeSlot } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || '';
const WHATSAPP_GROUP_ID = process.env.WHATSAPP_GROUP_ID || ''; // ID do grupo de gestão

const isWhatsAppEnabled = Boolean(
  EVOLUTION_API_URL &&
  EVOLUTION_API_KEY &&
  EVOLUTION_INSTANCE &&
  WHATSAPP_GROUP_ID
);

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function formatDateTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateTimeStr;
  }
}

function formatTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    return format(date, 'HH:mm', { locale: ptBR });
  } catch {
    return dateTimeStr;
  }
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!isWhatsAppEnabled) {
    console.warn('[WhatsApp] Não configurado. Mensagem não enviada:', message);
    return false;
  }

  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp] Erro ao enviar mensagem:', errorText);
      return false;
    }

    console.log('[WhatsApp] Mensagem enviada com sucesso');
    return true;
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', error);
    return false;
  }
}

// ============================================================================
// NOTIFICAÇÕES ESPECÍFICAS
// ============================================================================

/**
 * Notifica quando não há sala disponível (conflito)
 */
export async function notifyRoomConflict(params: {
  professionalName: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
  procedure?: string;
  alternatives?: AlternativeSlot[];
}): Promise<boolean> {
  const { professionalName, patientName, startsAt, endsAt, procedure, alternatives } = params;

  let message = `⚠️ *ENSALAMENTO PENDENTE*\n\n`;
  message += `*Profissional:* ${professionalName}\n`;
  message += `*Paciente:* ${patientName}\n`;
  message += `*Horário Solicitado:* ${formatDateTime(startsAt)}\n`;
  if (procedure) {
    message += `*Procedimento:* ${procedure}\n`;
  }
  message += `\n`;

  if (alternatives && alternatives.length > 0) {
    message += `🔄 *Sugestões de Horários/Salas Livres:*\n\n`;
    alternatives.forEach((alt, i) => {
      const offsetSign = alt.offsetMinutes > 0 ? '+' : '';
      const offsetStr = alt.offsetMinutes !== 0 ? ` (${offsetSign}${alt.offsetMinutes}min)` : ' (mesmo horário)';
      message += `${i + 1}. *${alt.roomName}*\n`;
      message += `   ${formatDateTime(alt.suggestedStarts)}${offsetStr}\n\n`;
    });
    message += `📋 *Ação Necessária:*\n`;
    message += `Por favor, ajuste o horário ou mova algum agendamento conflitante.\n`;
  } else {
    message += `❌ *Nenhuma sala disponível no dia.*\n\n`;
    message += `📋 *Ação Necessária:*\n`;
    message += `Necessário reagendar para outro dia ou liberar alguma sala.\n`;
  }

  return sendWhatsAppMessage(WHATSAPP_GROUP_ID, message);
}

/**
 * Notifica quando sala é alocada com sucesso
 */
export async function notifyRoomAllocated(params: {
  professionalName: string;
  patientName: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  procedure?: string;
}): Promise<boolean> {
  const { professionalName, patientName, roomName, startsAt, endsAt, procedure } = params;

  let message = `✅ *SALA ALOCADA*\n\n`;
  message += `*Sala:* ${roomName}\n`;
  message += `*Profissional:* ${professionalName}\n`;
  message += `*Paciente:* ${patientName}\n`;
  message += `*Horário:* ${formatDateTime(startsAt)}\n`;
  if (procedure) {
    message += `*Procedimento:* ${procedure}\n`;
  }

  // Opcional: comentar se não quiser notificação de sucesso
  // return sendWhatsAppMessage(WHATSAPP_GROUP_ID, message);

  console.log('[WhatsApp] Alocação bem-sucedida (notificação desabilitada):', message);
  return true;
}

/**
 * Notifica quando sala é trocada (realocação)
 */
export async function notifyRoomChanged(params: {
  professionalName: string;
  patientName: string;
  oldRoomName: string;
  newRoomName: string;
  startsAt: string;
  endsAt: string;
  reason: 'time_change' | 'conflict' | 'manual';
}): Promise<boolean> {
  const { professionalName, patientName, oldRoomName, newRoomName, startsAt, reason } = params;

  const reasonText = {
    time_change: 'mudança de horário',
    conflict: 'conflito de sala',
    manual: 'ajuste manual',
  }[reason];

  let message = `🔄 *TROCA DE SALA*\n\n`;
  message += `*Profissional:* ${professionalName}\n`;
  message += `*Paciente:* ${patientName}\n`;
  message += `*Horário:* ${formatDateTime(startsAt)}\n\n`;
  message += `*De:* ${oldRoomName}\n`;
  message += `*Para:* ${newRoomName}\n\n`;
  message += `*Motivo:* ${reasonText}\n`;

  return sendWhatsAppMessage(WHATSAPP_GROUP_ID, message);
}

/**
 * Notifica quando sala é desalocada (cancelamento)
 */
export async function notifyRoomDeallocated(params: {
  professionalName: string;
  patientName: string;
  roomName: string;
  startsAt: string;
  reason: 'cancelled' | 'no_show';
}): Promise<boolean> {
  const { professionalName, patientName, roomName, startsAt, reason } = params;

  const reasonText = {
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  }[reason];

  let message = `❌ *SALA LIBERADA*\n\n`;
  message += `*Sala:* ${roomName}\n`;
  message += `*Profissional:* ${professionalName}\n`;
  message += `*Paciente:* ${patientName}\n`;
  message += `*Horário:* ${formatDateTime(startsAt)}\n`;
  message += `*Status:* ${reasonText}\n\n`;
  message += `💡 Sala disponível para realocação.\n`;

  return sendWhatsAppMessage(WHATSAPP_GROUP_ID, message);
}

/**
 * Notifica quando sala é bloqueada (manutenção)
 */
export async function notifyRoomBlocked(params: {
  roomName: string;
  startsAt: string;
  endsAt: string;
  reason: string;
}): Promise<boolean> {
  const { roomName, startsAt, endsAt, reason } = params;

  let message = `🔧 *SALA BLOQUEADA*\n\n`;
  message += `*Sala:* ${roomName}\n`;
  message += `*Período:* ${formatDateTime(startsAt)} até ${formatTime(endsAt)}\n`;
  message += `*Motivo:* ${reason}\n\n`;
  message += `⚠️ Sala indisponível para agendamentos neste período.\n`;

  return sendWhatsAppMessage(WHATSAPP_GROUP_ID, message);
}

/**
 * Relatório diário de ocupação das salas
 */
export async function sendDailyRoomReport(params: {
  date: string;
  rooms: Array<{
    name: string;
    appointmentsCount: number;
    minutesUsed: number;
    occupancyPct: number;
  }>;
}): Promise<boolean> {
  const { date, rooms } = params;

  let message = `📊 *RELATÓRIO DE ENSALAMENTO*\n`;
  message += `*Data:* ${format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\n`;

  rooms.forEach((room) => {
    const hours = Math.floor(room.minutesUsed / 60);
    const minutes = room.minutesUsed % 60;
    message += `*${room.name}*\n`;
    message += `  Consultas: ${room.appointmentsCount}\n`;
    message += `  Tempo usado: ${hours}h${minutes > 0 ? `${minutes}min` : ''}\n`;
    message += `  Ocupação: ${room.occupancyPct.toFixed(1)}%\n\n`;
  });

  const avgOccupancy = rooms.reduce((sum, r) => sum + r.occupancyPct, 0) / rooms.length;
  message += `📈 *Ocupação Média:* ${avgOccupancy.toFixed(1)}%\n`;

  return sendWhatsAppMessage(WHATSAPP_GROUP_ID, message);
}

// ============================================================================
// VERIFICAÇÃO DE CONFIGURAÇÃO
// ============================================================================

export function isWhatsAppConfigured(): boolean {
  return isWhatsAppEnabled;
}

export function getWhatsAppConfig() {
  return {
    enabled: isWhatsAppEnabled,
    apiUrl: EVOLUTION_API_URL,
    instance: EVOLUTION_INSTANCE,
    groupId: WHATSAPP_GROUP_ID,
  };
}
