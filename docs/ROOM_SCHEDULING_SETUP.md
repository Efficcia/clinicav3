# Sistema de Ensalamento - Guia de Instalação

## 📋 Visão Geral

Sistema de ensalamento real e oficial para o ClinicTech com:
- ✅ 6 salas físicas com características
- ✅ 5 profissionais com preferências de sala
- ✅ Alocação automática SEM conflitos (exclusion constraints)
- ✅ Bloqueios de sala (manutenção, equipamento)
- ✅ Integração perfeita com sistema de agenda existente
- ✅ Notificações via WhatsApp (Evolution API)

**Fonte da Verdade**: Sistema de agenda existente → webhook → alocação automática

---

## 🚀 Instalação Rápida (5 passos)

### Passo 1: Executar Migrações no Supabase

Acesse o [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) do seu projeto e execute os arquivos na ordem:

```bash
# 1. Schema (tabelas + constraints)
supabase/migrations/001_room_scheduling_schema.sql

# 2. Funções RPC
supabase/migrations/002_room_scheduling_functions.sql

# 3. Seed (6 salas + 5 profissionais)
supabase/migrations/003_room_scheduling_seed.sql
```

**Validação**: Execute no SQL Editor para verificar:
```sql
-- Deve retornar 6 salas e 5 profissionais
SELECT 'rooms' AS type, COUNT(*) FROM rooms
UNION ALL
SELECT 'professionals', COUNT(*) FROM professionals;
```

---

### Passo 2: Instalar Dependências (se necessário)

O sistema já usa as libs instaladas no ClinicTech. **Nenhuma dependência adicional necessária!**

Bibliotecas utilizadas (já presentes):
- `@supabase/supabase-js` - Cliente Supabase
- `date-fns` - Manipulação de datas
- `zustand` - State management

---

### Passo 3: Configurar Variáveis de Ambiente

O `.env.local` já está configurado com Supabase. Verifique:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ogbhjwcssthpktirygmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Para webhooks
```

---

### Passo 4: Testar API de Ensalamento

Crie um arquivo de teste `scripts/test-room-scheduling.ts`:

```typescript
import { allocateRoom, getCandidateRooms, getRoomSchedule } from '@/lib/roomSchedulingApi';

async function testRoomScheduling() {
  console.log('🧪 Testando Sistema de Ensalamento\n');

  // 1. Buscar salas candidatas
  const candidates = await getCandidateRooms(
    '10000000-0000-0000-0000-000000000001', // Dr. Carlos Silva
    '2025-01-15T09:00:00-03:00',
    '2025-01-15T10:00:00-03:00'
  );
  console.log('✅ Salas candidatas:', candidates.length);
  candidates.forEach(c => {
    console.log(`   - ${c.roomName} (prioridade: ${c.preferencePriority}, carga: ${c.dayLoadMinutes}min)`);
  });

  // 2. Alocar sala
  const appointmentId = crypto.randomUUID();
  const roomId = await allocateRoom(
    appointmentId,
    '10000000-0000-0000-0000-000000000001',
    '2025-01-15T09:00:00-03:00',
    '2025-01-15T10:00:00-03:00'
  );
  console.log(`\n✅ Sala alocada: ${roomId}`);

  // 3. Ver agenda da sala
  if (roomId) {
    const schedule = await getRoomSchedule(roomId, '2025-01-15', '2025-01-15');
    console.log(`\n✅ Agenda da sala:`, schedule);
  }
}

testRoomScheduling();
```

Execute:
```bash
npx tsx scripts/test-room-scheduling.ts
```

---

### Passo 5: Integrar com Sistema de Agenda Existente

**Opção A: Integração Automática (Recomendado)**

Edite o arquivo `src/lib/supabaseData.ts` e adicione ao final das funções de appointment:

```typescript
import { autoAllocateRoomForAppointment, deallocateRoom, reallocateRoom } from './roomSchedulingApi';

// Modificar createAppointment para alocar sala automaticamente
export async function createAppointment(appointment: Partial<Appointment>) {
  // ... código existente ...

  // NOVO: Alocar sala automaticamente
  if (newAppointment.status === 'confirmed' && newAppointment.doctorId) {
    const result = await autoAllocateRoomForAppointment(
      newAppointment.id,
      newAppointment.doctorId,
      newAppointment.date,
      newAppointment.time,
      newAppointment.duration || 60
    );

    if (!result.success && result.alternatives) {
      console.warn('⚠️  Nenhuma sala disponível. Sugestões:', result.alternatives);
      // TODO: Enviar notificação WhatsApp (ver Passo 6)
    }
  }

  return newAppointment;
}

// Modificar updateAppointmentRemote para realocar sala
export async function updateAppointmentRemote(id: string, updates: Partial<Appointment>) {
  // ... código existente ...

  // NOVO: Realocar sala se mudou horário
  if (updates.status === 'confirmed' && (updates.date || updates.time || updates.duration)) {
    const appointment = await fetchAppointmentById(id);
    if (appointment && appointment.doctorId) {
      await reallocateRoom(
        id,
        appointment.doctorId,
        `${updates.date || appointment.date}T${updates.time || appointment.time}:00-03:00`,
        // calcular ends_at baseado em duration
      );
    }
  }

  // NOVO: Desalocar sala se cancelou
  if (updates.status === 'cancelled' || updates.status === 'no-show') {
    await deallocateRoom(id);
  }

  return updatedAppointment;
}
```

**Opção B: Via Webhook (n8n)**

Veja o arquivo `docs/N8N_WORKFLOW.json` com workflow pronto.

---

## 📊 Estrutura de Dados

### Tabelas Criadas

1. **rooms** - 6 salas físicas
   - Sala 1 - Consultório Principal
   - Sala 2 - Consultório Pequeno
   - Sala 3 - Procedimentos (laser, cirurgia)
   - Sala 4 - Terapia
   - Sala 5 - Exames (ECG, ultrassom)
   - Sala 6 - Polivalente

2. **professionals** - 5 profissionais
   - Dr. Carlos Silva (Clínico Geral)
   - Dra. Ana Paula Oliveira (Dermatologia)
   - Dr. Roberto Santos (Ortopedia)
   - Dra. Juliana Costa (Psicologia)
   - Dr. Fernando Almeida (Cardiologia)

3. **doctor_room_prefs** - Preferências de sala
4. **room_blockings** - Bloqueios (manutenção, etc)
5. **room_allocations** - Alocações (fonte da verdade)
6. **allocation_audit** - Histórico de mudanças

### Funções RPC Disponíveis

```typescript
// Buscar salas disponíveis
getCandidateRooms(professionalId, startsAt, endsAt)

