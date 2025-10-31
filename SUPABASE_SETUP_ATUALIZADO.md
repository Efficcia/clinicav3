# 🚀 Configuração do Supabase - Clinic[IA]

## ✅ Credenciais Configuradas

Seu projeto está conectado ao Supabase:

```
🔗 URL: https://vdjzluhnwcfonqxctpce.supabase.co
🔑 Project: vdjzluhnwcfonqxctpce
```

---

## 📋 PASSO A PASSO COMPLETO

### **1. Executar o Script SQL no Supabase**

#### **Via Dashboard (Recomendado):**

1. **Acesse:** https://supabase.com/dashboard/project/vdjzluhnwcfonqxctpce

2. **Menu lateral esquerdo:**
   - Clique em **SQL Editor** (ícone de código)

3. **Criar nova query:**
   - Clique no botão **+ New Query**

4. **Copiar o script:**
   - Abra o arquivo: `scripts/fix-rls-policies.sql`
   - Selecione **TODO** o conteúdo (Cmd/Ctrl + A)
   - Copie (Cmd/Ctrl + C)

5. **Colar e executar:**
   - Cole no editor SQL
   - Clique em **RUN** (ou Cmd/Ctrl + Enter)
   - Aguarde a mensagem de sucesso ✅

**Tempo estimado:** 30 segundos

---

### **2. Verificar se Funcionou**

Ainda no **SQL Editor**, execute:

```sql
-- Verificar se user_id foi adicionado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients'
  AND column_name = 'user_id';

-- Deve retornar: user_id | uuid
```

Se retornar resultado, deu certo! ✅

---

### **3. Ativar Email Authentication**

1. **Menu lateral:** **Authentication** → **Providers**

2. **Email Provider:**
   - ✅ **Ative** Email
   - ⚙️ Clique em **Configurações**

3. **Configurações importantes:**
   - **Enable Email Signup:** ✅ Ativado
   - **Confirm Email:** ❌ **Desative** (para testes)
     - _Nota: Em produção, ative e configure SMTP_
   - **Secure Email Change:** ✅ Ativado

4. **Salvar alterações**

---

### **4. Criar Primeiro Usuário**

Escolha um dos métodos:

#### **Método A: Via Dashboard (Mais Fácil)**

1. **Menu:** **Authentication** → **Users**

2. **Botão:** **Add User** → **Create new user**

3. **Preencha:**
   ```
   Email: admin@clinicia.com
   Password: SuaSenhaSegura123!

   ✅ Marque: "Auto Confirm User"
   ```

4. **Create user**

#### **Método B: Via SQL**

No **SQL Editor**, execute:

```sql
-- Criar usuário admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@clinicia.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name": "Administrador", "role": "admin"}'::jsonb,
  now(),
  now(),
  '',
  ''
);
```

**Credenciais criadas:**
- 📧 Email: `admin@clinicia.com`
- 🔑 Senha: `senha123`

---

### **5. Instalar Dependências e Iniciar**

```bash
# Navegar para o projeto
cd "/Users/macos/Downloads/clinicia-project (1)"

# Instalar dependências (se ainda não instalou)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

**Aguarde a mensagem:**
```
✔ Ready in 2.5s
○ Local: http://localhost:3000
```

---

### **6. Testar o Login**

1. **Abra no navegador:**
   ```
   http://localhost:3000/login
   ```

2. **Faça login:**
   ```
   📧 Email: admin@clinicia.com
   🔑 Senha: senha123
   ```

3. **Verificar no console do navegador (F12):**
   ```
   ✅ Deve ver: "Auth state changed: SIGNED_IN"
   ✅ Deve ver: "Usuário autenticado via Supabase"
   ```

---

### **7. Testar CRUD de Pacientes**

1. **No menu lateral:** Clique em **Pacientes**

2. **Criar paciente:**
   - Clique **+ Novo Paciente**
   - Preencha o nome (obrigatório)
   - **Salvar**

3. **Verificar no Supabase:**
   - Dashboard → **Table Editor** → **patients**
   - ✅ Deve aparecer o paciente
   - ✅ Coluna `user_id` deve estar preenchida

4. **Editar e excluir:**
   - Teste editar o paciente
   - Teste excluir
   - Tudo deve funcionar sem erros de RLS!

---

## 🔍 VERIFICAÇÃO DE FUNCIONAMENTO

### **Checklist Rápido:**

Execute no **SQL Editor** do Supabase:

```sql
-- 1. Verificar colunas user_id
SELECT
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name = 'user_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- Deve mostrar: patients, appointments, financial_entries, etc.
```

```sql
-- 2. Verificar RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('patients', 'appointments', 'financial_entries')
ORDER BY tablename, policyname;

