# Deploy no Vercel

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://vdjzluhnwcfonqxctpce.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkanpsdWhud2Nmb25xeGN0cGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NTA2ODcsImV4cCI6MjA1MTMyNjY4N30.RnPADbJEQkdlOvFwRiZ2XbZOFfnnjC2k-cpg1cVZHh0
```

**Opcional** (apenas se você precisar de funcionalidades de administração no backend):
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkanpsdWhud2Nmb25xeGN0cGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc1MDY4NywiZXhwIjoyMDUxMzI2Njg3fQ.eQgIY1-hU1ZsC95cHq0WLk6h1Z0T-1W8WS8g0qjWrIA
```

## Passos para Deploy

1. **Crie uma conta na Vercel** (se ainda não tiver)
   - Acesse https://vercel.com
   - Faça login com GitHub, GitLab ou Bitbucket

2. **Conecte seu repositório**
   - Clique em "Add New Project"
   - Selecione seu repositório Git
   - Se o repositório não estiver conectado, faça push para GitHub primeiro

3. **Configure as variáveis de ambiente**
   - Na página de configuração do projeto, vá em "Environment Variables"
   - Adicione as variáveis listadas acima
   - Copie e cole exatamente como está

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build (geralmente 2-3 minutos)
   - Acesse a URL gerada pela Vercel

## Diferenças do Netlify

✅ **RESOLVIDO**: O problema de timeout no F5 foi causado por `output: 'export'` no Next.js, que é incompatível com Supabase no Netlify.

✅ **No Vercel**: Habilitamos SSR (Server-Side Rendering), o que permite que as chamadas do Supabase funcionem corretamente tanto no primeiro acesso quanto no refresh (F5).

## Testes após Deploy

1. ✅ Login funciona normalmente
2. ✅ F5 não causa timeout infinito
3. ✅ Dados carregam rápido (< 2 segundos)
4. ✅ Não há mais loop infinito de redirect

## Suporte

Se encontrar problemas:
- Verifique os logs na aba "Deployments" > "Logs" no painel da Vercel
- Confirme que as variáveis de ambiente estão configuradas corretamente
- Teste em uma aba anônima primeiro
