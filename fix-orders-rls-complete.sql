-- ============================================
-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS
-- Para Tabelas: orders e order_items
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Vá ao Supabase Dashboard
-- 2. Navegue até: SQL Editor
-- 3. Copie e cole este script completo
-- 4. Execute o script
-- 5. Volte ao dashboard da Marisol e teste novamente
--
-- ============================================

-- ============================================
-- PASSO 1: REMOVER POLÍTICAS ANTIGAS (ORDERS)
-- ============================================

DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON orders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON orders;

-- ============================================
-- PASSO 2: CRIAR NOVAS POLÍTICAS (ORDERS)
-- ============================================

-- Política de INSERT - Permite:
-- ✅ Inserções sem autenticação (checkout convidado + admin dashboard)
-- ✅ Usuários autenticados criar suas próprias encomendas
CREATE POLICY "orders_insert_policy" ON orders
FOR INSERT
WITH CHECK (
  auth.uid() IS NULL
  OR
  auth.uid() = customer_id
);

-- Política de SELECT - Permite:
-- ✅ Acesso sem autenticação (admin dashboard)
-- ✅ Usuários ver suas próprias encomendas
CREATE POLICY "orders_select_policy" ON orders
FOR SELECT
USING (
  auth.uid() IS NULL
  OR
  auth.uid() = customer_id
);

-- Política de UPDATE - Permite:
-- ✅ Atualizar sem autenticação (admin dashboard)
-- ✅ Usuários atualizar suas próprias encomendas
CREATE POLICY "orders_update_policy" ON orders
FOR UPDATE
USING (
  auth.uid() IS NULL
  OR
  auth.uid() = customer_id
)
WITH CHECK (
  auth.uid() IS NULL
  OR
  auth.uid() = customer_id
);

-- Política de DELETE - Permite:
-- ✅ Deletar sem autenticação (admin dashboard)
-- ✅ Usuários deletar suas próprias encomendas
CREATE POLICY "orders_delete_policy" ON orders
FOR DELETE
USING (
  auth.uid() IS NULL
  OR
  auth.uid() = customer_id
);

-- ============================================
-- PASSO 3: REMOVER POLÍTICAS ANTIGAS (ORDER_ITEMS)
-- ============================================

DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable update for users based on order" ON order_items;
DROP POLICY IF EXISTS "Enable delete for users based on order" ON order_items;

-- ============================================
-- PASSO 4: CRIAR NOVAS POLÍTICAS (ORDER_ITEMS)
-- ============================================

-- Política de INSERT - Permite:
-- ✅ Inserções sem autenticação (checkout + admin)
-- ✅ Usuários inserir items nas suas encomendas
CREATE POLICY "order_items_insert_policy" ON order_items
FOR INSERT
WITH CHECK (
  auth.uid() IS NULL
  OR
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Política de SELECT - Permite:
-- ✅ Acesso sem autenticação (admin dashboard)
-- ✅ Usuários ver items das suas encomendas
CREATE POLICY "order_items_select_policy" ON order_items
FOR SELECT
USING (
  auth.uid() IS NULL
  OR
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Política de UPDATE - Permite:
-- ✅ Atualizar sem autenticação (admin)
-- ✅ Usuários atualizar items das suas encomendas
CREATE POLICY "order_items_update_policy" ON order_items
FOR UPDATE
USING (
  auth.uid() IS NULL
  OR
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NULL
  OR
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Política de DELETE - Permite:
-- ✅ Deletar sem autenticação (admin)
-- ✅ Usuários deletar items das suas encomendas
CREATE POLICY "order_items_delete_policy" ON order_items
FOR DELETE
USING (
  auth.uid() IS NULL
  OR
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- ============================================
-- CONFIRMAÇÃO
-- ============================================

SELECT 
  '✅ POLÍTICAS RLS ATUALIZADAS COM SUCESSO!' as status,
  'As encomendas de teste agora podem ser criadas no dashboard.' as message;
