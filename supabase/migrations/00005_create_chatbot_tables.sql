-- Tabela de conversas do chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de mensagens do chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_chat_conv_user ON chatbot_conversations(user_id);
CREATE INDEX idx_chat_conv_updated ON chatbot_conversations(last_message_at DESC);
CREATE INDEX idx_chat_conv_user_updated ON chatbot_conversations(user_id, last_message_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_chat_msg_conv ON chatbot_messages(conversation_id);
CREATE INDEX idx_chat_msg_created ON chatbot_messages(created_at);

-- Comentários
COMMENT ON TABLE chatbot_conversations IS 'Conversas do chatbot BNCC';
COMMENT ON TABLE chatbot_messages IS 'Mensagens individuais do chatbot';
