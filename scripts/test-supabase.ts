import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carrega .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '(configurada)' : '(não configurada)');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  'patients',
  'appointments',
  'financial_entries',
  'waitlist',
  'professionals',
  'team_members',
  'companies'
];

async function testTable(tableName: string) {
  console.log(`\n📋 Testando tabela: ${tableName}`);

  const startTime = Date.now();

  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: false })
      .limit(5);

    const duration = Date.now() - startTime;

    if (error) {
      console.error(`  ❌ ERRO: ${error.message}`);
      console.error(`  📝 Detalhes:`, error);

      if (error.message.includes('permission denied') || error.message.includes('policy')) {
        console.error(`  🔒 Problema de RLS (Row Level Security)`);
      } else if (error.message.includes('does not exist')) {
        console.error(`  📭 Tabela não existe no banco`);
      }

      return false;
    }

    console.log(`  ✅ Sucesso! (${duration}ms)`);
    console.log(`  📊 Registros: ${count || 0}`);

    if (data && data.length > 0) {
      console.log(`  📄 Exemplo:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
    }

    return true;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`  ❌ EXCEÇÃO após ${duration}ms:`, err);
    return false;
  }
}

async function checkAuth() {
  console.log('\n👤 Verificando autenticação...');

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('  ❌ Erro ao verificar sessão:', error.message);
      return;
    }

    if (session) {
      console.log('  ✅ Usuário logado:', session.user.email);
      console.log('  🆔 User ID:', session.user.id);
    } else {
      console.log('  ⚠️  Nenhum usuário logado');
      console.log('  ℹ️  Testando com ANON key (sem autenticação)');
    }
  } catch (err) {
    console.error('  ❌ Erro ao verificar autenticação:', err);
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO DO SUPABASE');
  console.log('═══════════════════════════════════════');

  await checkAuth();

  console.log('\n📚 Testando acesso às tabelas...\n');

  const results = await Promise.all(
    tables.map(table => testTable(table))
  );

  console.log('\n═══════════════════════════════════════');
  console.log('📊 RESUMO:');
  console.log('═══════════════════════════════════════');

  const successCount = results.filter(r => r).length;
  const failCount = results.filter(r => !r).length;

  console.log(`✅ Tabelas OK: ${successCount}/${tables.length}`);
  console.log(`❌ Tabelas com erro: ${failCount}/${tables.length}`);

  if (failCount > 0) {
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Tabelas não existem → Execute scripts/setupSupabase.ts');
    console.log('2. RLS bloqueando → Desative RLS ou crie políticas');
    console.log('3. Permissões → Verifique configurações no Supabase Dashboard');
  } else {
    console.log('\n✅ Tudo funcionando! O problema pode ser de timeout/rede.');
  }

  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
