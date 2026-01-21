import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  isScrolled?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  discount_price: number | null;
  image_url: string;
  images: string[];
  category_id: string;
  subcategory_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export const SearchBar = ({ value, onChange, onSubmit, placeholder, isScrolled = true }: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const popularSearches = [
    'vestidos',
    'mala preta',
    'sapatos',
    'perfume',
    'maquilhagem',
    'acessórios',
  ];

  // 🧠 PALAVRAS-CHAVE INTELIGENTES - Mapeia termos para categorias de produtos
  const smartKeywords: Record<string, string[]> = {
    'vestido': ['vestido', 'dress', 'robe', 'kleid'],
    'vestidos': ['vestido', 'dress', 'robe', 'kleid'],
    'mala': ['mala', 'bolsa', 'bag', 'sac', 'tasche'],
    'malas': ['mala', 'bolsa', 'bag', 'sac', 'tasche'],
    'bolsa': ['mala', 'bolsa', 'bag', 'sac', 'tasche'],
    'bolsas': ['mala', 'bolsa', 'bag', 'sac', 'tasche'],
    'sapato': ['sapato', 'shoe', 'chaussure', 'schuh', 'ténis', 'bota'],
    'sapatos': ['sapato', 'shoe', 'chaussure', 'schuh', 'ténis', 'bota'],
    'ténis': ['ténis', 'sneaker', 'sapato', 'shoe'],
    'bota': ['bota', 'boot', 'sapato'],
    'botas': ['bota', 'boot', 'sapato'],
    'perfume': ['perfume', 'fragrance', 'parfum'],
    'perfumes': ['perfume', 'fragrance', 'parfum'],
    'maquilhagem': ['maquilhagem', 'makeup', 'maquillage', 'cosmetic'],
    'makeup': ['maquilhagem', 'makeup', 'maquillage', 'cosmetic'],
    'cosmético': ['maquilhagem', 'makeup', 'cosmetic', 'beauty'],
    'acessório': ['acessório', 'accessory', 'bijuteria', 'joia'],
    'acessórios': ['acessório', 'accessory', 'bijuteria', 'joia'],
    'joia': ['joia', 'jewelry', 'acessório', 'bijuteria'],
    'joias': ['joia', 'jewelry', 'acessório', 'bijuteria'],
    'colar': ['colar', 'necklace', 'joia', 'acessório'],
    'brinco': ['brinco', 'earring', 'joia', 'acessório'],
    'brincos': ['brinco', 'earring', 'joia', 'acessório'],
    'anel': ['anel', 'ring', 'joia', 'acessório'],
    'anéis': ['anel', 'ring', 'joia', 'acessório'],
    'pulseira': ['pulseira', 'bracelet', 'joia', 'acessório'],
    'camisa': ['camisa', 'shirt', 'blusa', 'top'],
    'camisas': ['camisa', 'shirt', 'blusa', 'top'],
    'blusa': ['blusa', 'top', 'camisa', 'shirt'],
    'blusas': ['blusa', 'top', 'camisa', 'shirt'],
    'calça': ['calça', 'pants', 'jean', 'trouser'],
    'calças': ['calça', 'pants', 'jean', 'trouser'],
    'jean': ['jean', 'calça', 'denim', 'pants'],
    'jeans': ['jean', 'calça', 'denim', 'pants'],
    'saia': ['saia', 'skirt', 'jupe'],
    'saias': ['saia', 'skirt', 'jupe'],
    'casaco': ['casaco', 'jacket', 'coat', 'veste'],
    'casacos': ['casaco', 'jacket', 'coat', 'veste'],
    'jacket': ['casaco', 'jacket', 'coat'],
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔥 PESQUISA SUPER INTELIGENTE COM KEYWORDS
  useEffect(() => {
    const searchProductsAndCategories = async () => {
      if (value.length >= 2) {
        setLoading(true);
        const query = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        try {
          // 🔍 BUSCAR TODOS OS PRODUTOS
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name_pt, name_en, name_fr, name_de, price, sale_price, discount_price, image_url, images, category_id, subcategory_id')
            .eq('is_active', true);

          if (!productsError && productsData) {
            // 🧠 SISTEMA DE PONTUAÇÃO INTELIGENTE
            const scoredProducts = productsData
              .map(p => {
                const product = {
                  id: p.id,
                  name: p.name_pt || p.name_en || p.name_fr || p.name_de || 'Produto',
                  price: p.price,
                  sale_price: p.sale_price,
                  discount_price: p.discount_price,
                  image_url: p.image_url,
                  images: p.images || [],
                  category_id: p.category_id,
                  subcategory_id: p.subcategory_id,
                };

                const name = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                let score = 0;

                // 🎯 PONTUAÇÃO POR CORRESPONDÊNCIA EXATA
                if (name === query) {
                  score = 1000; // Correspondência exata = máxima prioridade
                }
                // 🎯 PONTUAÇÃO POR INÍCIO DO NOME
                else if (name.startsWith(query)) {
                  score = 500; // Começa com o termo = alta prioridade
                }
                // 🎯 PONTUAÇÃO POR INCLUSÃO PARCIAL
                else if (name.includes(query)) {
                  score = 100; // Contém o termo = boa prioridade
                }
                // 🧠 PONTUAÇÃO POR PALAVRAS-CHAVE INTELIGENTES
                else {
                  const keywords = smartKeywords[query] || [];
                  for (const keyword of keywords) {
                    const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    if (name.includes(normalizedKeyword)) {
                      score = 50; // Palavra-chave relacionada = prioridade média
                      break;
                    }
                  }
                }

                // 🎯 PONTUAÇÃO ADICIONAL POR SIMILARIDADE DE PALAVRAS
                if (score === 0) {
                  const queryWords = query.split(' ');
                  const nameWords = name.split(' ');
                  
                  for (const qWord of queryWords) {
                    if (qWord.length >= 3) { // Apenas palavras com 3+ letras
                      for (const nWord of nameWords) {
                        // Verifica se palavras compartilham 70%+ dos caracteres
                        if (nWord.includes(qWord.substring(0, Math.ceil(qWord.length * 0.7)))) {
                          score = 25; // Similaridade parcial = baixa prioridade
                          break;
                        }
                      }
                    }
                  }
                }

                return { product, score };
              })
              .filter(item => item.score > 0) // Apenas produtos com alguma relevância
              .sort((a, b) => b.score - a.score) // Ordenar por relevância
              .slice(0, 8) // Top 8 resultados
              .map(item => item.product);

            setFilteredProducts(scoredProducts);
          }

          // 🔍 BUSCAR CATEGORIAS
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name, icon, slug')
            .limit(20);

          if (!categoriesError && categoriesData) {
            const filteredCats = categoriesData.filter(cat => {
              const name = cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return name.includes(query);
            }).slice(0, 3);

            setFilteredCategories(filteredCats);
          }

          setShowSuggestions(true);
        } catch (error) {
          console.error('Erro ao buscar:', error);
        } finally {
          setLoading(false);
        }
      } else if (value.length === 0) {
        // Mostrar produtos populares quando vazio
        try {
          const { data: productsData, error } = await supabase
            .from('products')
            .select('id, name_pt, name_en, name_fr, name_de, price, sale_price, discount_price, image_url, images, category_id, subcategory_id')
            .eq('is_active', true)
            .limit(5);

          if (!error && productsData) {
            const formatted = productsData.map(p => ({
              id: p.id,
              name: p.name_pt || p.name_en || p.name_fr || p.name_de || 'Produto',
              price: p.price,
              sale_price: p.sale_price,
              discount_price: p.discount_price,
              image_url: p.image_url,
              images: p.images || [],
              category_id: p.category_id,
              subcategory_id: p.subcategory_id,
            }));
            setFilteredProducts(formatted);
          }
        } catch (error) {
          console.error('Erro ao buscar produtos populares:', error);
        }
        setFilteredCategories([]);
      } else {
        setFilteredProducts([]);
        setFilteredCategories([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchProductsAndCategories();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleProductClick = () => {
    setShowSuggestions(false);
    onChange('');
  };

  const handleCategoryClick = (categorySlug: string) => {
    setShowSuggestions(false);
    onChange('');
    navigate(`/products?category=${categorySlug}`);
  };

  const handlePopularSearchClick = (search: string) => {
    onChange(search);
    setShowSuggestions(false);
    navigate(`/products?search=${search}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      navigate(`/products?search=${value}`);
      setShowSuggestions(false);
    }
  };

  // Calcular preço final (com desconto se existir)
  const getFinalPrice = (product: Product) => {
    return product.sale_price || product.discount_price || product.price;
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length === 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:border-pink-400 dark:focus:border-pink-400 text-sm transition-colors ${
            isScrolled 
              ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400' 
              : 'bg-white/10 border-white/30 text-white placeholder-white/70 backdrop-blur-sm'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-pink-400 dark:hover:text-pink-400 transition-colors ${
            isScrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white'
          }`}
        >
          <i className={`${loading ? 'ri-loader-4-line animate-spin' : 'ri-search-line'} text-lg`}></i>
        </button>
      </form>

      {/* 🎯 SUGESTÕES EM TEMPO REAL COM MINIATURAS */}
      {showSuggestions && (filteredProducts.length > 0 || filteredCategories.length > 0 || value.length === 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {/* PRODUTOS COM MINIATURAS */}
          {filteredProducts.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-2">
                {value.length >= 2 ? `Produtos encontrados (${filteredProducts.length})` : 'Produtos Populares'}
              </p>
              {filteredProducts.map((product) => {
                const finalPrice = getFinalPrice(product);
                const hasDiscount = product.sale_price || product.discount_price;
                const imageUrl = product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                
                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={handleProductClick}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {/* 🖼️ MINIATURA DO PRODUTO */}
                    <div className="w-14 h-14 flex-shrink-0 relative">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover object-top rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {hasDiscount ? (
                          <>
                            <p className="text-sm font-bold text-pink-500 dark:text-pink-400">€{finalPrice.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 line-through">€{product.price.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-pink-500 dark:text-pink-400">€{product.price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 dark:text-gray-500"></i>
                  </Link>
                );
              })}
            </div>
          )}

          {/* CATEGORIAS */}
          {filteredCategories.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-2">Categorias</p>
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-left"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg flex-shrink-0">
                    <i className={`${category.icon} text-xl text-pink-500 dark:text-pink-400`}></i>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{category.name}</p>
                  <i className="ri-arrow-right-s-line text-gray-400 dark:text-gray-500 ml-auto"></i>
                </button>
              ))}
            </div>
          )}

          {/* PESQUISAS POPULARES */}
          {value.length === 0 && (
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-2">Pesquisas Populares</p>
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handlePopularSearchClick(search)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <i className="ri-search-line text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{search}</p>
                </button>
              ))}
            </div>
          )}

          {/* SEM RESULTADOS - MOSTRAR SUGESTÕES */}
          {value.length >= 2 && filteredProducts.length === 0 && filteredCategories.length === 0 && !loading && (
            <div className="p-6">
              {/* Mensagem de sem resultados */}
              <div className="text-center mb-6">
                <i className="ri-search-line text-4xl text-gray-300 dark:text-slate-600 mb-3"></i>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Não encontrámos resultados para
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  "{value}"
                </p>
              </div>

              {/* Produtos sugeridos */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Produtos que pode gostar
                </h3>
                <div className="space-y-2">
                  {filteredProducts.slice(0, 5).map((product) => {
                    const finalPrice = getFinalPrice(product);
                    const hasDiscount = product.sale_price || product.discount_price;
                    const imageUrl = product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                    
                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={handleProductClick}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        {/* 🖼️ MINIATURA DO PRODUTO */}
                        <div className="w-14 h-14 flex-shrink-0 relative">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover object-top rounded-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {hasDiscount ? (
                              <>
                                <p className="text-sm font-bold text-pink-500 dark:text-pink-400">€{finalPrice.toFixed(2)}</p>
                                <p className="text-xs text-gray-400 line-through">€{product.price.toFixed(2)}</p>
                              </>
                            ) : (
                              <p className="text-sm font-bold text-pink-500 dark:text-pink-400">€{product.price.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <i className="ri-arrow-right-s-line text-gray-400 dark:text-gray-500"></i>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
