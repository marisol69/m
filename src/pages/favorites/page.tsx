import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';

export default function FavoritesPage() {
  const { t } = useTranslation('common');
  const { favorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default:
        return 0;
    }
  });

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <Header />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative mb-12 bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-pink-400 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-400 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="ri-heart-line text-4xl text-white"></i>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                Os Seus Favoritos
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Guarde os produtos que mais adora e adicione-os ao carrinho quando estiver pronta
              </p>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-heart-line text-6xl text-pink-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Ainda não tem favoritos
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Explore os nossos produtos e adicione os seus favoritos clicando no ícone de coração
              </p>
              <Link
                to="/products"
                className="inline-block px-8 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full hover:from-pink-500 hover:to-rose-500 transition-all text-base font-medium whitespace-nowrap cursor-pointer shadow-lg"
              >
                Explorar Produtos
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    {favorites.length} {favorites.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer"
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="price-asc">Preço: Menor para Maior</option>
                    <option value="price-desc">Preço: Maior para Menor</option>
                    <option value="name">Nome A-Z</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedFavorites.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100"
                  >
                    <Link to={`/product/${product.id}`} className="block relative">
                      <div className="relative w-full h-80 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-pink-500 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xl font-bold text-pink-500">
                          €{product.price.toFixed(2)}
                        </p>
                        {product.category && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {product.category}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-shopping-cart-line mr-2"></i>
                          Adicionar
                        </button>
                        <button
                          onClick={() => removeFromFavorites(product.id)}
                          className="px-4 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
