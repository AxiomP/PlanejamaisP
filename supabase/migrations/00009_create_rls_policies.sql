-- Ativar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_templates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES: USERS
-- ========================================

-- Usuários podem ler apenas seu próprio perfil
CREATE POLICY users_select_own
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY users_update_own
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- POLICIES: GENERATIONS
-- ========================================

-- Usuários podem inserir suas próprias gerações
CREATE POLICY generations_insert_own
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ler apenas suas próprias gerações
CREATE POLICY generations_select_own
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias gerações
CREATE POLICY generations_update_own
  ON generations FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias gerações
CREATE POLICY generations_delete_own
  ON generations FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- POLICIES: CREDIT_TRANSACTIONS
-- ========================================

-- Usuários podem ler apenas suas próprias transações
CREATE POLICY credit_trans_select_own
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas funções do sistema podem inserir transações
-- (isso é feito via stored procedures com SECURITY DEFINER)
CREATE POLICY credit_trans_insert_system
  ON credit_transactions FOR INSERT
  WITH CHECK (false);

-- ========================================
-- POLICIES: CHATBOT_CONVERSATIONS
-- ========================================

-- Usuários têm acesso completo às suas conversas
CREATE POLICY chatbot_conv_all_own
  ON chatbot_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- POLICIES: CHATBOT_MESSAGES
-- ========================================

-- Usuários podem ler mensagens das suas conversas
CREATE POLICY chatbot_msg_select_own
  ON chatbot_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM chatbot_conversations WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir mensagens nas suas conversas
CREATE POLICY chatbot_msg_insert_own
  ON chatbot_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chatbot_conversations WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- POLICIES: GENERATION_TEMPLATES
-- ========================================

-- Usuários podem ler seus próprios templates e os públicos
CREATE POLICY templates_select_own_or_public
  ON generation_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Usuários podem inserir seus próprios templates
CREATE POLICY templates_insert_own
  ON generation_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios templates
CREATE POLICY templates_update_own
  ON generation_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar apenas seus próprios templates
CREATE POLICY templates_delete_own
  ON generation_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- POLICIES: BNCC_CODES (Público para leitura)
-- ========================================

ALTER TABLE bncc_codes ENABLE ROW LEVEL SECURITY;

-- Todos podem ler os códigos BNCC
CREATE POLICY bncc_codes_select_all
  ON bncc_codes FOR SELECT
  TO authenticated
  USING (true);
