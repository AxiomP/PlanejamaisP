# 🚀 Guia de Setup Completo - Planeja+ MVP

## ✅ Pré-requisitos

- [x] Node.js 18+ instalado
- [x] Google Gemini API Key (você já tem)
- [ ] Conta no Supabase (vamos criar)
- [ ] Conta no Mercado Pago (opcional para pagamentos - pode configurar depois)

---

## 📦 PASSO 1: Configurar Supabase

### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Preencha:
   - **Project name:** planeja-mais-mvp
   - **Database Password:** (salve em local seguro)
   - **Region:** South America (São Paulo) - mais próximo do Brasil
   - **Pricing Plan:** Free (suficiente para MVP)
4. Aguarde ~2 minutos para o projeto ser criado

### 1.2 Executar Migrations

**Opção A: Via Supabase Dashboard (Recomendado para iniciantes)**

1. No dashboard do projeto, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie e cole o conteúdo de cada arquivo de migration **NA ORDEM**:

```bash
supabase/migrations/00001_create_institutions.sql
supabase/migrations/00002_create_users.sql
supabase/migrations/00003_create_generations.sql
supabase/migrations/00004_create_credit_transactions.sql
supabase/migrations/00005_create_chatbot_tables.sql
supabase/migrations/00006_create_templates.sql
supabase/migrations/00007_create_bncc_table.sql
supabase/migrations/00008_create_functions.sql
supabase/migrations/00009_create_rls_policies.sql
```

4. Execute cada query clicando em "Run"
5. Verifique se não há erros

**Opção B: Via CLI do Supabase (Avançado)**

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migrations
supabase db push
```

### 1.3 Executar Seeds (Dados Iniciais)

1. No **SQL Editor**, crie uma nova query
2. Copie e cole o conteúdo de `supabase/seeds/initial_data.sql`
3. Execute

Isso vai popular a tabela `bncc_codes` com ~14 códigos de exemplo.

### 1.4 Configurar Autenticação

1. No dashboard, vá em **Authentication** > **Providers**
2. Habilite **Email**:
   - [x] Enable email provider
   - [x] Confirm email (recomendado)
   - [x] Secure email change
3. Habilite **Google OAuth**:
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um projeto (ou use existente)
   - Vá em **APIs & Services** > **Credentials**
   - Crie **OAuth 2.0 Client ID**
     - Application type: Web application
     - Authorized redirect URIs: `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copie **Client ID** e **Client Secret**
   - Cole no Supabase Authentication > Google

### 1.5 Obter Credenciais

1. No dashboard, vá em **Settings** > **API**
2. Copie:
   - **Project URL**: `https://SEU_PROJECT_REF.supabase.co`
   - **anon public** key (use esta no frontend)
   - **service_role** key (NUNCA exponha no frontend, apenas backend)

---

## 🔐 PASSO 2: Configurar Variáveis de Ambiente

1. Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Google Gemini
GEMINI_API_KEY=sua_gemini_api_key_aqui

# Mercado Pago (opcional - configure depois)
# MERCADOPAGO_ACCESS_TOKEN=
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **IMPORTANTE:** Nunca commite o `.env.local`! Ele já está no `.gitignore`.

---

## 📦 PASSO 3: Instalar Dependências do Projeto

```bash
npm install
```

Isso vai instalar todas as dependências já listadas no `package.json`.

---

## 🧪 PASSO 4: Testar Configuração

### 4.1 Testar Conexão Supabase

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

A landing page deve carregar normalmente.

### 4.2 Verificar Banco de Dados

No Supabase Dashboard:
1. Vá em **Table Editor**
2. Verifique se todas as tabelas foram criadas:
   - institutions
   - users
   - generations
   - credit_transactions
   - chatbot_conversations
   - chatbot_messages
   - generation_templates
   - bncc_codes

### 4.3 Teste de Registro

1. Acesse `http://localhost:3000` (quando implementarmos a página de registro)
2. Tente criar uma conta
3. Verifique no Supabase **Authentication** > **Users** se o usuário foi criado
4. Verifique na tabela **users** se o registro estendido foi criado

---

## 🎨 PASSO 5: Próximas Ações

Com o setup completo, podemos partir para:
1. ✅ Criar componentes UI base
2. ✅ Implementar páginas de autenticação
3. ✅ Estruturar dashboard
4. ✅ Desenvolver primeira ferramenta (Plano de Aula)

---

## 🆘 Troubleshooting

### Erro: "Invalid API key"
- Verifique se copiou as chaves corretas do Supabase
- Certifique-se de que o `.env.local` está na raiz do projeto
- Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

### Erro: "relation does not exist"
- As migrations não foram executadas corretamente
- Execute-as novamente na ordem correta
- Verifique se há erros de sintaxe SQL

### Erro: "Row Level Security"
- Verifique se a migration 00009 (RLS policies) foi executada
- Teste com usuário autenticado (RLS bloqueia acesso não autenticado)

### Google OAuth não funciona
- Verifique se a URL de redirect está correta
- Certifique-se de que o projeto Google Cloud está ativo
- Verifique se o Client ID e Secret estão corretos

---

## 📞 Suporte

- **Documentação Supabase:** https://supabase.com/docs
- **Documentação Next.js:** https://nextjs.org/docs
- **Gemini API:** https://ai.google.dev/docs

---

**Status:** Setup Manual Necessário
**Tempo Estimado:** 30-45 minutos
**Última Atualização:** 15/11/2025
