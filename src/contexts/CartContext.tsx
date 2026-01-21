import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Carregar carrinho do Supabase quando o usuário faz login
  useEffect(() => {
    if (user) {
      loadCartFromSupabase();
    } else {
      // Limpar carrinho quando faz logout
      setItems([]);
    }
  }, [user]);

  const loadCartFromSupabase = async () => {
    if (!user) return;

    try {
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name_pt,
            name_en,
            name_fr,
            name_de,
            price,
            sale_price,
            images,
            stock
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (cartItems) {
        const cartItemsFormatted = cartItems.map((cartItem: any) => {
          const product = cartItem.products;
          if (!product) return null;

          return {
            id: product.id,
            name: product.name_pt || product.name_en || product.name_fr || product.name_de || 'Produto',
            price: product.sale_price || product.price,
            image: product.images?.[0] || '',
            quantity: cartItem.quantity,
            size: cartItem.size,
            color: cartItem.color,
          };
        }).filter(Boolean) as CartItem[];

        setItems(cartItemsFormatted);
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
  };

  const saveCartToSupabase = async () => {
    if (!user) return;

    try {
      // Deletar itens antigos do carrinho do usuário
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Inserir novos itens (apenas as referências, não os dados completos)
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => {
          // Extrair apenas o UUID do produto (primeiros 36 caracteres)
          // Formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres)
          const productId = item.id.length > 36 ? item.id.substring(0, 36) : item.id;
          
          return {
            user_id: user.id,
            product_id: productId, // Usar apenas o UUID limpo
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
          };
        });

        const { error } = await supabase
          .from('cart_items')
          .insert(itemsToInsert);

        if (error) {
          console.error('Erro ao inserir no carrinho:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  // Salvar carrinho sempre que mudam (com debounce para evitar excesso de chamadas)
  useEffect(() => {
    if (user && items.length >= 0) {
      const timeoutId = setTimeout(() => {
        saveCartToSupabase();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [items, user]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (i) => i.id === item.id && i.size === item.size && i.color === item.color
      );

      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }

      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === id && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
