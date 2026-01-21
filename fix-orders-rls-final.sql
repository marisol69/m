-- ============================================
-- FIX: Políticas RLS para Tabela ORDERS
-- ============================================
-- Este script corrige o erro de RLS ao criar encomendas no dashboard
-- Execute este código no SQL Editor do Supabase

-- 1. DESABILITAR RLS temporariamente para configuração
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 2. REABILITAR RLS com políticas corretas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA TABELA ORDERS

-- Permitir INSERT (criar encomendas)
CREATE POLICY IF NOT EXISTS "Permitir inserção de encomendas"
ON orders
FOR INSERT
TO public
WITH CHECK (true);

-- Permitir SELECT (visualizar encomendas)
CREATE POLICY IF NOT EXISTS "Permitir visualização de encomendas"
ON orders
FOR SELECT
TO public
USING (true);

-- Permitir UPDATE (atualizar encomendas)
CREATE POLICY IF NOT EXISTS "Permitir atualização de encomendas"
ON orders
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Permitir DELETE (eliminar encomendas)
CREATE POLICY IF NOT EXISTS "Permitir eliminação de encomendas"
ON orders
FOR DELETE
TO public
USING (true);

-- 4. POLÍTICAS PARA TABELA ORDER_ITEMS

-- Permitir INSERT (criar itens de encomenda)
CREATE POLICY IF NOT EXISTS "Permitir inserção de itens de encomenda"
ON order_items
FOR INSERT
TO public
WITH CHECK (true);

-- Permitir SELECT (visualizar itens)
CREATE POLICY IF NOT EXISTS "Permitir visualização de itens de encomenda"
ON order_items
FOR SELECT
TO public
USING (true);

-- Permitir UPDATE (atualizar itens)
CREATE POLICY IF NOT EXISTS "Permitir atualização de itens de encomenda"
ON order_items
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Permitir DELETE (eliminar itens)
CREATE POLICY IF NOT EXISTS "Permitir eliminação de itens de encomenda"
ON order_items
FOR DELETE
TO public
USING (true);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, teste novamente a criação de encomendas no dashboard
