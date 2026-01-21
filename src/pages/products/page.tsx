import { useState, useEffect } from 'react';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  image_url: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  image_url: string;
  category_id: string;
  subcategory_id: string;
  colors: string[];
  sizes: string[];
  stock: number;
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const productsPerPage = 12;
  
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [notification, setNotification] = useState<{ type: 'cart' | 'favorite'; show: boolean }>({ type: 'cart', show: false });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filtros
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 🧠 PALAVRAS-CHAVE INTELIGENTES - Mesmo sistema do SearchBar
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
    'top': ['top', 'blusa', 'camisa'],
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
    fetchCategories();
    fetchSubcategories();
    loadProducts();
  }, []);

  useEffect(() => {
    // Obter termo de pesquisa da URL
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery('');
    }
    
    // Obter categoria da URL
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.length > 0) {
      const cat = categories.find(c => 
        c.name.toLowerCase() === categoryParam.toLowerCase() ||
        c.slug?.toLowerCase() === categoryParam.toLowerCase()
      );
      if (cat) {
        setSelectedCategory(cat.id);
        setExpandedCategories([cat.id]);
      } else {
        setSelectedCategory(null);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams, categories]);

  useEffect(() => {
    applyFilters();
  }, [products, selectedCategory, selectedSubcategory, selectedColors, selectedSizes, priceRange, searchQuery]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setSubcategories(data);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // 🔥 CARREGAR TODOS OS PRODUTOS ATIVOS
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Formatar produtos com nome correto baseado no idioma
      const formattedProducts = data?.map((product: any) => ({
        ...product,
        name: product.name_pt || product.name_en || product.name_fr || product.name_de || 'Produto',
        description: product.description_pt || product.description_en || product.description_fr || product.description_de || '',
        image: product.images?.[0] || '',
      })) || [];

      setProducts(formattedProducts);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // 🔥 FILTRO DE PESQUISA INTELIGENTE COM SISTEMA DE PONTUAÇÃO
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Sistema de pontuação para relevância
      const scoredProducts = filtered
        .map(product => {
          const name = (product.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const description = (product.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          let score = 0;

          // 🎯 PONTUAÇÃO POR CORRESPONDÊNCIA EXATA NO NOME
          if (name === query) {
            score = 1000;
          }
          // 🎯 PONTUAÇÃO POR INÍCIO DO NOME
          else if (name.startsWith(query)) {
            score = 500;
          }
          // 🎯 PONTUAÇÃO POR INCLUSÃO NO NOME
          else if (name.includes(query)) {
            score = 100;
          }
          // 🎯 PONTUAÇÃO POR INCLUSÃO NA DESCRIÇÃO
          else if (description.includes(query)) {
            score = 50;
          }
          // 🧠 PONTUAÇÃO POR PALAVRAS-CHAVE INTELIGENTES
          else {
            const keywords = smartKeywords[query] || [];
            for (const keyword of keywords) {
              const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              if (name.includes(normalizedKeyword)) {
                score = 80; // Palavra-chave no nome
                break;
              } else if (description.includes(normalizedKeyword)) {
                score = 40; // Palavra-chave na descrição
                break;
              }
            }
          }

          // 🎯 PONTUAÇÃO ADICIONAL POR SIMILARIDADE DE PALAVRAS
          if (score === 0) {
            const queryWords = query.split(' ');
            const nameWords = name.split(' ');
            
            for (const qWord of queryWords) {
              if (qWord.length >= 3) {
                for (const nWord of nameWords) {
                  // Verifica se palavras compartilham 70%+ dos caracteres
                  if (nWord.includes(qWord.substring(0, Math.ceil(qWord.length * 0.7)))) {
                    score = 30;
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
        .map(item => item.product);

      filtered = scoredProducts;
    }

    // FILTRO DE CATEGORIA
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }

    // FILTRO DE SUBCATEGORIA
    if (selectedSubcategory) {
      filtered = filtered.filter(p => p.subcategory_id === selectedSubcategory);
    }

    // FILTRO DE CORES
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => 
        p.colors && p.colors.some(c => selectedColors.includes(c))
      );
    }

    // FILTRO DE TAMANHOS
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => 
        p.sizes && p.sizes.some(s => selectedSizes.includes(s))
      );
    }

    // FILTRO DE PREÇO
    filtered = filtered.filter(p => {
      const price = p.sale_price || p.discount_price || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSearchQuery(''); // Limpar pesquisa ao selecionar categoria
    navigate('/products?category=' + categories.find(c => c.id === categoryId)?.slug || categoryId);
    
    if (!expandedCategories.includes(categoryId)) {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 200]);
    setExpandedCategories([]);
    setSearchQuery('');
    navigate('/products');
  };

  const handleAddToCart = (product: any) => {
    // Usar preço promocional se existir, senão usar preço normal
    const finalPrice = product.sale_price || product.discount_price || product.price;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait',
      quantity: 1,
    });
    setNotification({ type: 'cart', show: true });
    setTimeout(() => setNotification({ type: 'cart', show: false }), 3000);
  };

  const handleBuyNow = (product: any) => {
    // Usar preço promocional se existir, senão usar preço normal
    const finalPrice = product.sale_price || product.discount_price || product.price;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait',
      quantity: 1,
    });
    navigate('/checkout');
  };

  const toggleFavorite = (product: any) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait',
      });
      setNotification({ type: 'favorite', show: true });
      setTimeout(() => setNotification({ type: 'favorite', show: false }), 3000);
    }
  };

  // Paginação
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const allColors = ['Preto', 'Branco', 'Vermelho', 'Rosa', 'Azul', 'Verde', 'Amarelo', 'Laranja', 'Roxo', 'Cinza', 'Bege', 'Castanho'];
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'Único'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-24 right-4 z-50 animate-slide-up">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-pink-200 dark:border-pink-900">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
              <i className={`${notification.type === 'cart' ? 'ri-shopping-cart-line' : 'ri-heart-line'} text-white text-xl`}></i>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {notification.type === 'cart' ? 'Adicionado ao Carrinho!' : 'Adicionado aos Favoritos!'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Produto adicionado com sucesso</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Categorias - STICKY */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden w-full mb-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <i className="ri-filter-3-line text-xl"></i>
                  {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>

                <div className={`${showFilters ? 'block' : 'hidden'} lg:block bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-pink-100 dark:border-slate-700`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Categorias</h2>
                    {(selectedCategory || selectedSubcategory || selectedColors.length > 0 || selectedSizes.length > 0) && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-pink-600 dark:text-pink-400 hover:underline"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Categorias */}
                  <div className="space-y-2 mb-6">
                    {categories.map((category) => {
                      const categorySubcategories = subcategories.filter(s => s.category_id === category.id);
                      const isExpanded = expandedCategories.includes(category.id);
                      
                      return (
                        <div key={category.id}>
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between ${
                              selectedCategory === category.id
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                                : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-600'
                            }`}
                          >
                            <span className="font-semibold text-sm">{category.name}</span>
                            <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-lg`}></i>
                          </button>

                          {/* Subcategorias */}
                          {isExpanded && categorySubcategories.length > 0 && (
                            <div className="ml-4 mt-2 space-y-1">
                              {categorySubcategories.map((subcategory) => (
                                <button
                                  key={subcategory.id}
                                  onClick={() => handleSubcategoryClick(subcategory.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                                    selectedSubcategory === subcategory.id
                                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                                  }`}
                                >
                                  {subcategory.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Filtro de Cores */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Cores</h3>
                    <div className="flex flex-wrap gap-2">
                      {allColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            if (selectedColors.includes(color)) {
                              setSelectedColors(selectedColors.filter(c => c !== color));
                            } else {
                              setSelectedColors([...selectedColors, color]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                            selectedColors.includes(color)
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-600'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de Tamanhos */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Tamanhos</h3>
                    <div className="flex flex-wrap gap-2">
                      {allSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            if (selectedSizes.includes(size)) {
                              setSelectedSizes(selectedSizes.filter(s => s !== size));
                            } else {
                              setSelectedSizes([...selectedSizes, size]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                            selectedSizes.includes(size)
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de Preço */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Preço</h3>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                        className="w-full accent-pink-500"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>0€</span>
                        <span className="font-bold text-pink-600 dark:text-pink-400">{priceRange[1]}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchQuery 
                    ? `Resultados para "${searchQuery}"`
                    : selectedSubcategory 
                    ? subcategories.find(s => s.id === selectedSubcategory)?.name
                    : selectedCategory
                    ? categories.find(c => c.id === selectedCategory)?.name
                    : 'Todos os Produtos'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </p>
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">A carregar produtos...</p>
                </div>
              ) : currentProducts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="ri-shopping-bag-line text-5xl text-pink-600 dark:text-pink-400"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Tente ajustar os filtros</p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                  >
                    Limpar Filtros
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    {currentProducts.map((product) => {
                      // Calcular desconto se houver preço promocional
                      const hasDiscount = product.sale_price || product.discount_price;
                      const discountPrice = product.sale_price || product.discount_price;
                      const discountPercentage = hasDiscount && product.price > 0
                        ? Math.round(((product.price - discountPrice) / product.price) * 100)
                        : product.discount_percentage || 0;
                      
                      return (
                        <div
                          key={product.id}
                          className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-pink-100 dark:border-slate-700"
                        >
                          <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
                            <div className="relative w-full h-48 sm:h-56 lg:h-64 overflow-hidden">
                              <img
                                src={product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait'}
                                alt={product.name}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                                }}
                              />
                            </div>
                            {hasDiscount && discountPercentage > 0 && (
                              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                -{discountPercentage}%
                              </div>
                            )}
                          </Link>

                          <div className="p-3 sm:p-4">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                              {product.name}
                            </h3>
                            
                            {/* Preços - Mostrar preço promocional se existir */}
                            <div className="mb-3">
                              {hasDiscount ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-base sm:text-lg font-bold text-pink-500 dark:text-pink-400">
                                    €{discountPrice.toFixed(2)}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                                    €{product.price.toFixed(2)}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-base sm:text-lg font-bold text-pink-500 dark:text-pink-400">
                                  €{product.price.toFixed(2)}
                                </p>
                              )}
                            </div>
                            
                            {/* Botões de Ação */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(product);
                                }}
                                disabled={product.stock === 0}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-400 to-rose-400 dark:from-pink-500 dark:to-rose-500 text-white rounded-lg hover:from-pink-500 hover:to-rose-500 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all duration-300 font-semibold text-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <i className="ri-shopping-cart-line"></i>
                                Carrinho
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleBuyNow(product);
                                }}
                                disabled={product.stock === 0}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 transition-all duration-300 font-semibold text-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <i className="ri-flashlight-line"></i>
                                Comprar
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(product);
                                }}
                                className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg hover:border-pink-400 dark:hover:border-pink-300 transition-colors cursor-pointer flex-shrink-0"
                              >
                                <i
                                  className={`text-lg ${
                                    isFavorite(product.id)
                                      ? 'ri-heart-fill text-pink-400 dark:text-pink-300'
                                      : 'ri-heart-line text-gray-700 dark:text-gray-300'
                                  }`}
                                ></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 dark:hover:bg-slate-700 transition-all duration-300"
                      >
                        <i className="ri-arrow-left-s-line"></i>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 dark:hover:bg-slate-700 transition-all duration-300"
                      >
                        <i className="ri-arrow-right-s-line"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
