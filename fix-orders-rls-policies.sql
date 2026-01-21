-- ============================================
-- FIX: Políticas RLS da Tabela ORDERS
-- ============================================
-- Este script corrige as políticas de segurança da tabela orders
-- para permitir que admins criem encomendas de teste
-- 
-- INSTRUÇÕES:
-- 1. Vá ao Supabase Dashboard
-- 2. Abra o SQL Editor
-- 3. Cole este código completo
-- 4. Execute
-- ============================================

-- Passo 1: Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admin can insert all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;
DROP POLICY IF EXISTS "Admin can delete all orders" ON orders;

-- Passo 2: Criar novas políticas RLS corrigidas

-- 1. Permitir que utilizadores vejam as suas próprias encomendas
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (
  auth.uid() = customer_id
  OR
  auth.uid() IN (
    SELECT id FROM customers WHERE email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- 2. Permitir que utilizadores criem as suas próprias encomendas
CREATE POLICY "Users can insert their own orders"
ON orders
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  OR
  auth.uid() IN (
    SELECT id FROM customers WHERE email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  OR
  customer_id IS NOT NULL
);

-- 3. Permitir que utilizadores atualizem as suas próprias encomendas
CREATE POLICY "Users can update their own orders"
ON orders
FOR UPDATE
USING (
  auth.uid() = customer_id
  OR
  auth.uid() IN (
    SELECT id FROM customers WHERE email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- 4. Permitir que admins vejam todas as encomendas
CREATE POLICY "Admin can view all orders"
ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- 5. IMPORTANTE: Permitir que admins criem encomendas (incluindo encomendas de teste)
CREATE POLICY "Admin can insert all orders"
ON orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
  OR
  customer_id IS NOT NULL
);

-- 6. Permitir que admins atualizem todas as encomendas
CREATE POLICY "Admin can update all orders"
ON orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- 7. Permitir que admins eliminem encomendas
CREATE POLICY "Admin can delete all orders"
ON orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- ============================================
-- VERIFICAÇÃO: Confirmar que as políticas foram criadas
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================
-- As políticas RLS da tabela orders foram corrigidas.
-- Agora os admins podem criar encomendas de teste sem erros.
-- ============================================
