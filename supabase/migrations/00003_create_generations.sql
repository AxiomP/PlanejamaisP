-- Tabela central de gerações
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN (
    'plano_aula', 'prova', 'lista_exercicios', 'sequencia_didatica',
    'texto_apoio', 'ideias_atividades', 'pei_pdi', 'reescritor_texto',
    'projeto_educacional', 'chatbot'
  )),
  title TEXT,
  input_data JSONB NOT NULL,
  output_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  credits_used INTEGER DEFAULT 100,
  processing_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_tool ON generations(tool_type);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_generations_user_date ON generations(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Comentários
COMMENT ON TABLE generations IS 'Todas as gerações de conteúdo realizadas';
COMMENT ON COLUMN generations.input_data IS 'Dados fornecidos pelo usuário';
COMMENT ON COLUMN generations.output_data IS 'Conteúdo gerado pela IA';
