-- =====================================================
-- MARISOL E-COMMERCE - DATABASE COMPLETE SETUP
-- =====================================================
-- Este script cria todas as tabelas necessárias para a loja Marisol
-- com políticas de segurança RLS (Row Level Security) configuradas
-- =====================================================

-- =====================================================
-- 1. TABELA DE CLIENTES (CUSTOMERS)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver seu próprio perfil"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seu próprio perfil"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Permitir inserção de novos clientes"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. TABELA DE PRODUTOS (PRODUCTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  subcategory TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de produtos"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Apenas admin pode criar produtos"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Apenas admin pode atualizar produtos"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Apenas admin pode deletar produtos"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 3. TABELA DE CATEGORIAS (CATEGORIES)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de categorias"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Apenas admin pode gerenciar categorias"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 4. TABELA DE SUBCATEGORIAS (SUBCATEGORIES)
-- =====================================================
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de subcategorias"
  ON subcategories FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Apenas admin pode gerenciar subcategorias"
  ON subcategories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 5. TABELA DE ENCOMENDAS (ORDERS)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address JSONB,
  billing_address JSONB,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver suas próprias encomendas"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin pode ver todas as encomendas"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Permitir criação de encomendas"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin pode atualizar encomendas"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 6. TABELA DE ITENS DE ENCOMENDA (ORDER_ITEMS)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver itens de suas encomendas"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Admin pode ver todos os itens"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Permitir inserção de itens de encomenda"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- =====================================================
-- 7. TABELA DE FAVORITOS (FAVORITES)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- RLS para favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios favoritos"
  ON favorites FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem adicionar favoritos"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem remover favoritos"
  ON favorites FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin pode ver todos os favoritos"
  ON favorites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 8. TABELA DE CARRINHO (CART_ITEMS)
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- RLS para cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver seu próprio carrinho"
  ON cart_items FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem adicionar ao carrinho"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seu carrinho"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem remover do carrinho"
  ON cart_items FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- =====================================================
-- 9. TABELA DE ENDEREÇOS (ADDRESSES)
-- =====================================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('shipping', 'billing', 'both')),
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios endereços"
  ON addresses FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem criar endereços"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus endereços"
  ON addresses FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem deletar seus endereços"
  ON addresses FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- =====================================================
-- 10. TABELA DE NEWSLETTER (NEWSLETTER_SUBSCRIBERS)
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- RLS para newsletter_subscribers
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir inscrição pública"
  ON newsletter_subscribers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin pode ver todos os inscritos"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admin pode atualizar inscritos"
  ON newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 11. TABELA DE MENSAGENS DE CONTATO (CONTACT_MESSAGES)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir envio público de mensagens"
  ON contact_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin pode ver todas as mensagens"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admin pode atualizar mensagens"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 12. TABELA DE LOOKS INSPIRADORES (INSPIRATION_LOOKS)
-- =====================================================
CREATE TABLE IF NOT EXISTS inspiration_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  product_ids TEXT[] NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para inspiration_looks
ALTER TABLE inspiration_looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de looks"
  ON inspiration_looks FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Admin pode gerenciar looks"
  ON inspiration_looks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 13. TABELA DE NOTIFICAÇÕES (NOTIFICATIONS)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver suas notificações"
  ON notifications FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem atualizar suas notificações"
  ON notifications FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin pode criar notificações"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 14. TABELA DE CONFIGURAÇÕES DO SITE (SITE_SETTINGS)
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT DEFAULT 'Marisol',
  store_email TEXT DEFAULT 'marianasipereira@gmail.com',
  store_phone TEXT DEFAULT '+352 631 377 168',
  store_whatsapp TEXT DEFAULT '+352631377168',
  store_address TEXT DEFAULT 'Luxembourg',
  business_hours TEXT DEFAULT 'Seg-Sex: 9h-18h',
  facebook_url TEXT DEFAULT 'https://facebook.com',
  instagram_url TEXT DEFAULT 'https://instagram.com',
  twitter_url TEXT DEFAULT 'https://twitter.com',
  linkedin_url TEXT DEFAULT 'https://linkedin.com',
  pinterest_url TEXT DEFAULT 'https://pinterest.com',
  free_shipping_threshold DECIMAL(10,2) DEFAULT 80.00,
  currency TEXT DEFAULT 'EUR',
  tax_rate DECIMAL(5,2) DEFAULT 17.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO site_settings (
  store_name,
  store_email,
  store_phone,
  store_whatsapp,
  store_address,
  business_hours,
  facebook_url,
  instagram_url,
  twitter_url,
  linkedin_url,
  pinterest_url,
  free_shipping_threshold,
  currency,
  tax_rate
)
SELECT 
  'Marisol',
  'marianasipereira@gmail.com',
  '+352 631 377 168',
  '+352631377168',
  'Luxembourg',
  'Seg-Sex: 9h-18h',
  'https://facebook.com',
  'https://instagram.com',
  'https://twitter.com',
  'https://linkedin.com',
  'https://pinterest.com',
  80.00,
  'EUR',
  17.00
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

-- RLS para site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de configurações"
  ON site_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Apenas admin pode atualizar configurações"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Apenas admin pode inserir configurações"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 15. TABELA DE SESSÕES DE CHECKOUT (CHECKOUT_SESSIONS)
-- =====================================================
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- RLS para checkout_sessions
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver suas sessões"
  ON checkout_sessions FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Permitir criação de sessões"
  ON checkout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin pode ver todas as sessões"
  ON checkout_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 16. TABELA DE CÓDIGOS DE DESCONTO (DISCOUNT_CODES)
-- =====================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de códigos ativos"
  ON discount_codes FOR SELECT
  TO public
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY IF NOT EXISTS "Admin pode gerenciar códigos"
  ON discount_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- 17. TABELA DE LOGS DE ADMIN (ADMIN_LOGS)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES customers(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin pode ver logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admin pode criar logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- =====================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_customer_id ON favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Índices para cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);

-- Índices para inspiration_looks
CREATE INDEX IF NOT EXISTS idx_inspiration_looks_is_active ON inspiration_looks(is_active);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Database setup completo para Marisol E-Commerce
-- Todas as tabelas criadas com RLS habilitado
-- Políticas de segurança configuradas
-- Índices criados para melhor performance
-- =====================================================
