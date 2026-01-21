-- ============================================
-- ARISOL - CONFIGURAÇÃO COMPLETA DA BASE DE DADOS
-- Sistema de E-commerce Profissional
-- ============================================

-- 1. ATUALIZAR CONFIGURAÇÕES DE ENVIO
-- ============================================
UPDATE site_settings 
SET shipping_settings = jsonb_build_object(
  'free_shipping_threshold', 50,
  'shipping_cost', 4.99,
  'estimated_delivery_days', '3-5',
  'international_delivery_days', '5-10'
)
WHERE id = 1;

-- Se não existir registro, criar um
INSERT INTO site_settings (id, shipping_settings)
SELECT 1, jsonb_build_object(
  'free_shipping_threshold', 50,
  'shipping_cost', 4.99,
  'estimated_delivery_days', '3-5',
  'international_delivery_days', '5-10'
)
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id = 1);


-- 2. ADICIONAR INFORMAÇÕES DE SUPORTE 24/7
-- ============================================
UPDATE site_settings 
SET support_info = jsonb_build_object(
  'ai_support', '24/7',
  'human_support_hours', '08:00-16:00',
  'timezone', 'Luxemburgo',
  'phone', '+352 631 377 168',
  'email_store', 'marianasipereira@gmail.com',
  'email_support', 'jokadas69@gmail.com'
)
WHERE id = 1;


-- 3. ADICIONAR INFORMAÇÕES DA EMPRESA
-- ============================================
UPDATE site_settings 
SET company_info = jsonb_build_object(
  'name', 'Arisol',
  'legal_name', 'Arisol Moda Feminina',
  'location', 'Luxemburgo',
  'founded', '2024',
  'ceo', 'Mariana Pereira',
  'coo', 'Claudio Pereira'
)
WHERE id = 1;


-- 4. VERIFICAR E CORRIGIR ESTRUTURA DA TABELA checkout_sessions
-- ============================================
-- Garantir que a coluna stripe_session_id existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checkout_sessions' 
    AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE checkout_sessions 
    ADD COLUMN stripe_session_id TEXT UNIQUE;
  END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id 
ON checkout_sessions(stripe_session_id);


-- 5. ADICIONAR COLUNA payment_status SE NÃO EXISTIR
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checkout_sessions' 
    AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE checkout_sessions 
    ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;
END $$;


-- 6. GARANTIR QUE A TABELA orders TEM TODAS AS COLUNAS NECESSÁRIAS
-- ============================================
DO $$ 
BEGIN
  -- Adicionar stripe_session_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN stripe_session_id TEXT;
  END IF;

  -- Adicionar stripe_payment_intent_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;

  -- Adicionar shipping_address se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'shipping_address'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN shipping_address JSONB;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id 
ON orders(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
ON orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);


-- 7. GARANTIR QUE A TABELA order_items TEM TODAS AS COLUNAS
-- ============================================
DO $$ 
BEGIN
  -- Adicionar size se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'size'
  ) THEN
    ALTER TABLE order_items 
    ADD COLUMN size TEXT;
  END IF;

  -- Adicionar color se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE order_items 
    ADD COLUMN color TEXT;
  END IF;

  -- Adicionar product_image se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'product_image'
  ) THEN
    ALTER TABLE order_items 
    ADD COLUMN product_image TEXT;
  END IF;
END $$;


-- 8. ATUALIZAR POLÍTICAS RLS PARA CHECKOUT_SESSIONS
-- ============================================
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own checkout sessions" ON checkout_sessions;
DROP POLICY IF EXISTS "Users can create checkout sessions" ON checkout_sessions;
DROP POLICY IF EXISTS "Service role can manage all checkout sessions" ON checkout_sessions;

-- Criar novas políticas
CREATE POLICY "Users can view their own checkout sessions"
ON checkout_sessions FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create checkout sessions"
ON checkout_sessions FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Service role can manage all checkout sessions"
ON checkout_sessions FOR ALL
USING (auth.role() = 'service_role');


-- 9. ATUALIZAR POLÍTICAS RLS PARA ORDERS
-- ============================================
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Criar novas políticas
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Service role can manage all orders"
ON orders FOR ALL
USING (auth.role() = 'service_role');

-- Política para admins (assumindo que existe uma coluna is_admin na tabela customers)
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = auth.uid() 
    AND customers.is_admin = true
  )
);


-- 10. ATUALIZAR POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Service role can manage all order items" ON order_items;

CREATE POLICY "Users can view their own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all order items"
ON order_items FOR ALL
USING (auth.role() = 'service_role');


-- 11. CRIAR FUNÇÃO PARA GERAR NÚMERO DE ENCOMENDA
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ARS' || LPAD(nextval('orders_id_seq')::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;


-- 12. ADICIONAR TRIGGER PARA GERAR NÚMERO DE ENCOMENDA AUTOMATICAMENTE
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


-- 13. CRIAR VIEW PARA DASHBOARD ADMIN
-- ============================================
CREATE OR REPLACE VIEW admin_orders_summary AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.status,
  o.payment_status,
  o.total_amount,
  o.currency,
  c.full_name as customer_name,
  c.email as customer_email,
  COUNT(oi.id) as total_items,
  SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.created_at, o.status, o.payment_status, 
         o.total_amount, o.currency, c.full_name, c.email
ORDER BY o.created_at DESC;


-- 14. CRIAR ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_is_admin ON customers(is_admin);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);


-- 15. ADICIONAR DADOS INICIAIS SE NÃO EXISTIREM
-- ============================================
-- Inserir configurações padrão se não existirem
INSERT INTO site_settings (
  id,
  shipping_settings,
  support_info,
  company_info
)
SELECT 
  1,
  jsonb_build_object(
    'free_shipping_threshold', 50,
    'shipping_cost', 4.99,
    'estimated_delivery_days', '3-5',
    'international_delivery_days', '5-10'
  ),
  jsonb_build_object(
    'ai_support', '24/7',
    'human_support_hours', '08:00-16:00',
    'timezone', 'Luxemburgo',
    'phone', '+352 631 377 168',
    'email_store', 'marianasipereira@gmail.com',
    'email_support', 'jokadas69@gmail.com'
  ),
  jsonb_build_object(
    'name', 'Arisol',
    'legal_name', 'Arisol Moda Feminina',
    'location', 'Luxemburgo',
    'founded', '2024',
    'ceo', 'Mariana Pereira',
    'coo', 'Claudio Pereira'
  )
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id = 1);


-- ============================================
-- FIM DA CONFIGURAÇÃO
-- ============================================

-- Verificar se tudo foi criado corretamente
SELECT 'Configuração completa!' as status;

-- Mostrar resumo das tabelas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('site_settings', 'checkout_sessions', 'orders', 'order_items', 'customers')
ORDER BY table_name;
