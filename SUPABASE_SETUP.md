# 🚀 Guia Completo de Configuração do Supabase

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Passo a Passo](#passo-a-passo)
3. [Executar o Script SQL](#executar-o-script-sql)
4. [Testar a Integração](#testar-a-integração)
5. [Solução de Problemas](#solução-de-problemas)

---

## ✅ Pré-requisitos

- ✅ Projeto Supabase criado (https://supabase.com)
- ✅ Credenciais já configuradas no `.env.local`
- ✅ Node.js e npm instalados

---

## 🔧 Passo a Passo

### 1. **Instalar Dependências**

```bash
cd "/Users/macos/Downloads/clinicia-project (1)"
npm install
```

### 2. **Verificar Variáveis de Ambiente**

Confirme que o arquivo `.env.local` existe e contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ogbhjwcssthpktirygmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

⚠️ **IMPORTANTE:** REMOVA a linha `SUPABASE_SERVICE_ROLE_KEY` do `.env.local` (não deve estar no frontend!)

### 3. **Executar o Script SQL**

#### **Opção A: Via Painel do Supabase (Recomendado)**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **ogbhjwcssthpktirygmt**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **+ New Query**
5. Copie TODO o conteúdo do arquivo: `scripts/fix-rls-policies.sql`
6. Cole no editor
7. Clique em **RUN** (Ctrl/Cmd + Enter)

#### **Opção B: Via CLI do Supabase**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref ogbhjwcssthpktirygmt

# Executar o script
supabase db push --file scripts/fix-rls-policies.sql
```

### 4. **Ativar Email Auth no Supabase**

1. No painel do Supabase, vá em: **Authentication** > **Providers**
2. Ative **Email**
3. **Desative** "Confirm email" (ou configure SMTP para emails reais)
4. Salve as alterações

### 5. **Criar Primeiro Usuário**

#### **Via Painel (Mais Fácil):**

1. Vá em: **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - Email: `admin@clinicia.com`
   - Password: `senha_segura_aqui`
   - Auto Confirm User: ✅ **Marcado**
4. Clique em **Create user**

#### **Via SQL Editor:**

```sql
-- Inserir usuário de teste
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin@clinicia.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  '{"name": "Administrador", "role": "admin"}'::jsonb,
  now(),
  now()
);
```

---

## 🧪 Testar a Integração

### 1. **Iniciar o Projeto**

```bash
npm run dev
```

### 2. **Acessar o Login**

```
http://localhost:3000/login
```

### 3. **Fazer Login**

- **Email:** `admin@clinicia.com`
- **Senha:** `senha123` (ou a que você criou)

### 4. **Testar CRUD**

1. Criar um paciente
2. Editar o paciente
3. Excluir o paciente
4. Verificar se os dados persistem após logout/login

---

## 🔍 Verificar se Está Funcionando

### **Console do Navegador (F12)**

Após fazer login, você deve ver:

```
Auth state changed: SIGNED_IN
✅ Usuário autenticado via Supabase
```

Se ver erros de RLS, algo deu errado na execução do SQL.

### **Verificar no Supabase**

1. Vá em: **Table Editor** > **patients**
2. Após criar um paciente, verifique se:
   - ✅ Registro aparece na tabela
   - ✅ Coluna `user_id` está preenchida
   - ✅ Valor do `user_id` é um UUID válido

---

## ❌ Solução de Problemas

### **Erro: "new row violates row-level security policy"**

**Causa:** RLS policies não foram atualizadas

**Solução:**
```sql
-- Verificar se as policies existem
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'patients';

-- Se não aparecer policies com "Users can", execute o script fix-rls-policies.sql novamente
```

### **Erro: "column user_id does not exist"**

**Causa:** Script SQL não foi executado

**Solução:** Execute o `scripts/fix-rls-policies.sql` completamente

### **Erro: "Invalid login credentials"**

**Causa:** Usuário não existe ou senha errada

**Solução:**
1. Vá em **Authentication** > **Users**
2. Verifique se o usuário existe
3. Se necessário, crie novamente ou resete a senha

### **Sistema está usando localStorage ao invés de Supabase**

**Causa:** `.env.local` não está sendo lido

**Solução:**
```bash
# Reiniciar o servidor
npm run dev

# Verificar no console do navegador:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Deve mostrar a URL, não undefined
```

---

## 🎯 Checklist Final

Antes de considerar a configuração concluída, verifique:

- [ ] Script `fix-rls-policies.sql` executado com sucesso
- [ ] Todas as tabelas têm coluna `user_id`
- [ ] RLS policies criadas (verificar com `SELECT * FROM pg_policies`)
- [ ] Email Auth ativado no Supabase
- [ ] Pelo menos 1 usuário criado
- [ ] Login funcionando
- [ ] CRUD de pacientes funcionando
- [ ] Dados persistem entre sessões
- [ ] Console sem erros de RLS

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `scripts/fix-rls-policies.sql` | Script de correção do RLS |
| `src/hooks/useAuth.ts` | Hook de autenticação (auto-detecta Supabase) |
| `src/hooks/useSupabaseAuth.ts` | Implementação real do Supabase Auth |
| `.env.local` | Variáveis de ambiente (não commitar!) |

---

## 🆘 Ainda com Problemas?

### **Modo Fallback (localStorage)**

Se quiser testar o sistema enquanto configura o Supabase:

```bash
# Renomear .env.local temporariamente
mv .env.local .env.local.backup

# Reiniciar servidor
npm run dev
```

O sistema vai usar localStorage automaticamente.

### **Logs de Debug**

Adicione no console do navegador:

```javascript
// Ver se Supabase está ativo
console.log('Supabase:', !!supabaseClient)

// Ver usuário atual
supabaseClient.auth.getUser().then(console.log)
```

---

## 🎉 Pronto!

Agora seu sistema está 100% integrado com Supabase Auth e RLS funcionando corretamente!

**Próximos Passos:**
- Configure SMTP para emails reais (recuperação de senha)
- Implemente 2FA (Two-Factor Authentication)
- Configure backup automático
- Deploy em produção (Vercel + Supabase)
