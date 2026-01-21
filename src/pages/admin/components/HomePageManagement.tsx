import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface HomePageManagementProps {
  darkMode: boolean;
}

export default function HomePageManagement({ darkMode }: HomePageManagementProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [products, setProducts] = useState<any[]>([]);
  const [looks, setLooks] = useState<any[]>([]);
  const [showCreateLookModal, setShowCreateLookModal] = useState(false);
  const [selectedLookProducts, setSelectedLookProducts] = useState<string[]>([]);
  const [lookTitle, setLookTitle] = useState('');
  
  // Hero Section - TUDO EDITÁVEL
  const [heroTitle, setHeroTitle] = useState('MARISOL');
  const [heroSubtitle, setHeroSubtitle] = useState('Elegância Atemporal, Estilo Único');
  const [heroDescription, setHeroDescription] = useState('Descubra a coleção exclusiva que celebra a sua feminilidade e sofisticação. Cada peça conta uma história de elegância e confiança.');
  const [heroButtonText, setHeroButtonText] = useState('Explorar Coleção');
  const [heroButtonLink, setHeroButtonLink] = useState('/products');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState('https://readdy.ai/api/search-image?query=luxury%20fashion%20boutique%20interior%20elegant%20clothing%20display%20modern%20minimalist%20design%20soft%20pink%20rose%20gold%20tones%20sophisticated%20feminine%20aesthetic%20high%20end%20retail%20space%20professional%20photography&width=1920&height=1080&seq=hero-marisol-luxury-v2&orientation=landscape');
  const [showArrowDown, setShowArrowDown] = useState(true);
  
  // Featured Products
  const [featuredProducts, setFeaturedProducts] = useState<string[]>([]);
  const [featuredTitle, setFeaturedTitle] = useState('Produtos em Destaque');
  const [featuredSubtitle, setFeaturedSubtitle] = useState('Descubra as nossas peças mais populares e elegantes');
  const [featuredMode, setFeaturedMode] = useState<'manual' | 'auto'>('manual');
  
  // About Section
  const [aboutTitle, setAboutTitle] = useState('Sobre a Marisol');
  const [aboutDescription, setAboutDescription] = useState('A Marisol é mais do que uma loja de moda - é um destino para mulheres que valorizam estilo, qualidade e autenticidade. Cada peça da nossa coleção é cuidadosamente selecionada para celebrar a sua individualidade e confiança.');
  const [aboutButtonText, setAboutButtonText] = useState('Saiba Mais Sobre Nós');
  const [aboutImage, setAboutImage] = useState('https://readdy.ai/api/search-image?query=elegant%20fashion%20boutique%20interior%20with%20modern%20minimalist%20design%20soft%20pink%20and%20white%20tones%20luxury%20clothing%20store%20atmosphere%20professional%20interior%20photography&width=800&height=600&seq=about-marisol&orientation=landscape');
  
  // Newsletter
  const [newsletterTitle, setNewsletterTitle] = useState('Fique por Dentro das Novidades');
  const [newsletterDescription, setNewsletterDescription] = useState('Subscreva a nossa newsletter e receba em primeira mão as últimas tendências, ofertas exclusivas e dicas de estilo.');
  const [newsletterButtonText, setNewsletterButtonText] = useState('Subscrever Newsletter');
  const [newsletterIncentive, setNewsletterIncentive] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar TODOS os produtos publicados
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (productsError) {
        console.error('Erro ao carregar produtos:', productsError);
      } else if (productsData) {
        console.log('✅ Produtos carregados:', productsData.length);
        setProducts(productsData);
      }

      // Carregar looks
      const { data: looksData, error: looksError } = await supabase
        .from('inspiration_looks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (looksError) {
        console.error('Erro ao carregar looks:', looksError);
      } else if (looksData) {
        console.log('✅ Looks carregados:', looksData.length);
        setLooks(looksData);
      }

      // Carregar configurações da página inicial
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'homepage_settings')
        .maybeSingle();

      if (settingsData?.value) {
        const config = settingsData.value;
        
        if (config.hero) {
          setHeroTitle(config.hero.title || heroTitle);
          setHeroSubtitle(config.hero.subtitle || heroSubtitle);
          setHeroDescription(config.hero.description || heroDescription);
          setHeroButtonText(config.hero.buttonText || heroButtonText);
          setHeroButtonLink(config.hero.buttonLink || heroButtonLink);
          setHeroBackgroundImage(config.hero.backgroundImage || heroBackgroundImage);
          setShowArrowDown(config.hero.showArrowDown !== undefined ? config.hero.showArrowDown : showArrowDown);
        }
        if (config.featured) {
          setFeaturedProducts(config.featured.productIds || []);
          setFeaturedTitle(config.featured.title || featuredTitle);
          setFeaturedSubtitle(config.featured.subtitle || featuredSubtitle);
          setFeaturedMode(config.featured.mode || featuredMode);
        }
        if (config.about) {
          setAboutTitle(config.about.title || aboutTitle);
          setAboutDescription(config.about.description || aboutDescription);
          setAboutButtonText(config.about.buttonText || aboutButtonText);
          setAboutImage(config.about.image || aboutImage);
        }
        if (config.newsletter) {
          setNewsletterTitle(config.newsletter.title || newsletterTitle);
          setNewsletterDescription(config.newsletter.description || newsletterDescription);
          setNewsletterButtonText(config.newsletter.buttonText || newsletterButtonText);
          setNewsletterIncentive(config.newsletter.incentive || newsletterIncentive);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const config = {
        hero: {
          title: heroTitle,
          subtitle: heroSubtitle,
          description: heroDescription,
          buttonText: heroButtonText,
          buttonLink: heroButtonLink,
          backgroundImage: heroBackgroundImage,
          showArrowDown,
        },
        featured: {
          productIds: featuredProducts,
          title: featuredTitle,
          subtitle: featuredSubtitle,
          mode: featuredMode,
        },
        about: {
          title: aboutTitle,
          description: aboutDescription,
          buttonText: aboutButtonText,
          image: aboutImage,
        },
        newsletter: {
          title: newsletterTitle,
          description: newsletterDescription,
          buttonText: newsletterButtonText,
          incentive: newsletterIncentive,
        },
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: 'homepage_settings',
            value: config,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      alert('✅ Configurações salvas e sincronizadas com o site!');
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar configurações: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeaturedProduct = (productId: string) => {
    if (featuredProducts.includes(productId)) {
      setFeaturedProducts(featuredProducts.filter(id => id !== productId));
    } else {
      setFeaturedProducts([...featuredProducts, productId]);
    }
  };

  const toggleLookProduct = (productId: string) => {
    if (selectedLookProducts.includes(productId)) {
      setSelectedLookProducts(selectedLookProducts.filter(id => id !== productId));
    } else {
      if (selectedLookProducts.length >= 4) {
        alert('❌ Pode selecionar no máximo 4 produtos por look');
        return;
      }
      setSelectedLookProducts([...selectedLookProducts, productId]);
    }
  };

  const handleCreateLook = async () => {
    if (!lookTitle.trim()) {
      alert('❌ Por favor, insira um título para o look');
      return;
    }
    if (selectedLookProducts.length === 0) {
      alert('❌ Por favor, selecione pelo menos 1 produto');
      return;
    }
    if (selectedLookProducts.length > 4) {
      alert('❌ Pode selecionar no máximo 4 produtos por look');
      return;
    }

    try {
      const { error } = await supabase
        .from('inspiration_looks')
        .insert([{
          title: lookTitle,
          product_ids: selectedLookProducts,
          is_active: true,
        }]);

      if (error) {
        console.error('Erro ao criar look:', error);
        throw error;
      }

      alert('✅ Look criado com sucesso!');
      setShowCreateLookModal(false);
      setLookTitle('');
      setSelectedLookProducts([]);
      await loadData();
    } catch (error) {
      console.error('Erro ao criar look:', error);
      alert('❌ Erro ao criar look: ' + (error as any).message);
    }
  };

  const handleDeleteLook = async (lookId: string) => {
    if (!confirm('Tem certeza que deseja eliminar este look?')) return;

    try {
      const { error } = await supabase
        .from('inspiration_looks')
        .delete()
        .eq('id', lookId);

      if (error) throw error;

      alert('✅ Look eliminado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao eliminar look:', error);
      alert('❌ Erro ao eliminar look');
    }
  };

  // Obter produtos selecionados para pré-visualização
  const getSelectedProducts = () => {
    return products.filter(p => featuredProducts.includes(p.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Editor da Página Inicial
        </h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-semibold shadow-lg cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'A Guardar...' : '💾 Guardar Alterações'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['hero', 'featured', 'looks', 'about', 'newsletter'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'hero' && '🎨 Hero Section'}
            {tab === 'featured' && '⭐ Produtos em Destaque'}
            {tab === 'looks' && '👗 Looks Inspiradores'}
            {tab === 'about' && '📖 Sobre Nós'}
            {tab === 'newsletter' && '📧 Newsletter'}
          </button>
        ))}
      </div>

      {/* Hero Section - COMPLETO */}
      {activeTab === 'hero' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg space-y-4`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            🎨 Hero Section (Primeira Secção do Site)
          </h3>
          
          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              🖼️ Imagem de Fundo (URL)
            </label>
            <input
              type="text"
              value={heroBackgroundImage}
              onChange={(e) => setHeroBackgroundImage(e.target.value)}
              placeholder="URL da imagem de fundo"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cole o URL da imagem ou use o Stable Diffusion da Readdy
            </p>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              📝 Título Principal (Headline)
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              💫 Subtítulo / Frase de Impacto
            </label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              📄 Descrição
            </label>
            <textarea
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                🔘 Texto do Botão
              </label>
              <input
                type="text"
                value={heroButtonText}
                onChange={(e) => setHeroButtonText(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                🔗 Link do Botão
              </label>
              <input
                type="text"
                value={heroButtonLink}
                onChange={(e) => setHeroButtonLink(e.target.value)}
                placeholder="/products"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showArrowDown"
              checked={showArrowDown}
              onChange={(e) => setShowArrowDown(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
            />
            <label htmlFor="showArrowDown" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>
              ⬇️ Mostrar seta para baixo
            </label>
          </div>
        </div>
      )}

      {/* Featured Products */}
      {activeTab === 'featured' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg space-y-6`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ⭐ Produtos em Destaque
          </h3>

          {/* Configurações da Secção */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Título da Secção
              </label>
              <input
                type="text"
                value={featuredTitle}
                onChange={(e) => setFeaturedTitle(e.target.value)}
                placeholder="Ex: Mais Vendidos, Escolhas da Marisol"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Subtítulo (Opcional)
              </label>
              <input
                type="text"
                value={featuredSubtitle}
                onChange={(e) => setFeaturedSubtitle(e.target.value)}
                placeholder="Descrição curta da secção"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Modo de Seleção
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFeaturedMode('manual')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium cursor-pointer transition-all ${
                    featuredMode === 'manual'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✋ Manual (Escolhidos por ti)
                </button>
                <button
                  onClick={() => setFeaturedMode('auto')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium cursor-pointer transition-all ${
                    featuredMode === 'auto'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🤖 Automático (Mais vendidos)
                </button>
              </div>
            </div>
          </div>

          {/* Produtos Já Selecionados */}
          {featuredMode === 'manual' && getSelectedProducts().length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-pink-50'} border-2 border-pink-200 dark:border-pink-800`}>
              <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ✅ Produtos Já Selecionados ({getSelectedProducts().length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getSelectedProducts().map((product) => (
                  <div key={product.id} className="relative group">
                    <img
                      src={product.images?.[0] || product.image_url}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center`}>
                      <button
                        onClick={() => toggleFeaturedProduct(product.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                    <p className={`text-xs mt-1 font-medium line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name_pt || product.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selecionar Produtos */}
          {featuredMode === 'manual' && (
            <>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Selecionar Produtos ({featuredProducts.length} selecionados)
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => toggleFeaturedProduct(product.id)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                      featuredProducts.includes(product.id)
                        ? 'ring-4 ring-pink-500 shadow-xl'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <img
                      src={product.images?.[0] || product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-1`}>
                        {product.name_pt || product.name}
                      </p>
                      <p className="text-pink-500 font-bold">€{product.price.toFixed(2)}</p>
                    </div>
                    {featuredProducts.includes(product.id) && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-white text-lg"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Looks Inspiradores */}
      {activeTab === 'looks' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              👗 Looks Inspiradores ({looks.length} looks criados)
            </h3>
            <button
              onClick={() => setShowCreateLookModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Criar Novo Look
            </button>
          </div>
          
          {looks.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="ri-shirt-line text-6xl mb-4"></i>
              <p className="text-lg">Nenhum look criado ainda</p>
              <p className="text-sm mt-2">Clique em "Criar Novo Look" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {looks.map((look) => (
                <div
                  key={look.id}
                  className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} shadow-lg`}
                >
                  <div className="p-4">
                    <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {look.title}
                    </h4>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {look.product_ids?.length || 0} produtos selecionados
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {look.product_ids?.slice(0, 4).map((productId: string) => {
                        const product = products.find(p => p.id === productId);
                        return product ? (
                          <img
                            key={productId}
                            src={product.images?.[0] || product.image_url}
                            alt={product.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : null;
                      })}
                    </div>
                    <button
                      onClick={() => handleDeleteLook(look.id)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line mr-2"></i>
                      Eliminar Look
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* About Section */}
      {activeTab === 'about' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg space-y-4`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            📖 Secção Sobre Nós (Versão Curta na Home)
          </h3>
          
          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Título
            </label>
            <input
              type="text"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              placeholder="Ex: Mais do que moda"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Descrição Curta
            </label>
            <textarea
              value={aboutDescription}
              onChange={(e) => setAboutDescription(e.target.value)}
              rows={5}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Texto do Botão
            </label>
            <input
              type="text"
              value={aboutButtonText}
              onChange={(e) => setAboutButtonText(e.target.value)}
              placeholder="Ex: Conheça a Marisol"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Imagem Ilustrativa (URL)
            </label>
            <input
              type="text"
              value={aboutImage}
              onChange={(e) => setAboutImage(e.target.value)}
              placeholder="URL da imagem"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>
        </div>
      )}

      {/* Newsletter */}
      {activeTab === 'newsletter' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg space-y-4`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            💌 Secção Newsletter
          </h3>
          
          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Título da Secção
            </label>
            <input
              type="text"
              value={newsletterTitle}
              onChange={(e) => setNewsletterTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Texto Descritivo
            </label>
            <textarea
              value={newsletterDescription}
              onChange={(e) => setNewsletterDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Texto do Botão
            </label>
            <input
              type="text"
              value={newsletterButtonText}
              onChange={(e) => setNewsletterButtonText(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Incentivo (Opcional)
            </label>
            <input
              type="text"
              value={newsletterIncentive}
              onChange={(e) => setNewsletterIncentive(e.target.value)}
              placeholder="Ex: 10% na primeira compra"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>
        </div>
      )}

      {/* Modal Criar Look */}
      {showCreateLookModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                ✨ Criar Novo Look Inspirador
              </h2>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Selecione até 4 produtos para criar um look ({selectedLookProducts.length}/4 selecionados)
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Título do Look *
                </label>
                <input
                  type="text"
                  value={lookTitle}
                  onChange={(e) => setLookTitle(e.target.value)}
                  placeholder="Ex: Look Elegante para o Escritório"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Selecionar Produtos (clique para selecionar/desmarcar)
                </label>
                
                {products.length === 0 ? (
                  <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="ri-shopping-bag-line text-6xl mb-4"></i>
                    <p className="text-lg">Nenhum produto disponível</p>
                    <p className="text-sm mt-2">Adicione produtos primeiro na aba "Produtos"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => toggleLookProduct(product.id)}
                        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedLookProducts.includes(product.id)
                            ? 'ring-4 ring-green-500 shadow-xl'
                            : 'hover:shadow-lg'
                        }`}
                      >
                        <img
                          src={product.images?.[0] || product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover"
                        />
                        <div className={`p-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-1`}>
                            {product.name_pt || product.name}
                          </p>
                          <p className="text-pink-500 font-bold text-sm">€{product.price.toFixed(2)}</p>
                        </div>
                        {selectedLookProducts.includes(product.id) && (
                          <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <i className="ri-check-line text-white text-lg"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
              <button
                onClick={() => {
                  setShowCreateLookModal(false);
                  setLookTitle('');
                  setSelectedLookProducts([]);
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLook}
                disabled={selectedLookProducts.length === 0 || !lookTitle.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-check-line mr-2"></i>
                Criar Look ({selectedLookProducts.length}/4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
