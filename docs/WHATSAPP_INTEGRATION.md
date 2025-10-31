# Integração WhatsApp - Sistema de Ensalamento

## 📱 Visão Geral

O sistema de ensalamento envia notificações automáticas via WhatsApp quando:
- ❌ Não há sala disponível (conflito)
- 🔄 Sala é trocada (realocação)
- 🔧 Sala é bloqueada para manutenção
- 📊 Relatório diário de ocupação (opcional)

## 🔧 Configuração

### Passo 1: Instalar Evolution API

A Evolution API é a ponte entre o sistema e o WhatsApp.

**Opção A: Docker (Recomendado)**

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA_AQUI \
  atendai/evolution-api:latest
```

**Opção B: Cloud (Hostoo, Render, Railway, etc)**

Veja: https://doc.evolution-api.com/pt/get-started/installation

### Passo 2: Criar Instância WhatsApp

1. Acesse: `http://localhost:8080/manager` (ou sua URL cloud)
2. Clique em "Create Instance"
3. Nome da instância: `clinictech`
4. Copie o **QR Code** e escaneie com WhatsApp
5. Aguarde conexão

### Passo 3: Obter ID do Grupo

Execute no navegador ou Postman:

```bash
GET http://localhost:8080/group/fetchAllGroups/clinictech
Headers:
  apikey: SUA_CHAVE_SECRETA_AQUI
```

Procure pelo nome do grupo (ex: "Gestão Clínica") e copie o `id` (ex: `120363123456789012@g.us`).

### Passo 4: Configurar Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# Evolution API - WhatsApp
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=SUA_CHAVE_SECRETA_AQUI
EVOLUTION_INSTANCE=clinictech
WHATSAPP_GROUP_ID=120363123456789012@g.us
```

**Importante**: Para produção, use HTTPS!

### Passo 5: Testar Integração

Crie um arquivo `scripts/test-whatsapp.ts`:

```typescript
import { notifyRoomConflict } from '@/lib/whatsappNotifications';

async function testWhatsApp() {
  console.log('🧪 Testando notificação WhatsApp...');

  const result = await notifyRoomConflict({
    professionalName: 'Dr. Carlos Silva',
    patientName: 'João da Silva',
    startsAt: '2025-01-15T09:00:00-03:00',
    endsAt: '2025-01-15T10:00:00-03:00',
    procedure: 'Consulta',
    alternatives: [
      {
        roomId: '1',
        roomName: 'Sala 2 - Consultório Pequeno',
        suggestedStarts: '2025-01-15T09:30:00-03:00',
        suggestedEnds: '2025-01-15T10:30:00-03:00',
        offsetMinutes: 30,
      },
      {
        roomId: '2',
        roomName: 'Sala 6 - Polivalente',
        suggestedStarts: '2025-01-15T10:00:00-03:00',
        suggestedEnds: '2025-01-15T11:00:00-03:00',
        offsetMinutes: 60,
      },
    ],
  });

  console.log(result ? '✅ Mensagem enviada!' : '❌ Erro ao enviar');
}

testWhatsApp();
```

Execute:
```bash
npx tsx scripts/test-whatsapp.ts
```

Você deve receber uma mensagem no grupo WhatsApp!

---

## 📝 Uso nas Funções de Appointment

### Integrar no Sistema de Agenda

Edite `src/lib/supabaseData.ts` ou onde você gerencia appointments:

```typescript
import {
  notifyRoomConflict,
  notifyRoomAllocated,
  notifyRoomChanged,
  notifyRoomDeallocated
} from './whatsappNotifications';
import { autoAllocateRoomForAppointment, getAllocationByAppointment } from './roomSchedulingApi';

// AO CRIAR APPOINTMENT
export async function createAppointment(appointment: Partial<Appointment>) {
  // ... código existente de criação ...

  // Alocar sala automaticamente
  if (appointment.status === 'confirmed' && appointment.doctorId) {
    const result = await autoAllocateRoomForAppointment(
      newAppointment.id,
      appointment.doctorId,
      appointment.date,
      appointment.time,
      appointment.duration || 60
    );

    if (result.success && result.roomName) {
      // Sucesso: sala alocada
      await notifyRoomAllocated({
        professionalName: appointment.doctorName,
        patientName: patientName, // buscar do patient
        roomName: result.roomName,
        startsAt: `${appointment.date}T${appointment.time}:00-03:00`,
        endsAt: calculateEndTime(appointment.date, appointment.time, appointment.duration),
        procedure: appointment.type,
      });
    } else if (!result.success && result.alternatives) {
      // Conflito: nenhuma sala disponível
      await notifyRoomConflict({
        professionalName: appointment.doctorName,
        patientName: patientName,
        startsAt: `${appointment.date}T${appointment.time}:00-03:00`,
        endsAt: calculateEndTime(appointment.date, appointment.time, appointment.duration),
        procedure: appointment.type,
        alternatives: result.alternatives,
      });
    }
  }

  return newAppointment;
}

