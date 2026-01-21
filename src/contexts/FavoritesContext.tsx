import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addToFavorites: (item: FavoriteItem) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFavoritesFromSupabase();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const loadFavoritesFromSupabase = async () => {
    if (!user) return;

    try {
      const { data: favoritesData, error } = await supabase
        .from('favorites')
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

      if (favoritesData) {
        const favoritesFormatted = favoritesData.map((fav: any) => {
          const product = fav.products;
          if (!product) return null;

          return {
            id: product.id,
            name: product.name_pt || product.name_en || product.name_fr || product.name_de || 'Produto',
            price: product.sale_price || product.price,
            image: product.images?.[0] || '',
          };
        }).filter(Boolean) as FavoriteItem[];

        setFavorites(favoritesFormatted);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  const addToFavorites = async (item: FavoriteItem) => {
    if (!user) {
      alert('Por favor, faça login para adicionar produtos aos favoritos.');
      return;
    }

    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', item.id)
        .maybeSingle();

      if (existing) {
        return;
      }

      // Adicionar ao Supabase
      const { error } = await supabase
        .from('favorites')
        .insert([
          {
            user_id: user.id,
            product_id: item.id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      // Adicionar ao estado local
      setFavorites((prev) => {
        const exists = prev.find((fav) => fav.id === item.id);
        if (exists) return prev;
        return [...prev, item];
      });
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
      alert('Erro ao adicionar aos favoritos. Por favor, tente novamente.');
    }
  };

  const removeFromFavorites = async (id: string) => {
    if (!user) return;

    try {
      // Remover do Supabase
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);

      if (error) throw error;

      // Remover do estado local
      setFavorites((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
      alert('Erro ao remover dos favoritos. Por favor, tente novamente.');
    }
  };

  const isFavorite = (id: string) => {
    return favorites.some((item) => item.id === id);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites, isFavorite, clearFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
