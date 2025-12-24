-- Tabela de instituições (escolas)
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB, -- {street, city, state, zip_code, country}
  subscription_tier TEXT DEFAULT 'institution',
  total_credits INTEGER DEFAULT 0,
  license_count INTEGER DEFAULT 1,
  active_licenses INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_institutions_cnpj ON institutions(cnpj);

-- Comentários
COMMENT ON TABLE institutions IS 'Escolas e instituições de ensino';
COMMENT ON COLUMN institutions.license_count IS 'Número de licenças contratadas';
COMMENT ON COLUMN institutions.active_licenses IS 'Licenças em uso';
