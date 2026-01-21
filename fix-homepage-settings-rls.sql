-- ============================================
-- FIX: Políticas RLS para homepage_settings
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ============================================

-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow admin to insert homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow admin to update homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow admin to select homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow public to read homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow public read homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow authenticated insert homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow authenticated update homepage_settings" ON homepage_settings;
DROP POLICY IF EXISTS "Allow authenticated delete homepage_settings" ON homepage_settings;

-- 2. Habilitar RLS
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas corretas

-- Permitir leitura pública (para o site)
CREATE POLICY "Public can read homepage_settings"
ON homepage_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Authenticated can insert homepage_settings"
ON homepage_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "Authenticated can update homepage_settings"
ON homepage_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir DELETE para usuários autenticados
CREATE POLICY "Authenticated can delete homepage_settings"
ON homepage_settings
FOR DELETE
TO authenticated
USING (true);

-- 4. Verificar se a tabela tem a estrutura correta
-- Se não tiver, criar a coluna key como UNIQUE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'homepage_settings_key_key'
    ) THEN
        ALTER TABLE homepage_settings ADD CONSTRAINT homepage_settings_key_key UNIQUE (key);
    END IF;
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar, volte ao Dashboard e tente salvar novamente!
-- ============================================
