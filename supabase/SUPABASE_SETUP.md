# Configuração do Supabase - Planeja+

## Passo 1: Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova organização (se não tiver)
3. Crie um novo projeto:
   - **Nome:** planeja-plus-mvp (ou nome de sua preferência)
   - **Database Password:** Guarde em local seguro
   - **Region:** South America (São Paulo) - para melhor latência no Brasil
   - **Pricing Plan:** Free (para desenvolvimento/teste)

## Passo 2: Obter Credenciais

Após criar o projeto, vá em **Settings > API** e copie:

1. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
2. **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

Cole no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...
```

## Passo 3: Executar Migrations

### Opção A: Via Interface do Supabase (Recomendado para MVP)

1. Acesse **SQL Editor** no painel do Supabase
2. Execute cada arquivo de migration na ordem:
   - `00001_create_institutions.sql`
   - `00002_create_users.sql`
   - `00003_create_generations.sql`
   - `00004_create_credit_transactions.sql`
   - `00005_create_chatbot_tables.sql`
   - `00006_create_templates.sql`
   - `00007_create_bncc_table.sql`
   - `00008_create_functions.sql`
   - `00009_create_rls_policies.sql`

3. Copie e cole o conteúdo de cada arquivo e clique em **Run**

### Opção B: Via Supabase CLI (Avançado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref <project-id>

# Executar migrations
supabase db push
```

## Passo 4: Configurar Autenticação

1. Vá em **Authentication > Providers**
2. Habilite **Email** (já vem habilitado)
3. Configure **Google OAuth** (opcional):
   - Enable Google provider
   - Adicione Client ID e Client Secret do Google Cloud Console
   - Adicione URL de redirect: `https://xxxxx.supabase.co/auth/v1/callback`

### Configurações de Email

Em **Authentication > Email Templates**, personalize os templates:

- **Confirm signup**
- **Reset password**
- **Magic Link**

## Passo 5: Configurar Storage (Para uploads)

1. Vá em **Storage**
2. Crie um bucket chamado `generations`
3. Configure políticas:

```sql
-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generations');

-- Usuários podem ler apenas seus próprios arquivos
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Passo 6: Seed de Dados Iniciais (Opcional)

Execute o arquivo `seeds/initial_data.sql` para popular:
- Códigos BNCC básicos
- Configurações de ferramentas
- Templates do sistema

## Passo 7: Verificação

Execute os seguintes comandos SQL para verificar:

```sql
-- Verificar tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verificar policies RLS
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Verificar funções
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

## Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de executar as migrations na ordem correta
- Verifique se está usando o schema `public`

### Erro: "permission denied for table"
- Verifique se as RLS policies foram criadas corretamente
- Confirme que o usuário está autenticado

### Erro ao inserir em tabelas
- Verifique se RLS está ativo e policies permitem a operação
- Use SECURITY DEFINER nas functions quando necessário

## URLs Úteis

- **Dashboard:** https://app.supabase.com/project/<project-id>
- **API Docs:** https://app.supabase.com/project/<project-id>/api
- **Database:** https://app.supabase.com/project/<project-id>/database
- **SQL Editor:** https://app.supabase.com/project/<project-id>/sql

## Próximos Passos

Após configurar o Supabase:

1. ✅ Testar autenticação (criar usuário de teste)
2. ✅ Verificar criação automática em `public.users`
3. ✅ Testar consume_credits e add_credits
4. ✅ Continuar desenvolvimento do frontend
