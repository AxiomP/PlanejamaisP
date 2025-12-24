-- Tabela de templates salvos
CREATE TABLE IF NOT EXISTS public.generation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_templates_user ON generation_templates(user_id);
CREATE INDEX idx_templates_tool ON generation_templates(tool_type);
CREATE INDEX idx_templates_public ON generation_templates(is_public);

-- Comentários
COMMENT ON TABLE generation_templates IS 'Templates salvos para reutilização';
