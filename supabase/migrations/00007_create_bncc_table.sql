-- Tabela de códigos BNCC
CREATE TABLE IF NOT EXISTS public.bncc_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  competence_area TEXT,
  full_description TEXT,
  examples JSONB,
  related_codes JSONB,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bncc_code ON bncc_codes(code);
CREATE INDEX idx_bncc_subject ON bncc_codes(subject);
CREATE INDEX idx_bncc_grade ON bncc_codes(grade_level);
CREATE INDEX idx_bncc_subject_grade ON bncc_codes(subject, grade_level);
CREATE INDEX idx_bncc_search ON bncc_codes USING GIN(search_vector);

-- Trigger para atualizar search_vector
CREATE OR REPLACE FUNCTION update_bncc_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.full_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update_bncc
  BEFORE INSERT OR UPDATE ON bncc_codes
  FOR EACH ROW EXECUTE FUNCTION update_bncc_search_vector();

-- Comentários
COMMENT ON TABLE bncc_codes IS 'Catálogo completo de códigos BNCC';
