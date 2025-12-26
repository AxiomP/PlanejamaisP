-- Migração: Adicionar suporte a templates institucionais
-- Permite que instituições criem templates compartilhados para seus professores

-- Adicionar coluna institution_id para vincular templates a instituições
ALTER TABLE public.generation_templates
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;

-- Adicionar coluna scope para diferenciar templates pessoais de institucionais
ALTER TABLE public.generation_templates
ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'personal'
CHECK (scope IN ('personal', 'institutional'));

-- Índice para busca por instituição
CREATE INDEX IF NOT EXISTS idx_templates_institution ON generation_templates(institution_id);

-- Índice para busca por escopo
CREATE INDEX IF NOT EXISTS idx_templates_scope ON generation_templates(scope);

-- Comentários
COMMENT ON COLUMN generation_templates.institution_id IS 'Instituição dona do template (se scope=institutional)';
COMMENT ON COLUMN generation_templates.scope IS 'Escopo do template: personal (usuário) ou institutional (instituição)';

-- RLS: Permitir que usuários vejam templates de sua instituição
CREATE POLICY "Users can view institutional templates from their institution"
  ON generation_templates
  FOR SELECT
  USING (
    scope = 'institutional'
    AND institution_id IN (
      SELECT institution_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS: Apenas admins podem criar/editar templates institucionais
CREATE POLICY "Only institution admins can manage institutional templates"
  ON generation_templates
  FOR ALL
  USING (
    scope = 'institutional'
    AND institution_id IN (
      SELECT institution_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'institution')
    )
  );
