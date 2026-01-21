-- ============================================
-- ARISOL - CONFIGURAÇÃO COMPLETA DA BASE DE DADOS
-- Sistema de E-commerce Profissional
-- ============================================

-- 1. ATUALIZAR SITE_SETTINGS COM CONFIGURAÇÕES DE ENVIO E SUPORTE
-- ============================================
INSERT INTO site_settings (id, shipping_settings, support_info, created_at, updated_at)
VALUES (
  1,
  jsonb_build_object(
    'free_shipping_threshold', 50,
    'shipping_cost', 4.99,
    'currency', 'EUR'
  ),
  jsonb_build_object(
    'ai_available', '24/7',
    'human_available', '08:00-16:00 (Luxemburgo)',
    'phone', '+352 631 377 168',
    'email', 'marianasipereira@gmail.com',
    'tech_support_email', 'jokadas69@gmail.com'
  ),
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  shipping_settings = EXCLUDED.shipping_settings,
  support_info = EXCLUDED.support_info,
  updated_at = NOW();


-- 2. CRIAR TABELA DE CONFIGURAÇÕES DE PAGAMENTO
-- ============================================
CREATE TABLE IF NOT EXISTS payment_settings (
  id BIGSERIAL PRIMARY KEY,
  stripe_enabled BOOLEAN DEFAULT true,
  payment_methods jsonb DEFAULT '["card", "paypal", "google_pay", "apple_pay"]'::jsonb,
  accepted_cards jsonb DEFAULT '["visa", "mastercard", "amex"]'::jsonb,
  currency VARCHAR(3) DEFAULT 'EUR',
  test_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão de pagamento
INSERT INTO payment_settings (id, stripe_enabled, payment_methods, accepted_cards, currency, test_mode)
VALUES (
  1,
  true,
  '["card", "paypal", "google_pay", "apple_pay"]'::jsonb,
  '["visa", "mastercard", "amex"]'::jsonb,
  'EUR',
  false
)
ON CONFLICT (id) DO NOTHING;

-- RLS para payment_settings
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ler payment_settings" ON payment_settings;
CREATE POLICY "Todos podem ler payment_settings" ON payment_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins podem editar payment_settings" ON payment_settings;
CREATE POLICY "Apenas admins podem editar payment_settings" ON payment_settings FOR ALL USING (
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);


-- 3. ATUALIZAR TABELA DE ENCOMENDAS (ORDERS)
-- ============================================
-- Adicionar campos adicionais se não existirem
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);


-- 4. ATUALIZAR TABELA DE SESSÕES DE CHECKOUT
-- ============================================
-- Adicionar campos adicionais se não existirem
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_id ON checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_customer_id ON checkout_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);


-- 5. CRIAR TABELA DE LOGS DE PAGAMENTO (PARA AUDITORIA)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  event_type VARCHAR(100),
  status VARCHAR(50),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  metadata jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins podem ver payment_logs" ON payment_logs;
CREATE POLICY "Apenas admins podem ver payment_logs" ON payment_logs FOR SELECT USING (
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);