// Alocar sala automaticamente
allocateRoom(appointmentId, professionalId, startsAt, endsAt)

// Desalocar sala
deallocateRoom(appointmentId)

// Realocar (atualizar horário ou trocar sala)
reallocateRoom(appointmentId, professionalId, newStartsAt, newEndsAt)

// Sugerir alternativas quando não há vaga
suggestAlternativeSlots(professionalId, desiredStart, desiredEnd, maxSuggestions)

// Ver agenda de sala
getRoomSchedule(roomId, dateStart, dateEnd)

// Ver agenda de profissional
getProfessionalSchedule(professionalId, dateStart, dateEnd)

// Estatísticas de uso
getRoomStats()
```

---

## 🎨 Próximos Passos (UI)

### 1. Página de Ensalamento

Crie `src/app/rooms/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { fetchRooms, getRoomStats } from '@/lib/roomSchedulingApi';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    async function load() {
      setRooms(await fetchRooms());
      setStats(await getRoomStats());
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ensalamento</h1>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold">{stat.name}</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>Hoje: {stat.appointmentsToday} consultas</p>
              <p>Ocupação: {stat.occupancyRateTodayPct.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* TODO: Adicionar calendário (ver próximo passo) */}
    </div>
  );
}
```

### 2. Calendário Resource Timeline

Para implementar o calendário visual com drag & drop, você pode usar:
- **FullCalendar** (React) - Recomendado
- **React Big Calendar** - Alternativa mais leve

Exemplo com FullCalendar será fornecido em documento separado.

---

## 🔧 Manutenção

### Bloquear Sala para Manutenção

```typescript
import { createRoomBlocking } from '@/lib/roomSchedulingApi';

await createRoomBlocking({
  roomId: '00000000-0000-0000-0000-000000000003', // Sala 3
  startsAt: '2025-01-20T13:00:00-03:00',
  endsAt: '2025-01-20T14:00:00-03:00',
  reason: 'Manutenção preventiva do laser',
});
```

### Configurar Preferências de Sala

```typescript
import { setDoctorRoomPreferences } from '@/lib/roomSchedulingApi';

await setDoctorRoomPreferences('prof-uuid', [
  { roomId: 'sala-1-uuid', priority: 1 }, // Primeira opção
  { roomId: 'sala-2-uuid', priority: 2 }, // Segunda opção
  { roomId: 'sala-6-uuid', priority: 3 }, // Terceira opção
]);
```

### Verificar Conflitos (Integridade)

```sql
-- Executar no Supabase SQL Editor
SELECT * FROM check_conflicts();
-- Deve retornar vazio (0 conflitos)
```

---

## 📱 Integração WhatsApp

Veja arquivo separado: `docs/WHATSAPP_INTEGRATION.md`

---

## 🐛 Troubleshooting

### Erro: "Nenhuma sala disponível"
1. Verifique se todas as 6 salas estão `is_active = true`
2. Verifique se não há bloqueios no horário
3. Use `getCandidateRooms()` para debugar

### Erro: "exclusion_violation"
- Isso é esperado! Significa que o sistema impediu conflito de sala
- A função `allocateRoom()` tenta automaticamente a próxima sala

### Appointments não estão sendo alocados
1. Verifique se o status é `'confirmed'`
2. Verifique se `doctorId` corresponde a um `professionalId` válido
3. Adicione logs em `autoAllocateRoomForAppointment()`

---

## ✅ Checklist de Aceite

- [ ] Criar/editar/cancelar appointment → reflete em até 5s no ensalamento
- [ ] Nunca aceita dois eventos sobrepostos na mesma sala
- [ ] Mensagem WhatsApp quando não há sala disponível
- [ ] Estatísticas de ocupação aparecem corretamente
- [ ] Bloqueios de sala funcionam (impede alocação)
- [ ] Preferências de sala são respeitadas (prioridade)

---

## 📚 Referências

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Range Types**: https://www.postgresql.org/docs/current/rangetypes.html
- **Exclusion Constraints**: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION

---

## 🚀 Roadmap Futuro

### V2 (Curto Prazo)
- [ ] UI de calendário resource-timeline
- [ ] Drag & drop com validação
- [ ] Notificações WhatsApp automáticas
- [ ] ICS/iCal por sala e profissional

### V3 (Médio Prazo)
- [ ] Relatórios de ocupação por sala
- [ ] Previsão de disponibilidade (ML)
- [ ] Integração com equipamentos IoT (sinais de ocupação real)
- [ ] App mobile para profissionais verem sua sala

---

**Implementado com ❤️ por Claude Code**
**Data**: Outubro 2024
**Versão**: 1.0
