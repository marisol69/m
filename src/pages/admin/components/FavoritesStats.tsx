import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface FavoritesStatsProps {
  darkMode: boolean;
}

export default function FavoritesStats({ darkMode }: FavoritesStatsProps) {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoritesData();
  }, []);

  const loadFavoritesData = async () => {
    setLoading(true);
    try {
      const [favoritesData, productsData] = await Promise.all([
        supabase.from('favorites').select('*'),
        supabase.from('products').select('*'),
      ]);

      if (favoritesData.data && productsData.data) {
        const favoriteCounts: { [key: string]: number } = {};
        favoritesData.data.forEach(fav => {
          favoriteCounts[fav.product_id] = (favoriteCounts[fav.product_id] || 0) + 1;
        });

        const topProductIds = Object.entries(favoriteCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([id, count]) => ({ id, count }));

        const topProds = topProductIds.map(({ id, count }) => {
          const product = productsData.data.find(p => p.id === id);
          return { ...product, favoriteCount: count };
        }).filter(p => p.id);

        setTopProducts(topProds);

        const categoryCounts: { [key: string]: number } = {};
        topProds.forEach(product => {
          if (product.category) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + product.favoriteCount;
          }
        });

        const topCats = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));

        setTopCategories(topCats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin"></i>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Estatísticas de Gostos
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Produtos mais desejados pelos clientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Mais Adicionados aos Gostos */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="ri-heart-fill text-pink-500 mr-2"></i>
            Top 10 Produtos Mais Desejados
          </h2>
          {topProducts.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum produto nos favoritos ainda
            </p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className={`flex items-center gap-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-blue-100 text-blue-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-pink-100 text-pink-700'
                  }`}>
                    {index + 1}
                  </div>
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {product.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-pink-500">{product.favoriteCount}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>gostos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorias Mais Populares */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="ri-folder-line text-purple-500 mr-2"></i>
            Categorias Mais Populares
          </h2>
          {topCategories.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhuma categoria ainda
            </p>
          ) : (
            <div className="space-y-4">
              {topCategories.map((cat, index) => (
                <div key={cat.category} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-purple-100 text-purple-700' :
                        index === 1 ? 'bg-blue-100 text-blue-700' :
                        index === 2 ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {cat.category}
                      </p>
                    </div>
                    <p className="font-bold text-pink-500">{cat.count} gostos</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${(cat.count / topCategories[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border`}>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
              <i className="ri-lightbulb-line mr-2"></i>
              Dica de Marketing
            </h3>
            <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>
              Use estes dados para criar campanhas direcionadas e promoções especiais nas categorias mais desejadas!
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <i className="ri-heart-line text-2xl text-pink-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {topProducts.reduce((sum, p) => sum + p.favoriteCount, 0)}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total de Gostos</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i className="ri-star-line text-2xl text-purple-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {topProducts.length}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Produtos com Gostos</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="ri-folder-line text-2xl text-blue-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {topCategories.length}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Categorias Populares</p>
        </div>
      </div>
    </div>
  );
}
