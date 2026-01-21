-- ============================================
-- SQL PARA CORRIGIR A TABELA SITE_SETTINGS
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Passo 1: Adicionar colunas que faltam (se não existirem)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Marisol',
ADD COLUMN IF NOT EXISTS store_email TEXT DEFAULT 'contacto@marisol.com',
ADD COLUMN IF NOT EXISTS store_phone TEXT DEFAULT '+352 631 377 168',
ADD COLUMN IF NOT EXISTS store_whatsapp TEXT DEFAULT '+352631377168',
ADD COLUMN IF NOT EXISTS store_address TEXT DEFAULT 'Luxembourg',
ADD COLUMN IF NOT EXISTS business_hours TEXT DEFAULT 'Seg-Sex: 8:30-18:00',
ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT 'https://facebook.com',
ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com',
ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT 'https://twitter.com',
ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT 'https://linkedin.com',
ADD COLUMN IF NOT EXISTS pinterest_url TEXT DEFAULT 'https://pinterest.com',
ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,2) DEFAULT 80.00,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 17.00;

-- Passo 2: Verificar se já existe algum registo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1) THEN
    -- Inserir dados padrão se a tabela estiver vazia
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
    ) VALUES (
      'Marisol',
      'contacto@marisol.com',
      '+352 631 377 168',
      '+352631377168',
      'Luxembourg',
      'Seg-Sex: 8:30-18:00',
      'https://facebook.com/marisol',
      'https://instagram.com/marisol',
      'https://twitter.com/marisol',
      'https://linkedin.com/company/marisol',
      'https://pinterest.com/marisol',
      80.00,
      'EUR',
      17.00
    );
  END IF;
END $$;

-- Passo 3: Atualizar registos existentes com valores padrão (se estiverem NULL)
UPDATE site_settings
SET 
  store_name = COALESCE(store_name, 'Marisol'),
  store_email = COALESCE(store_email, 'contacto@marisol.com'),
  store_phone = COALESCE(store_phone, '+352 631 377 168'),
  store_whatsapp = COALESCE(store_whatsapp, '+352631377168'),
  store_address = COALESCE(store_address, 'Luxembourg'),
  business_hours = COALESCE(business_hours, 'Seg-Sex: 8:30-18:00'),
  facebook_url = COALESCE(facebook_url, 'https://facebook.com/marisol'),
  instagram_url = COALESCE(instagram_url, 'https://instagram.com/marisol'),
  twitter_url = COALESCE(twitter_url, 'https://twitter.com/marisol'),
  linkedin_url = COALESCE(linkedin_url, 'https://linkedin.com/company/marisol'),
  pinterest_url = COALESCE(pinterest_url, 'https://pinterest.com/marisol'),
  free_shipping_threshold = COALESCE(free_shipping_threshold, 80.00),
  currency = COALESCE(currency, 'EUR'),
  tax_rate = COALESCE(tax_rate, 17.00);

-- Passo 4: Verificar políticas RLS (se não existirem)
DO $$
BEGIN
  -- Habilitar RLS se não estiver habilitado
  ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
  
  -- Criar política de leitura pública (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'site_settings' 
    AND policyname = 'Permitir leitura pública de configurações'
  ) THEN
    CREATE POLICY "Permitir leitura pública de configurações"
      ON site_settings
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Criar política de atualização para admin (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'site_settings' 
    AND policyname = 'Permitir admin atualizar configurações'
  ) THEN
    CREATE POLICY "Permitir admin atualizar configurações"
      ON site_settings
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM customers
          WHERE customers.id = auth.uid()
          AND customers.role = 'admin'
        )
      );
  END IF;

  -- Criar política de inserção para admin (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'site_settings' 
    AND policyname = 'Permitir admin inserir configurações'
  ) THEN
    CREATE POLICY "Permitir admin inserir configurações"
      ON site_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM customers
          WHERE customers.id = auth.uid()
          AND customers.role = 'admin'
        )
      );
  END IF;
END $$;

-- Passo 5: Criar índice (se não existir)
CREATE INDEX IF NOT EXISTS idx_site_settings_id ON site_settings(id);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, volte ao Dashboard Admin
-- e tente guardar as configurações novamente!
-- ============================================
