import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function CartPage() {
  const { t } = useTranslation('common');
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  // 🔥 CARREGAR CONFIGURAÇÕES DE ENVIO E IVA DO DATABASE
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [vatSettings, setVatSettings] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState(5);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50);
  const [vatAmount, setVatAmount] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatIncluded, setVatIncluded] = useState(true);

  // 🔥 PRODUTOS RECOMENDADOS DO DATABASE
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  useEffect(() => {
    loadShippingAndVatSettings();
    loadRecommendedProducts();
  }, [total]);

  const loadShippingAndVatSettings = async () => {
    try {
      // Carregar configurações de IVA & Envio
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'tax_shipping_settings')
        .maybeSingle();

      if (data && data.value) {
        const settings = data.value;
        
        // Configurações de Envio
        if (settings.shippingZones && settings.shippingZones.length > 0) {
          // Usar primeira zona ativa (Luxemburgo por padrão)
          const defaultZone = settings.shippingZones.find((z: any) => z.enabled) || settings.shippingZones[0];
          setShippingCost(defaultZone.cost || 5);
          setFreeShippingThreshold(defaultZone.free_shipping_threshold || 50);
        }

        // Configurações de IVA
        if (settings.taxEnabled !== undefined) {
          setVatEnabled(settings.taxEnabled);
          setVatIncluded(settings.taxCalculation === 'included');
          
          // Se IVA está incluído, mostrar apenas informação
          // Se IVA é calculado no checkout, calcular aqui (para pré-visualização)
          if (settings.taxEnabled && settings.taxCalculation !== 'included') {
            // Taxa padrão Luxemburgo: 17%
            const defaultRate = 0.17;
            setVatAmount(total * defaultRate);
          }
        }

        setShippingSettings(settings);
        setVatSettings(settings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      // Carregar 4 produtos aleatórios ativos
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(4);

      if (data && !error) {
        setRecommendedProducts(data);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos recomendados:', error);
    }
  };

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = total;
  
  // ❌ REMOVIDO: Cálculo de envio no carrinho
  // O envio só será calculado no checkout após o cliente inserir o endereço
  
  // Calcular quanto falta para envio grátis (baseado nos limites mínimos conhecidos)
  const minFreeShipping = 50; // Mínimo para envio grátis (Luxemburgo)
  const amountUntilFreeShipping = Math.max(0, minFreeShipping - subtotal);
  const hasReachedFreeShipping = subtotal >= minFreeShipping;

  // 🔥 CORRIGIDO: Total estimado é APENAS o subtotal dos produtos
  // Envio e IVA serão calculados no checkout
  const finalTotal = total;
  // ✅ FIXO: Limite de envio grátis é €50 para todos os países
  const actualFreeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, actualFreeShippingThreshold - total);
  const progressPercentage = Math.min((total / actualFreeShippingThreshold) * 100, 100);

  const handleCheckout = () => {
    if (!user) {
      setShowLoginMessage(true);
      setTimeout(() => {
        navigate('/login?redirect=/checkout');
      }, 2000);
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-cart-line text-8xl text-gray-300 dark:text-gray-600"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              O seu carrinho está vazio 🤍
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Descubra os nossos produtos e encontre algo especial para si.
            </p>
            <Link
              to="/products"
              className="inline-block px-8 py-4 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors text-base font-semibold whitespace-nowrap cursor-pointer"
            >
              Ir para Produtos
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 mb-8 shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-cart-line text-4xl text-white"></i>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent text-center mb-2">O Meu Carrinho</h1>
            <p className="text-gray-600 dark:text-gray-300 text-center">{items.length} {items.length === 1 ? 'produto' : 'produtos'} no carrinho</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Esquerda - Produtos */}
            <div className="lg:col-span-2">
              {/* Lista de Produtos */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex gap-5 hover:shadow-md transition-shadow"
                  >
                    <Link to={`/product/${item.id.split(/[A-Z]/)[0]}`} className="cursor-pointer flex-shrink-0">
                      <div className="w-28 h-28">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-top rounded-lg"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link to={`/product/${item.id.split(/[A-Z]/)[0]}`} className="cursor-pointer">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 hover:text-pink-500 transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap gap-3 mb-3">
                          {item.size && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              Tamanho: <strong>{item.size}</strong>
                            </span>
                          )}
                          {item.color && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              Cor: <strong>{item.color}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-pink-500 dark:text-pink-400">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                              disabled={item.quantity <= 1}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Diminuir quantidade"
                            >
                              <i className="ri-subtract-line text-lg text-gray-700 dark:text-gray-300"></i>
                            </button>
                            <span className="text-base font-semibold w-10 text-center text-gray-800 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors cursor-pointer"
                              aria-label="Aumentar quantidade"
                            >
                              <i className="ri-add-line text-lg text-gray-700 dark:text-gray-300"></i>
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.size, item.color)}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            aria-label="Remover produto"
                            title="Remover produto"
                          >
                            <i className="ri-delete-bin-line text-xl"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sugestões de Produtos - DO DATABASE */}
              {recommendedProducts.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Talvez também goste</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recommendedProducts.map((product) => {
                      const productPrice = product.is_on_sale && product.sale_price ? product.sale_price : product.price;
                      const hasDiscount = product.is_on_sale && product.sale_price && product.sale_price < product.price;
                      
                      return (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          className="group cursor-pointer"
                        >
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3 aspect-square relative">
                            <img
                              src={product.images?.[0] || product.image_url || 'https://readdy.ai/api/search-image?query=elegant%20feminine%20fashion%20product%20simple%20white%20background%20luxury%20style%20modern%20aesthetic%20soft%20lighting&width=300&height=300&seq=suggest1&orientation=squarish'}
                              alt={product.name_pt || product.name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            />
                            {hasDiscount && product.discount_percentage > 0 && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                -{product.discount_percentage}%
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white mb-1 line-clamp-2">
                            {product.name_pt || product.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {hasDiscount ? (
                              <>
                                <p className="text-base font-bold text-pink-500 dark:text-pink-400">
                                  €{productPrice.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-400 line-through">
                                  €{product.price.toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className="text-base font-bold text-pink-500 dark:text-pink-400">
                                €{productPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita - Resumo */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-pink-100 dark:border-gray-700 sticky top-32">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Resumo da Encomenda
                </h2>

                {/* Barra de Progresso - Envio Grátis */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 border border-pink-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="ri-truck-line text-2xl text-pink-500 dark:text-pink-400"></i>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        {total >= actualFreeShippingThreshold ? (
                          <span className="text-green-600 dark:text-green-400">🎉 Envio gratuito!</span>
                        ) : (
                          <span>
                            Faltam <span className="text-pink-500 dark:text-pink-400 font-bold">€{remainingForFreeShipping.toFixed(2)}</span> até envio grátis
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700 dark:text-gray-300">Envio</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Calculado no checkout
                    </span>
                  </div>
                  
                  {/* Aviso informativo sobre envio */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start">
                      <i className="ri-information-line text-blue-600 dark:text-blue-400 mr-2 mt-0.5"></i>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        O custo de envio será calculado após inserir o endereço de entrega no checkout
                      </p>
                    </div>
                  </div>
                  
                  {/* 🔥 IVA - NÃO MOSTRAR NO CARRINHO */}
                  {/* O IVA será mostrado apenas no checkout */}
                  
                  <div className="border-t border-pink-200 dark:border-gray-600 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      Total Estimado
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    + envio (a calcular no checkout)
                  </p>
                </div>

                {showLoginMessage && (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 text-center">
                      Para finalizar a compra, é necessário iniciar sessão ou criar uma conta.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate('/checkout')}
                  disabled={items.length === 0}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-lg whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg transform active:scale-95"
                >
                  Finalizar Compra
                </button>

                <Link
                  to="/products"
                  className="block w-full px-6 py-3 mt-4 border-2 border-pink-400 dark:border-pink-500 text-pink-500 dark:text-pink-400 text-center rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-base font-semibold whitespace-nowrap cursor-pointer"
                >
                  Continuar a Comprar
                </Link>

                {/* Garantias de Confiança */}
                <div className="mt-8 pt-6 border-t border-pink-200 dark:border-gray-600">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 text-center">Métodos de Pagamento Aceites</h3>
                  <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <i className="ri-visa-line text-2xl text-blue-600"></i>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <i className="ri-mastercard-line text-2xl text-orange-600"></i>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <i className="ri-google-line text-2xl text-red-600"></i>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <i className="ri-apple-line text-2xl text-gray-800 dark:text-white"></i>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="ri-shield-check-line text-xl text-green-600 dark:text-green-400"></i>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Pagamento seguro</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="ri-truck-line text-xl text-blue-600 dark:text-blue-400"></i>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Envio rápido</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="ri-arrow-left-right-line text-xl text-purple-600 dark:text-purple-400"></i>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Devoluções simples</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4">
                    A sua compra está protegida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
