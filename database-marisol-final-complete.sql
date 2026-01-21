-- ============================================
-- MARISOL - BASE DE DADOS COMPLETA E FINAL
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. TABELA DE TEMPLATES DE EMAIL
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'order_confirmation', 'shipping', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver templates" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem criar templates" ON email_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins podem atualizar templates" ON email_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem deletar templates" ON email_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 2. ADICIONAR CAMPOS DE TRACKING NAS ENCOMENDAS
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ============================================
-- 3. TABELA DE AVALIAÇÕES DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);

-- RLS para product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver avaliações aprovadas" ON product_reviews
  FOR SELECT USING (is_approved = true OR auth.role() = 'authenticated');

CREATE POLICY "Clientes podem criar avaliações" ON product_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem atualizar avaliações" ON product_reviews
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem deletar avaliações" ON product_reviews
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 4. ATUALIZAR TABELA DE PRODUTOS COM RATING MÉDIO
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Trigger para atualizar rating médio automaticamente
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- ============================================
-- 5. TABELA DE MENSAGENS DE CONTATO (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem criar mensagens" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem ver mensagens" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem atualizar mensagens" ON contact_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 6. VIEWS DE ESTATÍSTICAS PARA O DASHBOARD
-- ============================================

-- View: Produtos mais vendidos
CREATE OR REPLACE VIEW products_best_sellers AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.price,
  COUNT(oi.id) as total_orders,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.quantity * oi.price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('completed', 'processing')
GROUP BY p.id, p.name, p.image_url, p.price
ORDER BY total_quantity_sold DESC
LIMIT 10;

-- View: Estatísticas de encomendas por status
CREATE OR REPLACE VIEW orders_stats_by_status AS
SELECT 
  status,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue
FROM orders
GROUP BY status;

-- View: Receita por mês
CREATE OR REPLACE VIEW revenue_by_month AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue
FROM orders
WHERE status IN ('completed', 'processing')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View: Produtos com estoque baixo
CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
  id,
  name,
  stock,
  price,
  image_url
FROM products
WHERE stock < 10 AND stock > 0
ORDER BY stock ASC;

-- View: Clientes mais ativos
CREATE OR REPLACE VIEW customers_most_active AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.full_name, c.email
ORDER BY total_orders DESC
LIMIT 20;

-- ============================================
-- 7. FUNÇÃO PARA CRIAR NOTIFICAÇÃO AUTOMÁTICA
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_on_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    title,
    message,
    type,
    is_read
  ) VALUES (
    'Nova Encomenda',
    'Nova encomenda #' || NEW.id || ' de ' || NEW.customer_email,
    'order',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_notification_on_order ON orders;
CREATE TRIGGER trigger_create_notification_on_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION create_notification_on_order();

-- ============================================
-- 8. FUNÇÃO PARA CRIAR NOTIFICAÇÃO DE ESTOQUE BAIXO
-- ============================================
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock < 10 AND NEW.stock > 0 AND (OLD.stock IS NULL OR OLD.stock >= 10) THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      is_read
    ) VALUES (
      'Estoque Baixo',
      'O produto "' || NEW.name || '" está com estoque baixo (' || NEW.stock || ' unidades)',
      'stock',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_low_stock ON products;
CREATE TRIGGER trigger_check_low_stock
AFTER INSERT OR UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- ============================================
-- 9. ADICIONAR CAMPOS EXTRAS EM CUSTOMERS
-- ============================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- ============================================
-- 10. TABELA DE HISTÓRICO DE ALTERAÇÕES (ADMIN LOGS)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver logs" ON admin_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sistema pode criar logs" ON admin_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 11. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- ============================================

-- Inserir template de email de boas-vindas
INSERT INTO email_templates (name, subject, content, type)
VALUES (
  'Boas-vindas Padrão',
  'Bem-vindo à Marisol! 🎉',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); border-radius: 20px;">
  <div style="background: white; padding: 40px; border-radius: 15px;">
    <h1 style="color: #ec4899; text-align: center; margin-bottom: 20px;">Bem-vindo à Marisol! 🎉</h1>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Olá {{nome}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Estamos muito felizes por tê-lo(a) connosco! A Marisol é a sua nova casa de moda feminina, onde encontrará peças únicas e elegantes.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{site_url}}/products" style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Explorar Produtos</a>
    </div>
    <p style="color: #666; font-size: 14px; text-align: center;">Use o código <strong style="color: #ec4899;">BEMVINDO10</strong> para 10% de desconto na primeira compra!</p>
  </div>
</div>',
  'welcome'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 12. ATUALIZAR TIMESTAMPS AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Todas as tabelas, triggers e views serão criadas
-- ============================================
