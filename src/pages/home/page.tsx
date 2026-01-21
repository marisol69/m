import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function HomePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLookIndex, setCurrentLookIndex] = useState(0);
  
  // 🔥 POPUPS - CONECTADO AO DATABASE
  const [activePopup, setActivePopup] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // 🔥 BANNERS - CONECTADO AO DATABASE
  const [banners, setBanners] = useState<any[]>([]);
  
  // Estados para configurações da página - SINCRONIZADOS COM O DASHBOARD
  const [heroTitle, setHeroTitle] = useState('MARISOL');
  const [heroSubtitle, setHeroSubtitle] = useState('Elegância Atemporal, Estilo Único');
  const [heroDescription, setHeroDescription] = useState('Descubra a coleção exclusiva que celebra a sua feminilidade e sofisticação. Cada peça conta uma história de elegância e confiança.');
  const [heroButtonText, setHeroButtonText] = useState('Explorar Coleção');
  const [heroButtonLink, setHeroButtonLink] = useState('/products');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState('https://readdy.ai/api/search-image?query=luxury%20fashion%20boutique%20interior%20elegant%20clothing%20display%20modern%20minimalist%20design%20soft%20pink%20rose%20gold%20tones%20sophisticated%20feminine%20aesthetic%20high%20end%20retail%20space%20professional%20photography&width=1920&height=1080&seq=hero-marisol-luxury-v2&orientation=landscape');
  const [showArrowDown, setShowArrowDown] = useState(true);
  
  const [featuredTitle, setFeaturedTitle] = useState('Produtos em Destaque');
  const [featuredSubtitle, setFeaturedSubtitle] = useState('Descubra as nossas peças mais populares e elegantes');
  const [featuredMode, setFeaturedMode] = useState<'manual' | 'auto'>('manual');
  
  const [aboutTitle, setAboutTitle] = useState('Sobre a Marisol');
  const [aboutDescription, setAboutDescription] = useState('A Marisol é mais do que uma loja de moda - é um destino para mulheres que valorizam estilo, qualidade e autenticidade. Cada peça da nossa coleção é cuidadosamente selecionada para celebrar a sua individualidade e confiança.');
  const [aboutButtonText, setAboutButtonText] = useState('Saiba Mais Sobre Nós');
  const [aboutImage, setAboutImage] = useState('https://readdy.ai/api/search-image?query=elegant%20fashion%20boutique%20interior%20with%20modern%20minimalist%20design%20soft%20pink%20and%20white%20tones%20luxury%20clothing%20store%20atmosphere%20professional%20interior%20photography&width=800&height=600&seq=about-marisol&orientation=landscape');
  
  const [newsletterTitle, setNewsletterTitle] = useState('Fique por Dentro das Novidades');
  const [newsletterDescription, setNewsletterDescription] = useState('Subscreva a nossa newsletter e receba em primeira mão as últimas tendências, ofertas exclusivas e dicas de estilo.');
  const [newsletterButtonText, setNewsletterButtonText] = useState('Subscrever Newsletter');
  const [newsletterIncentive, setNewsletterIncentive] = useState('');
  
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [inspirationLooks, setInspirationLooks] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    loadPageSettings();
    loadProducts();
    loadLooks();
    loadBanners();
  }, []);

  // Carregar popup ativo
  useEffect(() => {
    const loadPopup = async () => {
      try {
        const { data, error } = await supabase
          .from('popups')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          // Ignorar erros de permissão silenciosamente - as políticas RLS precisam ser corrigidas no Supabase Dashboard
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            // Erro de permissão - ignorar silenciosamente
            return;
          }
          console.error('Erro ao carregar popup:', error);
          return;
        }

        if (data) {
          const popupKey = `popup_shown_${data.id}`;
          const hasShown = localStorage.getItem(popupKey);

          if (!data.show_once || !hasShown) {
            setActivePopup(data);
          }
        }
      } catch (err) {
        // Ignorar todos os erros de popup para não afetar o carregamento da página
        console.log('Popup não disponível');
      }
    };

    loadPopup();
  }, []);

  // 🔥 CARREGAR BANNERS DO DATABASE
  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
    }
  };

  const loadPageSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'homepage_settings')
        .single();

      if (data?.value) {
        const settings = data.value;
        
        // Hero Section - COMPLETO
        if (settings.hero) {
          setHeroTitle(settings.hero.title || heroTitle);
          setHeroSubtitle(settings.hero.subtitle || heroSubtitle);
          setHeroDescription(settings.hero.description || heroDescription);
          setHeroButtonText(settings.hero.buttonText || heroButtonText);
          setHeroButtonLink(settings.hero.buttonLink || heroButtonLink);
          setHeroBackgroundImage(settings.hero.backgroundImage || heroBackgroundImage);
          setShowArrowDown(settings.hero.showArrowDown !== undefined ? settings.hero.showArrowDown : showArrowDown);
        }
        
        // Featured Products - COMPLETO
        if (settings.featured) {
          setFeaturedTitle(settings.featured.title || featuredTitle);
          setFeaturedSubtitle(settings.featured.subtitle || featuredSubtitle);
          setFeaturedMode(settings.featured.mode || featuredMode);
        }
        
        // About - COMPLETO
        if (settings.about) {
          setAboutTitle(settings.about.title || aboutTitle);
          setAboutDescription(settings.about.description || aboutDescription);
          setAboutButtonText(settings.about.buttonText || aboutButtonText);
          setAboutImage(settings.about.image || aboutImage);
        }
        
        // Newsletter - COMPLETO
        if (settings.newsletter) {
          setNewsletterTitle(settings.newsletter.title || newsletterTitle);
          setNewsletterDescription(settings.newsletter.description || newsletterDescription);
          setNewsletterButtonText(settings.newsletter.buttonText || newsletterButtonText);
          setNewsletterIncentive(settings.newsletter.incentive || newsletterIncentive);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsData) {
        setAllProducts(productsData);

        // Carregar configurações dos produtos em destaque
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'homepage_settings')
          .single();

        if (settingsData?.value?.featured) {
          const mode = settingsData.value.featured.mode || 'manual';
          
          if (mode === 'manual' && settingsData.value.featured.productIds) {
            // Modo Manual: usar produtos selecionados
            const featuredIds = settingsData.value.featured.productIds;
            const featured = productsData.filter(p => featuredIds.includes(p.id));
            setFeaturedProducts(featured.length > 0 ? featured : productsData.slice(0, 8));
          } else {
            // Modo Automático: mais vendidos (simulado por data de criação)
            setFeaturedProducts(productsData.slice(0, 8));
          }
        } else {
          setFeaturedProducts(productsData.slice(0, 8));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadLooks = async () => {
    try {
      const { data: looks, error } = await supabase
        .from('inspiration_looks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (looks && looks.length > 0) {
        const looksWithProducts = await Promise.all(
          looks.map(async (look) => {
            if (look.product_ids && look.product_ids.length > 0) {
              const { data: products } = await supabase
                .from('products')
                .select('*')
                .in('id', look.product_ids);

              return {
                ...look,
                products: products || []
              };
            }
            return { ...look, products: [] };
          })
        );

        setInspirationLooks(looksWithProducts);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar looks:', error);
      setLoading(false);
    }
  };

  const getCurrentLookProducts = () => {
    if (!inspirationLooks[currentLookIndex]) return [];
    
    const currentLook = inspirationLooks[currentLookIndex];
    const productIds = currentLook.product_ids || [];
    
    return productIds
      .map((id: string) => allProducts.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 4);
  };

  const prevLook = () => {
    setCurrentLookIndex((prev) => (prev === 0 ? inspirationLooks.length - 1 : prev - 1));
  };

  const nextLook = () => {
    setCurrentLookIndex((prev) => (prev === inspirationLooks.length - 1 ? 0 : prev + 1));
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
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
    }
  };

  const getBannersByPosition = (position: string) => {
    return banners.filter(b => b.position === position);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />

      {/* Hero Section - SINCRONIZADO COM DASHBOARD */}
      <section className="relative min-h-screen flex items-center justify-start overflow-hidden pt-20">
        {/* Background Image - CONTROLADO NO DASHBOARD */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackgroundImage}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>

        {/* Content - TUDO EDITÁVEL NO DASHBOARD */}
        <div className="relative z-10 container mx-auto px-8 lg:px-16">
          <div className="max-w-xl bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-3xl p-10 border border-white/20 shadow-2xl">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white animate-fade-in drop-shadow-2xl">
              {heroTitle}
            </h1>
            <p className="text-2xl md:text-3xl mb-4 text-white/95 animate-slide-up font-light" style={{ animationDelay: '0.2s' }}>
              {heroSubtitle}
            </p>
            <p className="text-base md:text-lg mb-8 text-white/90 animate-slide-up leading-relaxed" style={{ animationDelay: '0.4s' }}>
              {heroDescription}
            </p>
            <Link
              to={heroButtonLink}
              className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold text-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-2xl hover:shadow-pink-500/50 hover:scale-105 animate-slide-up cursor-pointer whitespace-nowrap"
              style={{ animationDelay: '0.6s' }}
            >
              {heroButtonText}
            </Link>
          </div>
        </div>
      </section>

      {/* 🔥 BANNERS TOPO - CONECTADOS AO DATABASE */}
      {getBannersByPosition('top').length > 0 && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            {getBannersByPosition('top').map((banner) => (
              <Link
                key={banner.id}
                to={banner.link_url || '#'}
                className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products - SINCRONIZADO COM DASHBOARD */}
      <section className="py-20 bg-gradient-to-b from-white via-pink-50/30 to-white dark:from-gray-900 dark:via-pink-900/10 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {featuredTitle}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {featuredSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => {
              // Calcular desconto se houver preço promocional
              const hasDiscount = product.sale_price || product.discount_price;
              const discountPrice = product.sale_price || product.discount_price;
              const discountPercentage = hasDiscount && product.price > 0
                ? Math.round(((product.price - discountPrice) / product.price) * 100)
                : product.discount_percentage || 0;
              
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden aspect-[3/4]">
                    <img
                      src={product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait'}
                      alt={product.name}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://readdy.ai/api/search-image?query=elegant%20fashion%20clothing%20product%20on%20simple%20white%20background%20professional%20ecommerce%20photography%20high%20quality%20studio%20lighting&width=400&height=500&seq=default-product&orientation=portrait';
                      }}
                    />
                    {hasDiscount && discountPercentage > 0 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        -{discountPercentage}%
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(product);
                      }}
                      className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-full hover:scale-110 transition-transform cursor-pointer shadow-lg"
                    >
                      <i
                        className={`text-xl ${
                          isFavorite(product.id)
                            ? 'ri-heart-fill text-pink-500'
                            : 'ri-heart-line text-gray-700 dark:text-gray-300'
                        }`}
                      ></i>
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 min-h-[40px]">
                      {product.name}
                    </h3>
                    
                    {/* Preços - Mostrar preço promocional se existir */}
                    <div className="mb-3">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-lg font-bold text-pink-500 dark:text-pink-400">
                            €{discountPrice.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            €{product.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-pink-500 dark:text-pink-400">
                          €{product.price.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock === 0}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-semibold text-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
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
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-semibold text-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <i className="ri-flashlight-line"></i>
                        Comprar
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🔥 BANNERS MEIO - CONECTADOS AO DATABASE */}
      {getBannersByPosition('middle').length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            {getBannersByPosition('middle').map((banner) => (
              <Link
                key={banner.id}
                to={banner.link_url || '#'}
                className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-64 object-cover"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Looks Inspiradores - SINCRONIZADO COM DASHBOARD */}
      {!loading && inspirationLooks.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-pink-50/50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-slide-up">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full text-pink-600 dark:text-pink-400 text-sm font-bold mb-4">
                💫 Inspiração
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Looks Inspiradores
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Descubra combinações perfeitas criadas especialmente para você
              </p>
            </div>

            <div className="relative">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-slate-700">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  {inspirationLooks[currentLookIndex].title}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8" data-product-shop>
                  {getCurrentLookProducts().map((product) => {
                    // Calcular desconto se houver preço promocional
                    const hasDiscount = product!.sale_price || product!.discount_price;
                    const discountPrice = product!.sale_price || product!.discount_price;
                    const finalPrice = hasDiscount ? discountPrice : product!.price;
                    const discountPercentage = hasDiscount && product!.price > 0
                      ? Math.round(((product!.price - discountPrice) / product!.price) * 100)
                      : 0;
                    
                    return (
                      <Link
                        key={product!.id}
                        to={`/product/${product!.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="bg-white dark:bg-slate-700 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:scale-105 transform border border-pink-100 dark:border-slate-600 card-hover">
                          <div className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-600 dark:to-slate-500">
                            <img
                              src={product!.images?.[0] || product!.image_url}
                              alt={product!.name}
                              className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                            />
                            {hasDiscount && discountPercentage > 0 && (
                              <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                -{discountPercentage}%
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[40px] group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                              {product!.name}
                            </h4>
                            
                            {/* Preços - Mostrar preço promocional se existir */}
                            {hasDiscount ? (
                              <div className="flex items-center gap-2 flex-wrap mb-3">
                                <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                                  €{finalPrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                  €{product!.price.toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
                                €{product!.price.toFixed(2)}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(product);
                                }}
                                disabled={product!.stock === 0}
                                className="flex-1 px-2 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-semibold text-xs whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <i className="ri-shopping-cart-line text-sm"></i>
                                Carrinho
                              </button>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleBuyNow(product);
                                }}
                                disabled={product!.stock === 0}
                                className="flex-1 px-2 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-semibold text-xs whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <i className="ri-flashlight-line text-sm"></i>
                                Comprar
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {inspirationLooks.length > 1 && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={prevLook}
                      className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full hover:from-pink-600 hover:to-rose-700 hover:scale-125 transform transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl"
                    >
                      <i className="ri-arrow-left-line text-2xl"></i>
                    </button>
                    <div className="flex gap-2">
                      {inspirationLooks.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentLookIndex(index)}
                          className={`h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-150 ${
                            index === currentLookIndex 
                              ? 'w-12 bg-gradient-to-r from-pink-500 to-rose-600' 
                              : 'w-3 bg-gray-300 dark:bg-gray-600 hover:bg-pink-400'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={nextLook}
                      className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full hover:from-pink-600 hover:to-rose-700 hover:scale-125 transform transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl"
                    >
                      <i className="ri-arrow-right-line text-2xl"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section - SINCRONIZADO COM DASHBOARD */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {aboutTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {aboutDescription}
              </p>
              <Link
                to="/about"
                className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer whitespace-nowrap"
              >
                {aboutButtonText}
              </Link>
            </div>
            <div className="animate-fade-in">
              <img
                src={aboutImage}
                alt={aboutTitle}
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 BANNERS FUNDO - CONECTADOS AO DATABASE */}
      {getBannersByPosition('bottom').length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            {getBannersByPosition('bottom').map((banner) => (
              <Link
                key={banner.id}
                to={banner.link_url || '#'}
                className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-64 object-cover"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter - SINCRONIZADO COM DASHBOARD */}
      <section className="py-20 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            {newsletterTitle}
          </h2>
          <p className="text-lg text-white/90 mb-2 max-w-2xl mx-auto">
            {newsletterDescription}
          </p>
          {newsletterIncentive && (
            <p className="text-xl font-bold text-white mb-8">
              🎁 {newsletterIncentive}
            </p>
          )}
          <Link
            to="/newsletter"
            className="inline-block px-8 py-4 bg-white text-pink-500 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer whitespace-nowrap"
          >
            {newsletterButtonText}
          </Link>
        </div>
      </section>

      {/* 🔥 POPUP MODAL - CONECTADO AO DATABASE */}
      {showPopup && activePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            {activePopup.image_url && (
              <img
                src={activePopup.image_url}
                alt={activePopup.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-8 text-center">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {activePopup.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {activePopup.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPopup(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer"
                >
                  Fechar
                </button>
                {activePopup.button_text && activePopup.button_link && (
                  <Link
                    to={activePopup.button_link}
                    onClick={() => setShowPopup(false)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {activePopup.button_text}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          ✅ Adicionado com sucesso!
        </div>
      )}

      <Footer />
    </div>
  );
}