DROP POLICY IF EXISTS "Sistema pode inserir payment_logs" ON payment_logs;
CREATE POLICY "Sistema pode inserir payment_logs" ON payment_logs FOR INSERT WITH CHECK (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_session_id ON payment_logs(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);


-- 6. CRIAR TABELA DE CONFIGURAÇÕES DE EMAIL
-- ============================================
CREATE TABLE IF NOT EXISTS email_settings (
  id BIGSERIAL PRIMARY KEY,
  order_confirmation_enabled BOOLEAN DEFAULT true,
  shipping_notification_enabled BOOLEAN DEFAULT true,
  newsletter_enabled BOOLEAN DEFAULT true,
  from_email VARCHAR(255) DEFAULT 'marianasipereira@gmail.com',
  from_name VARCHAR(255) DEFAULT 'Arisol',
  reply_to_email VARCHAR(255) DEFAULT 'marianasipereira@gmail.com',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO email_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS para email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ler email_settings" ON email_settings;
CREATE POLICY "Todos podem ler email_settings" ON email_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins podem editar email_settings" ON email_settings;
CREATE POLICY "Apenas admins podem editar email_settings" ON email_settings FOR ALL USING (
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);


-- 7. ATUALIZAR POLÍTICAS RLS DAS TABELAS EXISTENTES
-- ============================================

-- Políticas para ORDERS
DROP POLICY IF EXISTS "Clientes podem ver suas próprias encomendas" ON orders;
CREATE POLICY "Clientes podem ver suas próprias encomendas" ON orders FOR SELECT USING (
  auth.uid() = customer_id OR 
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);

DROP POLICY IF EXISTS "Sistema pode criar encomendas" ON orders;
CREATE POLICY "Sistema pode criar encomendas" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins podem atualizar encomendas" ON orders;
CREATE POLICY "Admins podem atualizar encomendas" ON orders FOR UPDATE USING (
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);


-- Políticas para CHECKOUT_SESSIONS
DROP POLICY IF EXISTS "Clientes podem ver suas próprias sessões" ON checkout_sessions;
CREATE POLICY "Clientes podem ver suas próprias sessões" ON checkout_sessions FOR SELECT USING (
  auth.uid() = customer_id OR 
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);

DROP POLICY IF EXISTS "Sistema pode criar sessões" ON checkout_sessions;
CREATE POLICY "Sistema pode criar sessões" ON checkout_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema pode atualizar sessões" ON checkout_sessions;
CREATE POLICY "Sistema pode atualizar sessões" ON checkout_sessions FOR UPDATE USING (true);


-- Políticas para CUSTOMERS
DROP POLICY IF EXISTS "Clientes podem ver seus próprios dados" ON customers;
CREATE POLICY "Clientes podem ver seus próprios dados" ON customers FOR SELECT USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'email' IN ('marianasipereira@gmail.com', 'jokadas69@gmail.com')
);

DROP POLICY IF EXISTS "Clientes podem atualizar seus próprios dados" ON customers;
CREATE POLICY "Clientes podem atualizar seus próprios dados" ON customers FOR UPDATE USING (
  auth.uid() = id
);

DROP POLICY IF EXISTS "Sistema pode criar clientes" ON customers;
CREATE POLICY "Sistema pode criar clientes" ON customers FOR INSERT WITH CHECK (true);


-- 8. CRIAR FUNÇÃO PARA GERAR NÚMERO DE ENCOMENDA
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');
  
  SELECT 'AR' || year_prefix || LPAD(COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1, 6, '0')
  INTO new_number
  FROM orders
  WHERE order_number LIKE 'AR' || year_prefix || '%';
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;


-- 9. CRIAR TRIGGER PARA AUTO-GERAR NÚMERO DE ENCOMENDA
-- ============================================
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();


-- 10. CRIAR VIEW PARA ESTATÍSTICAS DO DASHBOARD
-- ============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as orders_last_30_days,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as orders_last_7_days,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) as orders_today,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_last_30_days,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '7 days') as revenue_last_7_days,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE) as revenue_today,
  (SELECT COUNT(*) FROM customers WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_customers_last_30_days,
  (SELECT COUNT(*) FROM newsletter_subscribers WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_subscribers_last_30_days,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'processing') as processing_orders;

-- Permitir que admins vejam as estatísticas
GRANT SELECT ON dashboard_stats TO authenticated;


-- ============================================
-- FIM DA CONFIGURAÇÃO
-- ============================================

-- VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT 
  'site_settings' as tabela, 
  COUNT(*) as registros 
FROM site_settings
UNION ALL
SELECT 
  'payment_settings' as tabela, 
  COUNT(*) as registros 
FROM payment_settings
UNION ALL
SELECT 
  'email_settings' as tabela, 
  COUNT(*) as registros 
FROM email_settings
UNION ALL
SELECT 
  'orders' as tabela, 
  COUNT(*) as registros 
FROM orders
UNION ALL
SELECT 
  'checkout_sessions' as tabela, 
  COUNT(*) as registros 
FROM checkout_sessions
UNION ALL
SELECT 
  'customers' as tabela, 
  COUNT(*) as registros 
FROM customers;

-- MENSAGEM DE SUCESSO
SELECT '✅ Base de dados configurada com sucesso!' as status;