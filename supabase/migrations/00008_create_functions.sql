-- Função para consumir créditos
CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id UUID,
  p_generation_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Busca saldo atual com lock
  SELECT credits INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Verifica se tem créditos suficientes
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Atualiza saldo
  UPDATE users
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registra transação
  INSERT INTO credit_transactions (
    user_id, generation_id, transaction_type,
    amount, balance_after, description
  ) VALUES (
    p_user_id, p_generation_id, 'generation_usage',
    -p_amount, v_current_balance - p_amount,
    'Credits consumed for generation'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar créditos
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Atualiza saldo
  UPDATE users
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Registra transação
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount,
    balance_after, description
  ) VALUES (
    p_user_id, p_transaction_type, p_amount,
    v_new_balance, COALESCE(p_description, 'Credits added')
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION consume_credits IS 'Consome créditos do usuário e registra transação';
COMMENT ON FUNCTION add_credits IS 'Adiciona créditos ao usuário e registra transação';