-- Deve mostrar: "Users can view own patients", etc.
```

```sql
-- 3. Contar usuários
SELECT count(*) as total_users
FROM auth.users;

-- Deve retornar: 1 ou mais
```

Se todos retornarem resultados, **está tudo funcionando!** ✅

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **Erro: "Invalid API key"**

**Causa:** Formato das credenciais pode estar incorreto

**Solução:** Obter as credenciais JWT corretas:

1. Dashboard do Supabase → **Settings** → **API**
2. Copie:
   - **Project URL**
   - **anon public** (JWT longo, começa com `eyJ...`)
   - **service_role** (JWT longo, começa com `eyJ...`)

3. Atualize `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://vdjzluhnwcfonqxctpce.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
   ```

4. Reinicie o servidor: `npm run dev`

---

### **Erro: "new row violates row-level security policy"**

**Causa:** Script SQL não foi executado completamente

**Solução:**

1. Desative RLS temporariamente:
   ```sql
   -- No SQL Editor
   ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.financial_entries DISABLE ROW LEVEL SECURITY;
   ```

2. Execute o script `fix-rls-policies.sql` novamente

3. Reative RLS:
   ```sql
   ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
   ```

---

### **Erro: "Failed to fetch"**

**Causa:** Servidor não está rodando ou URL incorreta

**Solução:**

1. Verifique se o servidor está rodando:
   ```bash
   npm run dev
   ```

2. Verifique no console se há erros de CORS

3. Teste a URL do Supabase:
   ```bash
   curl https://vdjzluhnwcfonqxctpce.supabase.co/rest/v1/
   ```

---

### **Sistema está usando localStorage ao invés de Supabase**

**Causa:** `.env.local` não está sendo lido

**Solução:**

```bash
# Parar o servidor (Ctrl+C)

# Verificar se .env.local existe
cat .env.local

# Reiniciar
npm run dev

# Verificar no console do navegador:
# F12 → Console → Digite:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
# Deve mostrar a URL, não undefined
```

---

## 📊 ESTRUTURA DO BANCO

Após executar o script, você terá:

```
📦 Supabase Database
├── 🔐 auth.users (gerenciado pelo Supabase)
├── 👤 public.user_profiles
├── 🏥 public.patients (+ user_id)
├── 📅 public.appointments (+ user_id)
├── 💰 public.financial_entries (+ user_id)
├── 👨‍⚕️ public.professionals (+ user_id)
├── 👥 public.team_members (+ user_id)
├── 🚪 public.rooms (+ user_id)
└── 🏢 public.companies (+ user_id)
```

**Todas** as tabelas agora têm:
- ✅ Coluna `user_id` (UUID)
- ✅ RLS Policies (cada usuário só vê seus dados)
- ✅ Triggers (auto-set user_id)
- ✅ Índices (performance)

---

## 🎯 PRÓXIMOS PASSOS

Depois de tudo funcionando:

1. **Configurar SMTP** (emails reais)
   - Dashboard → **Authentication** → **Email Templates**
   - Configurar servidor SMTP

2. **Habilitar confirmação de email**
   - Para segurança em produção

3. **Criar mais usuários**
   - Testar multi-tenancy

4. **Deploy em produção**
   - Vercel + Supabase

---

## 📞 SUPORTE

**Problemas? Verifique:**

1. Console do navegador (F12) - erros em vermelho
2. Terminal do Next.js - erros do servidor
3. Supabase Dashboard → **Logs** - erros do banco

**Dúvidas comuns:**

- ❓ "Login não funciona" → Verificar se usuário foi criado
- ❓ "Dados não salvam" → Verificar RLS policies
- ❓ "Erro de permissão" → Verificar user_id nas tabelas

---

## ✅ CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Script SQL executado com sucesso
- [ ] Email Auth ativado no Supabase
- [ ] Pelo menos 1 usuário criado
- [ ] Login funcionando (ver mensagem no console)
- [ ] CRUD de pacientes funcionando
- [ ] Dados persistem no Supabase (verificar Table Editor)
- [ ] Sem erros de RLS no console
- [ ] user_id preenchido automaticamente

---

## 🎉 PRONTO!

Seu sistema agora está 100% integrado com Supabase!

**Credenciais de teste:**
```
📧 Email: admin@clinicia.com
🔑 Senha: senha123
```

**Tempo total de configuração:** ~15 minutos

---

**Desenvolvido com ❤️ por Claude Code**
**Data: 30 de Outubro de 2025**
