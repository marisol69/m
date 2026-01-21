import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface SiteContentManagementProps {
  darkMode?: boolean;
}

type PageType = 'home' | 'about' | 'contact' | 'products' | 'cart' | 'checkout' | 'checkout-success' | 'checkout-error';

export default function SiteContentManagement({ darkMode = false }: SiteContentManagementProps) {
  const [activePage, setActivePage] = useState<PageType>('home');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>({});

  useEffect(() => {
    loadPageContent();
  }, [activePage]);

  const loadPageContent = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .single();
      
      if (data) {
        setContent(data);
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      await supabase
        .from('site_settings')
        .upsert(content);
      
      alert('Conteúdo guardado com sucesso!');
    } catch (error) {
      console.error('Erro ao guardar:', error);
      alert('Erro ao guardar conteúdo');
    } finally {
      setSaving(false);
    }
  };

  const renderHomeEditor = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-home-heart-line mr-2 text-pink-500"></i>
          Secção Hero Principal
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título Principal
            </label>
            <input
              type="text"
              value={content.hero_title || 'MARISOL'}
              onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
              placeholder="MARISOL"
              className={`w-full px-4 py-3 rounded-lg border text-lg font-bold ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subtítulo
            </label>
            <input
              type="text"
              value={content.hero_subtitle || 'Elegância Atemporal'}
              onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
              placeholder="Elegância Atemporal"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Descrição
            </label>
            <textarea
              value={content.hero_description || 'Descubra a coleção que define o seu estilo'}
              onChange={(e) => setContent({ ...content, hero_description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Imagem de Fundo
            </label>
            <input
              type="text"
              value={content.hero_image || ''}
              onChange={(e) => setContent({ ...content, hero_image: e.target.value })}
              placeholder="https://..."
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
            {content.hero_image && (
              <div className="mt-3">
                <img src={content.hero_image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Texto do Botão
            </label>
            <input
              type="text"
              value={content.hero_button_text || 'Explorar Coleção'}
              onChange={(e) => setContent({ ...content, hero_button_text: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-star-line mr-2 text-yellow-500"></i>
          Produtos em Destaque
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título da Secção
            </label>
            <input
              type="text"
              value={content.featured_title || 'Produtos em Destaque'}
              onChange={(e) => setContent({ ...content, featured_title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subtítulo
            </label>
            <input
              type="text"
              value={content.featured_subtitle || 'Descubra as nossas peças mais populares'}
              onChange={(e) => setContent({ ...content, featured_subtitle: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-grid-line mr-2 text-blue-500"></i>
          Secção de Categorias
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título
            </label>
            <input
              type="text"
              value={content.categories_title || 'Explore por Categoria'}
              onChange={(e) => setContent({ ...content, categories_title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subtítulo
            </label>
            <input
              type="text"
              value={content.categories_subtitle || 'Encontre o estilo perfeito para si'}
              onChange={(e) => setContent({ ...content, categories_subtitle: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Imagem de Fundo
            </label>
            <input
              type="text"
              value={content.categories_background || ''}
              onChange={(e) => setContent({ ...content, categories_background: e.target.value })}
              placeholder="https://..."
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAboutEditor = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-information-line mr-2 text-blue-500"></i>
          Página Sobre Nós
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título Principal
            </label>
            <input
              type="text"
              value={content.about_title || 'Sobre a Marisol'}
              onChange={(e) => setContent({ ...content, about_title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nossa História
            </label>
            <textarea
              value={content.about_story || 'Marisol nasceu da paixão pela moda elegante e atemporal...'}
              onChange={(e) => setContent({ ...content, about_story: e.target.value })}
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Imagem Principal
            </label>
            <input
              type="text"
              value={content.about_image || ''}
              onChange={(e) => setContent({ ...content, about_image: e.target.value })}
              placeholder="https://..."
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
            {content.about_image && (
              <div className="mt-3">
                <img src={content.about_image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Logos de Confiança (URLs separados por vírgula)
            </label>
            <textarea
              value={content.trust_logos || ''}
              onChange={(e) => setContent({ ...content, trust_logos: e.target.value })}
              rows={3}
              placeholder="https://logo1.png, https://logo2.png, https://logo3.png"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactEditor = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-mail-line mr-2 text-green-500"></i>
          Página de Contacto
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email de Contacto
            </label>
            <input
              type="email"
              value={content.contact_email || 'contacto@marisol.com'}
              onChange={(e) => setContent({ ...content, contact_email: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Telefone
            </label>
            <input
              type="text"
              value={content.contact_phone || '+352 123 456 789'}
              onChange={(e) => setContent({ ...content, contact_phone: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Morada
            </label>
            <input
              type="text"
              value={content.contact_address || 'Rua da Moda, 123, Luxemburgo'}
              onChange={(e) => setContent({ ...content, contact_address: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Horário de Atendimento
            </label>
            <input
              type="text"
              value={content.business_hours || '8:30 - 18:00'}
              onChange={(e) => setContent({ ...content, business_hours: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Redes Sociais
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={content.facebook_url || ''}
                onChange={(e) => setContent({ ...content, facebook_url: e.target.value })}
                placeholder="Facebook URL"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
              <input
                type="text"
                value={content.instagram_url || ''}
                onChange={(e) => setContent({ ...content, instagram_url: e.target.value })}
                placeholder="Instagram URL"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
              <input
                type="text"
                value={content.vinted_url || ''}
                onChange={(e) => setContent({ ...content, vinted_url: e.target.value })}
                placeholder="Vinted URL"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCheckoutEditor = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-shopping-cart-line mr-2 text-purple-500"></i>
          Página de Checkout
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título
            </label>
            <input
              type="text"
              value={content.checkout_title || 'Finalizar Compra'}
              onChange={(e) => setContent({ ...content, checkout_title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mensagem de Sucesso
            </label>
            <textarea
              value={content.checkout_success_message || 'Encomenda Confirmada! Obrigado pela sua compra.'}
              onChange={(e) => setContent({ ...content, checkout_success_message: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mensagem de Erro
            </label>
            <textarea
              value={content.checkout_error_message || 'Pagamento Cancelado. Nenhum valor foi cobrado.'}
              onChange={(e) => setContent({ ...content, checkout_error_message: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCartEditor = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-shopping-bag-line mr-2 text-orange-500"></i>
          Página do Carrinho
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título
            </label>
            <input
              type="text"
              value={content.cart_title || 'O Seu Carrinho'}
              onChange={(e) => setContent({ ...content, cart_title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mensagem Carrinho Vazio
            </label>
            <input
              type="text"
              value={content.cart_empty_message || 'O seu carrinho está vazio'}
              onChange={(e) => setContent({ ...content, cart_empty_message: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Valor para Envio Grátis (€)
            </label>
            <input
              type="number"
              value={content.free_shipping_threshold || 80}
              onChange={(e) => setContent({ ...content, free_shipping_threshold: parseFloat(e.target.value) })}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mensagem Progresso Envio
            </label>
            <input
              type="text"
              value={content.shipping_progress_message || 'Faltam €{amount} até envio grátis'}
              onChange={(e) => setContent({ ...content, shipping_progress_message: e.target.value })}
              placeholder="Use {amount} para o valor"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
        </div>
      </div>
    </div>
  );

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
          <i className="ri-file-edit-line mr-3 text-pink-600"></i>
          Editor de Conteúdo do Site
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Edite todo o conteúdo do site Marisol em um só lugar
        </p>
      </div>

      {/* Page Selector */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-2 shadow-sm border mb-8 overflow-x-auto`}>
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActivePage('home')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activePage === 'home'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-home-line mr-2"></i>Início
          </button>
          <button
            onClick={() => setActivePage('about')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activePage === 'about'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-information-line mr-2"></i>Sobre Nós
          </button>
          <button
            onClick={() => setActivePage('contact')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activePage === 'contact'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-mail-line mr-2"></i>Contacto
          </button>
          <button
            onClick={() => setActivePage('cart')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activePage === 'cart'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-shopping-bag-line mr-2"></i>Carrinho
          </button>
          <button
            onClick={() => setActivePage('checkout')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activePage === 'checkout'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-shopping-cart-line mr-2"></i>Checkout
          </button>
        </div>
      </div>

      {/* Content Editor */}
      {activePage === 'home' && renderHomeEditor()}
      {activePage === 'about' && renderAboutEditor()}
      {activePage === 'contact' && renderContactEditor()}
      {activePage === 'cart' && renderCartEditor()}
      {activePage === 'checkout' && renderCheckoutEditor()}

      {/* Save Button */}
      <div className="mt-8">
        <button
          onClick={saveContent}
          disabled={saving}
          className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {saving ? (
            <><i className="ri-loader-4-line animate-spin mr-2"></i>A guardar...</>
          ) : (
            <><i className="ri-save-line mr-2"></i>Guardar Alterações e Aplicar ao Site</>
          )}
        </button>
      </div>
    </div>
  );
}