// AO CANCELAR APPOINTMENT
export async function cancelAppointment(appointmentId: string) {
  const appointment = await fetchAppointmentById(appointmentId);
  const allocation = await getAllocationByAppointment(appointmentId);

  if (appointment && allocation) {
    await notifyRoomDeallocated({
      professionalName: appointment.doctorName,
      patientName: appointment.patientName,
      roomName: allocation.roomName,
      startsAt: allocation.startsAt,
      reason: 'cancelled',
    });
  }

  // ... código existente de cancelamento ...
}

// Helper
function calculateEndTime(date: string, time: string, durationMinutes: number): string {
  const start = new Date(`${date}T${time}:00-03:00`);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end.toISOString();
}
```

---

## 🎨 Personalizar Mensagens

### Exemplo: Adicionar Logo ou Emoji Customizado

Edite `src/lib/whatsappNotifications.ts`:

```typescript
// No início de cada função, altere o emoji/header
let message = `🏥 *CLÍNICA XYZ - ENSALAMENTO*\n\n`;
```

### Exemplo: Adicionar Link para Painel

```typescript
message += `\n🔗 Ver painel: https://clinica.com/rooms\n`;
```

### Exemplo: Mencionar Pessoa Responsável

```typescript
message += `\n@5511999999999 Por favor, verificar.\n`;
```

---

## 📊 Relatório Diário Automático

### Configurar Cron Job (n8n)

1. No n8n, crie novo workflow
2. Adicione trigger "Cron" para executar todos os dias às 18h
3. Adicione node HTTP Request:

```json
{
  "method": "POST",
  "url": "https://sua-api.com/api/send-daily-report",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

4. Crie endpoint `src/app/api/send-daily-report/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getRoomStats } from '@/lib/roomSchedulingApi';
import { sendDailyRoomReport } from '@/lib/whatsappNotifications';

export async function POST() {
  try {
    const stats = await getRoomStats();

    await sendDailyRoomReport({
      date: new Date().toISOString(),
      rooms: stats.map(s => ({
        name: s.name,
        appointmentsCount: s.appointmentsToday,
        minutesUsed: s.minutesUsedToday,
        occupancyPct: s.occupancyRateTodayPct,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar relatório:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
```

---

## 🔒 Segurança

### Proteger API Keys

**Nunca** commite as keys no Git:

```bash
# .gitignore (já configurado)
.env.local
```

### Usar HTTPS em Produção

```bash
# .env.production
EVOLUTION_API_URL=https://api.evolution.com  # HTTPS!
```

### Validar Origem das Mensagens

Se expuser endpoint público, valide header:

```typescript
// Em src/app/api/webhook/route.ts
export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');

  if (apiKey !== process.env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ... processar webhook ...
}
```

---

## 🐛 Troubleshooting

### Mensagem não chega no grupo

1. Verifique se `WHATSAPP_GROUP_ID` está correto:
```bash
curl -X GET http://localhost:8080/group/fetchAllGroups/clinictech \
  -H "apikey: SUA_CHAVE"
```

2. Verifique se instância está conectada:
```bash
curl -X GET http://localhost:8080/instance/connectionState/clinictech \
  -H "apikey: SUA_CHAVE"
```

### Erro "Instance not found"

- Recrie a instância no Evolution Manager
- Verifique se nome em `EVOLUTION_INSTANCE` está correto

### Erro "apikey invalid"

- Verifique se `EVOLUTION_API_KEY` corresponde ao configurado no Docker

### QR Code não aparece

- Acesse `http://localhost:8080/instance/qrcode/clinictech` diretamente
- Use Evolution Manager UI

---

## 📚 Referências

- **Evolution API Docs**: https://doc.evolution-api.com
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Baileys (lib usada)**: https://github.com/WhiskeySockets/Baileys

---

## 🚀 Recursos Avançados (Futuro)

- [ ] Botões interativos (aceitar/rejeitar sugestões)
- [ ] Confirmar agendamento via WhatsApp
- [ ] Chatbot para consultar disponibilidade
- [ ] Integração com Google Calendar (ICS)
- [ ] Notificações push para app mobile

---

**Pronto! Seu sistema de ensalamento agora notifica via WhatsApp automaticamente.**
