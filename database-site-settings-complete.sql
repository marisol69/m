-- ============================================
-- CONFIGURAÇÃO COMPLETA DA TABELA SITE_SETTINGS
-- ============================================

-- 1. Remover a tabela se já existir (cuidado: isto apaga todos os dados!)
DROP TABLE IF EXISTS site_settings CASCADE;

-- 2. Criar a tabela site_settings
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Marisol',
  store_email TEXT NOT NULL DEFAULT 'contacto@marisol.com',
  store_phone TEXT DEFAULT '+352 631 377 168',
  store_whatsapp TEXT DEFAULT '+352631377168',
  store_address TEXT DEFAULT 'Luxembourg',
  business_hours TEXT DEFAULT 'Seg-Sex: 8:30-18:00',
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

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso público
CREATE POLICY "Permitir leitura pública"
ON site_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir inserção pública"
ON site_settings FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública"
ON site_settings FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 5. Inserir dados iniciais
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
  'https://facebook.com',
  'https://instagram.com',
  'https://twitter.com',
  'https://linkedin.com',
  'https://pinterest.com',
  80.00,
  'EUR',
  17.00
);

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar updated_at
CREATE TRIGGER site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_site_settings_updated_at();

-- ============================================
-- CONFIGURAÇÃO CONCLUÍDA!
-- ============================================
-- Agora pode voltar ao painel de administração
-- e guardar as configurações sem problemas.
-- ============================================
