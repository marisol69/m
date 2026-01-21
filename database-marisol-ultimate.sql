-- ============================================
-- MARISOL - BASE DE DADOS COMPLETA E OTIMIZADA
-- ============================================

-- Tabelas de Envio e IVA
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir países da União Europeia com taxas de IVA
INSERT INTO tax_rates (country_code, country_name, tax_rate, is_active) VALUES
('PT', 'Portugal', 23.00, true),
('ES', 'Espanha', 21.00, true),
('FR', 'França', 20.00, true),
('DE', 'Alemanha', 19.00, true),
('IT', 'Itália', 22.00, true),
('LU', 'Luxemburgo', 17.00, true),
('BE', 'Bélgica', 21.00, true),
('NL', 'Países Baixos', 21.00, true),
('AT', 'Áustria', 20.00, true),
('IE', 'Irlanda', 23.00, true),
('GR', 'Grécia', 24.00, true),
('PL', 'Polónia', 23.00, true),
('CZ', 'República Checa', 21.00, true),
('HU', 'Hungria', 27.00, true),
('RO', 'Roménia', 19.00, true),
('BG', 'Bulgária', 20.00, true),
('HR', 'Croácia', 25.00, true),
('SK', 'Eslováquia', 20.00, true),
('SI', 'Eslovénia', 22.00, true),
('LT', 'Lituânia', 21.00, true),
('LV', 'Letónia', 21.00, true),
('EE', 'Estónia', 20.00, true),
('CY', 'Chipre', 19.00, true),
('MT', 'Malta', 18.00, true),
('DK', 'Dinamarca', 25.00, true),
('SE', 'Suécia', 25.00, true),
('FI', 'Finlândia', 24.00, true)
ON CONFLICT (country_code) DO NOTHING;

-- Criar zona de envio padrão para UE
INSERT INTO shipping_zones (name, countries, cost, free_shipping_threshold, is_active) VALUES
('União Europeia', ARRAY['PT','ES','FR','DE','IT','LU','BE','NL','AT','IE','GR','PL','CZ','HU','RO','BG','HR','SK','SI','LT','LV','EE','CY','MT','DK','SE','FI'], 5.99, 50.00, true)
ON CONFLICT DO NOTHING;

-- Adicionar campos de variantes aos produtos (se não existirem)
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_variant JSONB DEFAULT '{}';

-- Adicionar campo source aos produtos para WooCommerce
ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);

-- Habilitar RLS
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para shipping_zones
DROP POLICY IF EXISTS "Todos podem ver zonas de envio" ON shipping_zones;
CREATE POLICY "Todos podem ver zonas de envio" ON shipping_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins podem modificar zonas" ON shipping_zones;
CREATE POLICY "Apenas admins podem modificar zonas" ON shipping_zones FOR ALL USING (
  auth.jwt() ->> 'email' IN (SELECT email FROM customers WHERE is_admin = true)
);

-- Políticas RLS para tax_rates
DROP POLICY IF EXISTS "Todos podem ver taxas de IVA" ON tax_rates;
CREATE POLICY "Todos podem ver taxas de IVA" ON tax_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins podem modificar taxas" ON tax_rates;
CREATE POLICY "Apenas admins podem modificar taxas" ON tax_rates FOR ALL USING (
  auth.jwt() ->> 'email' IN (SELECT email FROM customers WHERE is_admin = true)
);

-- Atualizar tabela de encomendas com campos de IVA
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;

-- Função para calcular IVA automaticamente
CREATE OR REPLACE FUNCTION calculate_order_tax()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate_value DECIMAL(5,2);
BEGIN
  -- Buscar taxa de IVA do país
  SELECT tax_rate INTO tax_rate_value
  FROM tax_rates
  WHERE country_code = NEW.country_code AND is_active = true;
  
  -- Se não encontrar, usar 0
  IF tax_rate_value IS NULL THEN
    tax_rate_value := 0;
  END IF;
  
  -- Calcular valores
  NEW.tax_rate := tax_rate_value;
  NEW.subtotal := NEW.total / (1 + (tax_rate_value / 100));
  NEW.tax_amount := NEW.total - NEW.subtotal;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular IVA automaticamente
DROP TRIGGER IF EXISTS trigger_calculate_order_tax ON orders;
CREATE TRIGGER trigger_calculate_order_tax
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.country_code IS NOT NULL)
  EXECUTE FUNCTION calculate_order_tax();

-- Comentários para documentação
COMMENT ON TABLE shipping_zones IS 'Zonas de envio com custos e países';
COMMENT ON TABLE tax_rates IS 'Taxas de IVA por país da União Europeia';
COMMENT ON COLUMN products.colors IS 'Array de cores disponíveis para o produto';
COMMENT ON COLUMN products.sizes IS 'Array de tamanhos disponíveis para o produto';
COMMENT ON COLUMN products.stock_by_variant IS 'Stock por variante (cor + tamanho)';
COMMENT ON COLUMN products.source IS 'Origem do produto: manual, woocommerce, shopify';
COMMENT ON COLUMN orders.tax_amount IS 'Valor do IVA cobrado';
COMMENT ON COLUMN orders.tax_rate IS 'Taxa de IVA aplicada (%)';
COMMENT ON COLUMN orders.subtotal IS 'Subtotal sem IVA';

-- ============================================
-- FIM DA BASE DE DADOS
-- ============================================
