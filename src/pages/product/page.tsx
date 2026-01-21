import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../lib/supabase';

export default function ProductPage() {
  const { id } = useParams();
  const { t } = useTranslation('common');
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadProduct();
      // ✅ SCROLL PARA O TOPO QUANDO MUDAR DE PRODUTO
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      // Carregar produto específico pelo ID
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (productError || !productData) {
        console.error('Produto não encontrado:', productError);
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct(productData);
      setSelectedImageIndex(0);

      // Definir cor e tamanho padrão se disponíveis
      if (productData.colors && productData.colors.length > 0) {
        setSelectedColor(productData.colors[0]);
      }
      if (productData.sizes && productData.sizes.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }

      // Carregar produtos recomendados (configurados manualmente no dashboard)
      await loadRecommendedProducts();

    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      // Verificar se existem produtos recomendados configurados no dashboard
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'product_recommendations')
        .single();

      let recommendedIds: string[] = [];
      
      if (settingsData?.value?.productIds && settingsData.value.productIds.length > 0) {
        // Usar produtos configurados manualmente no dashboard
        recommendedIds = settingsData.value.productIds;
      }

      // Se houver produtos configurados, carregar apenas esses
      if (recommendedIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .in('id', recommendedIds)
          .eq('is_active', true)
          .neq('id', id)
          .limit(4);

        if (productsData && productsData.length > 0) {
          setRecommendedProducts(productsData);
          return;
        }
      }

      // Se não houver produtos configurados, carregar produtos aleatórios (fallback)
      const { data: fallbackData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);

      if (fallbackData) {
        setRecommendedProducts(fallbackData);
      }

    } catch (error) {
      console.error('Erro ao carregar produtos recomendados:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header />
        <div className="flex items-center justify-center py-40">
          <i className="ri-loader-4-line text-6xl text-pink-500 animate-spin"></i>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header />
        <div className="pt-32 pb-20 px-6 text-center">
          <i className="ri-error-warning-line text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            O produto que procura não existe ou foi removido.
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Voltar à Loja
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    setErrorMessage('');
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setErrorMessage('Por favor, selecione um tamanho');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setErrorMessage('Por favor, selecione uma cor');
      return;
    }

    const productImage = product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';

    addToCart({
      id: product.id + (selectedSize || '') + (selectedColor || ''),
      name: product.name_pt || product.name,
      price: product.is_on_sale && product.sale_price ? product.sale_price : product.price,
      image: productImage,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleBuyNow = () => {
    setErrorMessage('');
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setErrorMessage('Por favor, selecione um tamanho');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setErrorMessage('Por favor, selecione uma cor');
      return;
    }

    const productImage = product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';

    addToCart({
      id: product.id + (selectedSize || '') + (selectedColor || ''),
      name: product.name_pt || product.name,
      price: product.is_on_sale && product.sale_price ? product.sale_price : product.price,
      image: productImage,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });

    navigate('/checkout');
  };

  const toggleFavorite = () => {
    const productImage = product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';

    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites({
        id: product.id,
        name: product.name_pt || product.name,
        price: product.is_on_sale && product.sale_price ? product.sale_price : product.price,
        image: productImage,
      });
    }
  };

  // Calcular preço final e desconto
  const finalPrice = product.is_on_sale && product.sale_price ? product.sale_price : product.price;
  const hasDiscount = product.is_on_sale && product.sale_price && product.sale_price < product.price;
  const discountPercentage = product.discount_percentage || 0;

  // Preparar imagens do produto
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : product.image_url 
    ? [product.image_url] 
    : ['https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 cursor-pointer">
                Início
              </Link>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
              <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 cursor-pointer">
                Produtos
              </Link>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
              <span className="text-gray-800 dark:text-white font-medium">
                {product.name_pt || product.name}
              </span>
            </div>
          </div>

          {/* Produto Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
            {/* Galeria de Imagens */}
            <div>
              {/* Imagem Principal */}
              <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] mb-4 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={productImages[selectedImageIndex]}
                  alt={product.name_pt || product.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product-fallback&orientation=portrait';
                  }}
                />
              </div>

              {/* Miniaturas */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {productImages.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-full h-24 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndex === index
                          ? 'border-pink-500 ring-2 ring-pink-500/50'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pink-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name_pt || product.name} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product-thumb&orientation=portrait';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                {product.name_pt || product.name}
              </h1>

              {/* Preço com Promoção */}
              <div className="mb-6">
                {hasDiscount ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold text-pink-400 dark:text-pink-300">
                      €{finalPrice.toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      €{product.price.toFixed(2)}
                    </span>
                    {discountPercentage > 0 && (
                      <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full text-sm font-bold animate-pulse">
                        -{discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-3xl sm:text-4xl font-bold text-pink-400 dark:text-pink-300">
                    €{finalPrice.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <span
                  className={`inline-block px-5 py-2 rounded-full text-sm font-semibold ${
                    product.stock > 0
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {product.stock > 0 ? (
                    <>
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      {t('inStock')}
                    </>
                  ) : (
                    <>
                      <i className="ri-close-circle-line mr-1"></i>
                      {t('outOfStock')}
                    </>
                  )}
                </span>
              </div>

              {/* Cores */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-800 dark:text-white mb-3">
                    {t('color')}
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-3 border-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                          selectedColor === color
                            ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-600 dark:text-pink-300 shadow-lg scale-105'
                            : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-300 text-gray-700 dark:text-gray-300 hover:scale-105'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tamanhos */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-800 dark:text-white mb-3">
                    {t('size')}
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {product.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-3 border-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                          selectedSize === size
                            ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-600 dark:text-pink-300 shadow-lg scale-105'
                            : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-300 text-gray-700 dark:text-gray-300 hover:scale-105'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantidade */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 dark:text-white mb-3">
                  {t('quantity')}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-pink-400 dark:hover:border-pink-300 hover:scale-110 transition-all cursor-pointer text-gray-700 dark:text-gray-300 font-bold text-xl"
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-pink-400 dark:hover:border-pink-300 hover:scale-110 transition-all cursor-pointer text-gray-700 dark:text-gray-300 font-bold text-xl"
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl animate-pulse">
                  <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2 font-medium">
                    <i className="ri-error-warning-line text-xl"></i>
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 px-6 sm:px-8 py-5 bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-500 dark:to-rose-500 text-white rounded-2xl hover:from-pink-600 hover:to-rose-600 dark:hover:from-pink-600 dark:hover:to-rose-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-base sm:text-lg whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg transform active:scale-95"
                >
                  <i className="ri-shopping-cart-line mr-2 text-xl"></i>
                  {t('addToCart')}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 px-6 sm:px-8 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-base sm:text-lg whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg transform active:scale-95"
                >
                  <i className="ri-flashlight-line mr-2 text-xl"></i>
                  Comprar Agora
                </button>
                <button
                  onClick={toggleFavorite}
                  className="w-16 h-16 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-2xl hover:border-pink-400 dark:hover:border-pink-300 hover:scale-110 transition-all cursor-pointer flex-shrink-0"
                >
                  <i
                    className={`text-2xl ${
                      isFavorite(product.id)
                        ? 'ri-heart-fill text-pink-500 dark:text-pink-400'
                        : 'ri-heart-line text-gray-700 dark:text-gray-300'
                    }`}
                  ></i>
                </button>
              </div>

              {/* Mensagem de Sucesso */}
              {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl animate-bounce">
                  <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2 font-medium">
                    <i className="ri-check-line text-xl"></i>
                    Produto adicionado ao carrinho com sucesso!
                  </p>
                </div>
              )}

              {/* Descrição */}
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                  {t('description')}
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description || 'Produto de alta qualidade da Marisol.'}
                </p>
              </div>

              {/* Informação de Envio */}
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  {t('shippingInfo')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full flex-shrink-0">
                      <i className="ri-truck-line text-xl text-white"></i>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Envio grátis para encomendas acima de <strong className="text-pink-600 dark:text-pink-400">€50</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-full flex-shrink-0">
                      <i className="ri-time-line text-xl text-white"></i>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Entrega rápida
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-500 rounded-full flex-shrink-0">
                      <i className="ri-shield-check-line text-xl text-white"></i>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Compra 100% segura
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos Recomendados pela Marisol */}
          {recommendedProducts.length > 0 && (
            <div className="mt-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                  Produtos Recomendados da Marisol
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Selecionados especialmente para si
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8" data-product-shop>
                {recommendedProducts.map((p) => {
                  const productImg = p.images?.[0] || p.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                  const productPrice = p.is_on_sale && p.sale_price ? p.sale_price : p.price;
                  const hasProductDiscount = p.is_on_sale && p.sale_price && p.sale_price < p.price;

                  return (
                    <Link key={p.id} to={`/product/${p.id}`} className="group cursor-pointer">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
                        <div className="relative w-full h-64 lg:h-80 overflow-hidden">
                          <img
                            src={productImg}
                            alt={p.name_pt || p.name}
                            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                            }}
                          />
                          {hasProductDiscount && p.discount_percentage > 0 && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                              -{p.discount_percentage}% OFF
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
                            {p.name_pt || p.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {hasProductDiscount ? (
                              <>
                                <p className="text-lg sm:text-xl font-bold text-pink-500 dark:text-pink-400">
                                  €{productPrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-400 line-through">
                                  €{p.price.toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className="text-lg sm:text-xl font-bold text-pink-500 dark:text-pink-400">
                                €{productPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Botão Ver Mais Produtos */}
              <div className="text-center">
                <Link
                  to="/products"
                  className="inline-block px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold text-lg hover:from-pink-600 hover:to-rose-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-store-line mr-2 text-xl"></i>
                  Ver mais produtos
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
