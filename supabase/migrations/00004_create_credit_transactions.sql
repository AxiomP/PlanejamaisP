-- Tabela de transações de créditos
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'subscription_renewal', 'generation_usage',
    'refund', 'admin_adjustment', 'promotional'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_credit_trans_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_trans_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_trans_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_trans_user_date ON credit_transactions(user_id, created_at DESC);

-- Comentários
COMMENT ON TABLE credit_transactions IS 'Histórico de transações de créditos';
COMMENT ON COLUMN credit_transactions.amount IS 'Positivo para crédito, negativo para débito';
