-- ============================================
-- MARISOL - DATABASE COMPLETE SETUP V2
-- Sistema completo de e-commerce com avaliações
-- ============================================

-- 1. CRIAR TABELA DE AVALIAÇÕES DE PRODUTOS
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);

-- 2. ADICIONAR CAMPOS DE AVALIAÇÃO NA TABELA PRODUCTS
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 3. FUNÇÃO PARA ATUALIZAR MÉDIA DE AVALIAÇÕES
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

-- 4. TRIGGER PARA ATUALIZAR AVALIAÇÕES AUTOMATICAMENTE
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- 5. ADICIONAR CAMPO DE TRACKING NA TABELA ORDERS
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100);

-- 6. ATUALIZAR TABELA DE NOTIFICAÇÕES PARA INCLUIR MENSAGENS DE CONTACTO
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_message TEXT;

-- 7. CRIAR TABELA PARA MENSAGENS DE CONTACTO (SEPARADA)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mensagens de contacto
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON contact_submissions(is_read);

-- 8. FUNÇÃO PARA CRIAR NOTIFICAÇÃO QUANDO RECEBE MENSAGEM DE CONTACTO
CREATE OR REPLACE FUNCTION create_contact_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    type,
    title,
    message,
    contact_name,
    contact_email,
    contact_phone,
    contact_message,
    is_read,
    created_at
  ) VALUES (
    'contact',
    'Nova Mensagem de Contacto',
    'Recebeu uma nova mensagem de ' || NEW.name,
    NEW.name,
    NEW.email,
    NEW.phone,
    NEW.message,
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGER PARA CRIAR NOTIFICAÇÃO AUTOMATICAMENTE
DROP TRIGGER IF EXISTS trigger_create_contact_notification ON contact_submissions;
CREATE TRIGGER trigger_create_contact_notification
AFTER INSERT ON contact_submissions
FOR EACH ROW
EXECUTE FUNCTION create_contact_notification();

-- 10. ATUALIZAR RLS (ROW LEVEL SECURITY) PARA PRODUCT_REVIEWS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler avaliações aprovadas
DROP POLICY IF EXISTS "Todos podem ler avaliações aprovadas" ON product_reviews;
CREATE POLICY "Todos podem ler avaliações aprovadas"
ON product_reviews FOR SELECT
USING (is_approved = true);

-- Política: Clientes autenticados podem criar avaliações
DROP POLICY IF EXISTS "Clientes podem criar avaliações" ON product_reviews;
CREATE POLICY "Clientes podem criar avaliações"
ON product_reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins podem gerir avaliações" ON product_reviews;
CREATE POLICY "Admins podem gerir avaliações"
ON product_reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.role = 'admin'
  )
);

-- 11. ATUALIZAR RLS PARA CONTACT_SUBMISSIONS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode criar mensagem de contacto
DROP POLICY IF EXISTS "Qualquer pessoa pode enviar mensagem" ON contact_submissions;
CREATE POLICY "Qualquer pessoa pode enviar mensagem"
ON contact_submissions FOR INSERT
WITH CHECK (true);

-- Política: Apenas admins podem ler mensagens
DROP POLICY IF EXISTS "Admins podem ler mensagens" ON contact_submissions;
CREATE POLICY "Admins podem ler mensagens"
ON contact_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.role = 'admin'
  )
);

-- Política: Admins podem atualizar mensagens
DROP POLICY IF EXISTS "Admins podem atualizar mensagens" ON contact_submissions;
CREATE POLICY "Admins podem atualizar mensagens"
ON contact_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.role = 'admin'
  )
);

-- 12. ADICIONAR CAMPOS ÚTEIS NA TABELA CATEGORIES
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon VARCHAR(100) DEFAULT 'ri-shirt-line';

-- 13. ADICIONAR CAMPOS ÚTEIS NA TABELA SUBCATEGORIES
ALTER TABLE subcategories
ADD COLUMN IF NOT EXISTS description TEXT;

-- 14. CRIAR VIEW PARA ESTATÍSTICAS DO DASHBOARD
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'processing') as processing_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
  (SELECT COUNT(*) FROM customers WHERE role = 'customer') as total_customers,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
  (SELECT COUNT(*) FROM product_reviews WHERE is_approved = false) as pending_reviews,
  (SELECT COUNT(*) FROM contact_submissions WHERE is_read = false) as unread_messages,
  (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE) as today_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed' AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)) as month_revenue;

-- 15. CRIAR VIEW PARA PRODUTOS MAIS VENDIDOS
CREATE OR REPLACE VIEW top_selling_products AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.price,
  p.sale_price,
  COUNT(oi.id) as total_orders,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.quantity * oi.price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY p.id, p.name, p.image_url, p.price, p.sale_price
ORDER BY total_quantity_sold DESC
LIMIT 10;

-- 16. CRIAR VIEW PARA PRODUTOS MAIS FAVORITADOS
CREATE OR REPLACE VIEW most_favorited_products AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.price,
  p.sale_price,
  COUNT(f.id) as favorite_count
FROM products p
LEFT JOIN favorites f ON p.id = f.product_id
GROUP BY p.id, p.name, p.image_url, p.price, p.sale_price
ORDER BY favorite_count DESC
LIMIT 10;

-- 17. CRIAR VIEW PARA PRODUTOS MAIS BEM AVALIADOS
CREATE OR REPLACE VIEW top_rated_products AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.price,
  p.sale_price,
  p.average_rating,
  p.total_reviews
FROM products p
WHERE p.total_reviews >= 3 AND p.is_active = true
ORDER BY p.average_rating DESC, p.total_reviews DESC
LIMIT 10;

-- 18. ATUALIZAR FUNÇÃO DE TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 19. ADICIONAR TRIGGERS DE UPDATED_AT
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON contact_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 20. INSERIR CATEGORIAS E SUBCATEGORIAS DE EXEMPLO (SE NÃO EXISTIREM)
INSERT INTO categories (name, slug, description, icon, is_active, display_order)
VALUES 
  ('Vestuário', 'vestuario', 'Roupas elegantes e confortáveis para todas as ocasiões', 'ri-shirt-line', true, 1),
  ('Acessórios', 'acessorios', 'Complementos perfeitos para o seu look', 'ri-handbag-line', true, 2),
  ('Calçado', 'calcado', 'Sapatos elegantes e confortáveis', 'ri-footprint-line', true, 3),
  ('Beleza', 'beleza', 'Produtos de beleza e cuidados pessoais', 'ri-heart-pulse-line', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- 21. GRANT PERMISSIONS
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON top_selling_products TO authenticated;
GRANT SELECT ON most_favorited_products TO authenticated;
GRANT SELECT ON top_rated_products TO authenticated;

-- ============================================
-- FIM DO SETUP
-- ============================================

-- Verificar se tudo foi criado corretamente
SELECT 
  'product_reviews' as table_name,
  COUNT(*) as row_count
FROM product_reviews
UNION ALL
SELECT 
  'contact_submissions' as table_name,
  COUNT(*) as row_count
FROM contact_submissions;

-- Mostrar estatísticas
SELECT * FROM dashboard_stats;
