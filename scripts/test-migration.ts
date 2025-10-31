// Script para testar a migração do banco
// Execute com: npx ts-node scripts/test-migration.ts

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (substitua pelas suas chaves)
const supabaseUrl = 'https://ogbhjwcssthpktirygmt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Supabase key não configurada. Configure SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log('🧪 Testando migração do banco de dados...\n');

  try {
    // Teste 1: Verificar se as tabelas existem
    console.log('1️⃣ Verificando tabelas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      throw new Error(`Erro ao verificar tabelas: ${tablesError.message}`);
    }

    const expectedTables = ['patients', 'appointments', 'financial_entries', 'waitlist', 'professionals', 'team_members', 'companies'];
    const existingTables = tables?.map(t => t.table_name) || [];

    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ Tabela ${table} existe`);
      } else {
        console.log(`   ❌ Tabela ${table} NÃO existe`);
      }
    }

    // Teste 2: Criar um paciente de teste
    console.log('\n2️⃣ Testando criação de paciente...');
    const testPatient = {
      name: 'Paciente Teste',
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      birth_date: '1990-01-01',
      address: {
        street: 'Rua Teste',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      medical_history: 'Histórico médico de teste',
      allergies: 'Nenhuma alergia conhecida',
      medications: 'Paracetamol 500mg',
      emergency_contact: {
        name: 'João Silva',
        phone: '(11) 88888-8888',
        relationship: 'Pai'
      }
    };

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert(testPatient)
      .select()
      .single();

    if (patientError) {
      throw new Error(`Erro ao criar paciente: ${patientError.message}`);
    }

    console.log('   ✅ Paciente criado com sucesso:', patient.name);

    // Teste 3: Criar uma consulta de teste
    console.log('\n3️⃣ Testando criação de consulta...');
    const testAppointment = {
      patient_id: patient.id,
      doctor_name: 'Dr. Teste',
      date: '2024-01-15',
      time: '14:00:00',
      type: 'consultation',
      status: 'scheduled',
      price: 150.00,
      paid: false
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select()
      .single();

    if (appointmentError) {
      throw new Error(`Erro ao criar consulta: ${appointmentError.message}`);
    }

    console.log('   ✅ Consulta criada com sucesso para:', appointment.date);

    // Teste 4: Criar lançamento financeiro
    console.log('\n4️⃣ Testando criação de lançamento financeiro...');
    const testFinancialEntry = {
      type: 'income',
      category: 'Consulta',
      description: 'Consulta Dr. Teste',
      amount: 150.00,
      date: '2024-01-15',
      payment_method: 'card',
      appointment_id: appointment.id
    };

    const { data: financial, error: financialError } = await supabase
      .from('financial_entries')
      .insert(testFinancialEntry)
      .select()
      .single();

    if (financialError) {
      throw new Error(`Erro ao criar lançamento financeiro: ${financialError.message}`);
    }

    console.log('   ✅ Lançamento financeiro criado:', financial.description);

    // Limpeza: Remover dados de teste
    console.log('\n5️⃣ Limpando dados de teste...');

    await supabase.from('financial_entries').delete().eq('id', financial.id);
    await supabase.from('appointments').delete().eq('id', appointment.id);
    await supabase.from('patients').delete().eq('id', patient.id);

    console.log('   ✅ Dados de teste removidos');

    console.log('\n🎉 Migração testada com sucesso! Todos os testes passaram.');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

// Executar os testes
if (require.main === module) {
  testMigration();
}

export { testMigration };