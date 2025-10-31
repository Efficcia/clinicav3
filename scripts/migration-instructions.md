# Instruções para Migração do Banco Supabase

## Passo 1: Execute a Migração SQL

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Selecione seu projeto: `ogbhjwcssthpktirygmt`
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `scripts/supabase-migration.sql`
6. Cole no editor SQL
7. Clique em **Run** para executar a migração

⚠️ **IMPORTANTE**: Este script irá:
- Deletar todas as tabelas existentes e seus dados
- Recriar as tabelas com a estrutura correta
- Configurar RLS básico
- Inserir dados de exemplo

## Passo 2: Configure as Variáveis de Ambiente

1. Copie o arquivo `.env.local.example` para `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. No Supabase Dashboard, vá em **Settings > API**

3. Copie as chaves e atualize o arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ogbhjwcssthpktirygmt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

## Passo 3: Teste a Conexão

Após executar a migração e configurar as variáveis:

1. Execute o projeto:
   ```bash
   npm run dev
   ```

2. Teste criar um paciente com todos os campos
3. Verifique se os dados são salvos corretamente no Supabase

## Estrutura das Tabelas Criadas

- **patients**: Todos os campos do frontend (name, email, cpf, address, medicalHistory, etc.)
- **appointments**: Consultas completas com preços e status de pagamento
- **financial_entries**: Lançamentos financeiros com categorias e recorrência
- **waitlist**: Lista de espera
- **professionals**: Médicos e profissionais
- **team_members**: Equipe administrativa
- **companies**: Dados da clínica

## Verificação de Sucesso

Se tudo funcionou corretamente, você deve ver:
- ✅ Todas as tabelas criadas no Supabase
- ✅ Frontend conectando sem erros
- ✅ Possibilidade de criar pacientes com todos os campos
- ✅ Dados sendo salvos corretamente