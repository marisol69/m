import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Dados de envio
  const [shippingData, setShippingData] = useState({
    full_name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'PT',
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  // NOVO: CONFIGURAÇÕES DE ENVIO POR PAÍS DO DATABASE
  const [countryShippingRates, setCountryShippingRates] = useState<any[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  
  // Configurações de IVA
  const [vatSettings, setVatSettings] = useState<any>(null);
  const [vatAmount, setVatAmount] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatIncluded, setVatIncluded] = useState(true);
  const [vatRate, setVatRate] = useState(0);

  // Carregar endereços salvos do utilizador
  useEffect(() => {
    if (user) {
      loadSavedAddresses();
    }
  }, [user]);

  // CARREGAR CONFIGURAÇÕES DE ENVIO POR PAÍS DO DATABASE
  useEffect(() => {
    loadCountryShippingRates();
  }, []);

  // RECALCULAR QUANDO O PAÍS OU TOTAL MUDAR
  useEffect(() => {
    if (countryShippingRates.length > 0) {
      updateShippingCostForCountry(shippingData.country);
    }
  }, [shippingData.country, total, countryShippingRates]);

  // CARREGAR CONFIGURAÇÕES DE IVA
  useEffect(() => {
    loadVatSettings();
  }, [shippingData.country, total, shippingCost]);

  // NOVA FUNÇÃO: Carregar custos de envio por país do database
  const loadCountryShippingRates = async () => {
    try {
      console.log('🔄 A carregar custos de envio por país do database...');
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'country_shipping_rates')
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar custos de envio:', error);
        return;
      }

      if (data && data.value && Array.isArray(data.value)) {
        console.log('✅ Custos de envio carregados:', data.value.length, 'países');
        setCountryShippingRates(data.value);
        
        // Aplicar configuração do país atual
        updateShippingCostForCountry(shippingData.country, data.value);
      } else {
        console.log('⚠️ Nenhuma configuração de envio encontrada no database');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações de envio:', error);
    }
  };

  // NOVA FUNÇÃO: Atualizar custo de envio baseado no país selecionado
  const updateShippingCostForCountry = (countryCode: string, rates?: any[]) => {
    const ratesToUse = rates || countryShippingRates;
    
    if (ratesToUse.length === 0) {
      console.log('⚠️ Sem configurações de envio disponíveis');
      return;
    }

    // Encontrar configuração para o país selecionado
    const countryConfig = ratesToUse.find(
      (c: any) => c.code === countryCode && c.enabled
    );

    if (countryConfig) {
      console.log(`✅ Configuração encontrada para ${countryConfig.name} (${countryCode}):`);
      console.log(`   - Custo de envio: €${countryConfig.cost}`);
      console.log(`   - Envio grátis acima de: €${countryConfig.free_threshold}`);
      
      setShippingCost(countryConfig.cost);
      setFreeShippingThreshold(countryConfig.free_threshold);
    } else {
      console.log(`⚠️ País ${countryCode} não encontrado ou desativado. A usar valores padrão.`);
      setShippingCost(7.99);
      setFreeShippingThreshold(50);
    }
  };

  const loadVatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'tax_shipping_settings')
        .maybeSingle();

      if (data && data.value) {
        const settings = data.value;
        setVatSettings(settings);

        // Configurações de IVA
        if (settings.taxEnabled !== undefined) {
          setVatEnabled(settings.taxEnabled);
          
          const isIncluded = settings.taxCalculation === 'included';
          setVatIncluded(isIncluded);

          if (settings.taxEnabled) {
            // Encontrar taxa de IVA para o país selecionado
            const countryTax = settings.taxRates?.find((t: any) => 
              t.country_code === shippingData.country && t.enabled
            );

            const rate = countryTax ? countryTax.rate : 23; // Taxa padrão Portugal: 23%
            setVatRate(rate);

            // Calcular IVA sobre produtos
            if (isIncluded) {
              // IVA JÁ INCLUÍDO: extrair o IVA do subtotal
              const productVat = (total * rate) / (100 + rate);
              setVatAmount(productVat);
            } else {
              // IVA ADICIONADO: calcular IVA sobre o subtotal
              const productVat = total * (rate / 100);
              setVatAmount(productVat);
            }
          } else {
            setVatAmount(0);
            setVatRate(0);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de IVA:', error);
    }
  };

  const loadSavedAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (data && !error) {
        setSavedAddresses(data);
        
        const defaultAddress = data.find(addr => addr.is_default);
        if (defaultAddress) {
          setShippingData({
            full_name: defaultAddress.full_name || user.full_name || '',
            email: user.email || '',
            phone: defaultAddress.phone || user.phone || '',
            street: defaultAddress.street || '',
            city: defaultAddress.city || '',
            postal_code: defaultAddress.postal_code || '',
            country: defaultAddress.country || 'PT',
          });
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const handleAddressSelect = (address: any) => {
    setShippingData({
      full_name: address.full_name || user?.full_name || '',
      email: user?.email || '',
      phone: address.phone || user?.phone || '',
      street: address.street || '',
      city: address.city || '',
      postal_code: address.postal_code || '',
      country: address.country || 'PT',
    });
    setSelectedAddressId(address.id);
    setShowAddressSelector(false);
  };

  // Carregar dados do utilizador se estiver logado
  useEffect(() => {
    if (user && savedAddresses.length === 0) {
      setShippingData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user, savedAddresses]);

  // Redirecionar se carrinho vazio
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const isFormValid = () => {
    if (!shippingData.full_name || !shippingData.email || !shippingData.phone || 
        !shippingData.street || !shippingData.city || !shippingData.postal_code) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingData.email)) {
      return false;
    }

    return true;
  };

  const handleContinueToPayment = () => {
    setErrorMessage('');
    
    if (!isFormValid()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayment = async () => {
    if (!isFormValid()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      console.log('🔄 Iniciando processo de pagamento...');

      const token = await supabase.auth.getSession();
      const authToken = token.data.session?.access_token;

      console.log('🔑 Token obtido:', authToken ? 'Sim' : 'Não');

      const currentUrl = window.location.origin + __BASE_PATH__;
      const successUrl = `${currentUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentUrl}/checkout/error`;

      console.log('🔗 URLs configuradas:', { successUrl, cancelUrl });

      // ENVIAR CONFIGURAÇÕES DE ENVIO E PAÍS PARA O EDGE FUNCTION
      const requestBody = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size,
          color: item.color,
        })),
        shippingAddress: shippingData,
        shippingCountry: shippingData.country,
        saveCardInfo: saveCard,
        successUrl,
        cancelUrl,
      };

      console.log('📦 Dados a enviar:', {
        items: requestBody.items.length,
        email: shippingData.email,
        country: shippingData.country,
        total: total.toFixed(2),
      });

      const headers: any = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('📡 A enviar pedido para Edge Function...');

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('📄 Resposta (texto):', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Resposta (JSON):', data);
      } catch (e) {
        console.error('❌ Erro ao fazer parse da resposta:', e);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        console.error('❌ Erro na resposta:', data);
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      if (!data.success) {
        console.error('❌ Pagamento não teve sucesso:', data);
        throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      }

      if (!data.url) {
        console.error('❌ URL de pagamento não recebida:', data);
        throw new Error('URL de pagamento não disponível');
      }

      console.log('✅ Sessão criada com sucesso!');
      console.log('🆔 Session ID:', data.sessionId);
      console.log('🔗 URL de pagamento:', data.url);
      console.log('💰 Valor:', data.amount);

      console.log('🚀 A redirecionar para Stripe...');
      
      window.location.href = data.url;

    } catch (err: any) {
      console.error('❌ ERRO CRÍTICO:', err);
      console.error('❌ Mensagem:', err.message);
      console.error('❌ Stack:', err.stack);
      
      setErrorMessage(err.message || 'Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  // 🔥 CÁLCULO CORRETO: Aplicar envio grátis se total >= threshold
  const actualShippingCost = total >= freeShippingThreshold ? 0 : shippingCost;
  
  // Cálculo do total final
  let finalTotal = 0;
  let shippingVat = 0;
  
  if (vatEnabled) {
    if (vatIncluded) {
      // IVA JÁ INCLUÍDO
      if (actualShippingCost > 0) {
        shippingVat = (actualShippingCost * vatRate) / (100 + vatRate);
      }
      finalTotal = total + actualShippingCost;
    } else {
      // IVA ADICIONADO
      if (actualShippingCost > 0) {
        shippingVat = actualShippingCost * (vatRate / 100);
      }
      finalTotal = total + vatAmount + actualShippingCost + shippingVat;
    }
  } else {
    finalTotal = total + actualShippingCost;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="flex-1 pt-24 sm:pt-32 pb-12 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Finalizar Compra</h1>
            
            {/* Indicador de Passos */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-sky-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step === 'shipping' ? 'bg-sky-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {step === 'shipping' ? '1' : <i className="ri-check-line"></i>}
                </div>
                <span className="font-semibold">Dados de Envio</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 rounded">
                <div className={`h-full rounded transition-all duration-500 ${
                  step === 'payment' ? 'bg-sky-600 w-full' : 'bg-gray-200 w-0'
                }`}></div>
              </div>
              <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-sky-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step === 'payment' ? 'bg-sky-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="font-semibold">Pagamento</span>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro Global */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="ri-error-warning-line text-xl text-red-600 mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
                </div>
                <button 
                  onClick={() => setErrorMessage('')}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2">
              {step === 'shipping' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border-2 border-sky-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Dados de Envio</h2>
                  
                  {/* Seletor de Endereços Salvos */}
                  {user && savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Endereços Salvos
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddressSelector(!showAddressSelector)}
                          className="text-sm text-sky-600 hover:text-sky-700 cursor-pointer font-medium"
                        >
                          {showAddressSelector ? 'Ocultar' : 'Escolher endereço'}
                        </button>
                      </div>
                      
                      {showAddressSelector && (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-sky-50">
                          {savedAddresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => handleAddressSelect(address)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                selectedAddressId === address.id
                                  ? 'border-sky-500 bg-sky-100'
                                  : 'border-gray-200 bg-white hover:border-sky-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{address.full_name}</p>
                                  <p className="text-sm text-gray-600 mt-1">{address.street}</p>
                                  <p className="text-sm text-gray-600">
                                    {address.postal_code} {address.city}, {address.country}
                                  </p>
                                  {address.phone && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      <i className="ri-phone-line mr-1"></i>
                                      {address.phone}
                                    </p>
                                  )}
                                </div>
                                {address.is_default && (
                                  <span className="text-xs bg-sky-500 text-white px-2 py-1 rounded-full">
                                    Padrão
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={shippingData.full_name}
                        onChange={(e) => setShippingData({ ...shippingData, full_name: e.target.value })}
                        className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={shippingData.email}
                          onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone *
                        </label>
                        <input
                          type="tel"
                          value={shippingData.phone}
                          onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                          placeholder="+351 xxx xxx xxx"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Morada Completa *
                      </label>
                      <input
                        type="text"
                        value={shippingData.street}
                        onChange={(e) => setShippingData({ ...shippingData, street: e.target.value })}
                        className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        placeholder="Rua, número, andar"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          value={shippingData.city}
                          onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                          className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código Postal *
                        </label>
                        <input
                          type="text"
                          value={shippingData.postal_code}
                          onChange={(e) => setShippingData({ ...shippingData, postal_code: e.target.value })}
                          className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          País *
                        </label>
                        <select
                          value={shippingData.country}
                          onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                          className="w-full px-4 py-3 bg-sky-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent cursor-pointer transition-all"
                          required
                        >
                          <option value="PT">🇵🇹 Portugal</option>
                          <option value="ES">🇪🇸 Espanha</option>
                          <option value="FR">🇫🇷 França</option>
                          <option value="DE">🇩🇪 Alemanha</option>
                          <option value="IT">🇮🇹 Itália</option>
                          <option value="NL">🇳🇱 Países Baixos</option>
                          <option value="BE">🇧🇪 Bélgica</option>
                          <option value="LU">🇱🇺 Luxemburgo</option>
                          <option value="AT">🇦🇹 Áustria</option>
                          <option value="GR">🇬🇷 Grécia</option>
                          <option value="IE">🇮🇪 Irlanda</option>
                          <option value="DK">🇩🇰 Dinamarca</option>
                          <option value="SE">🇸🇪 Suécia</option>
                          <option value="FI">🇫🇮 Finlândia</option>
                          <option value="PL">🇵🇱 Polónia</option>
                          <option value="CZ">🇨🇿 República Checa</option>
                          <option value="HU">🇭🇺 Hungria</option>
                          <option value="RO">🇷🇴 Roménia</option>
                          <option value="BG">🇧🇬 Bulgária</option>
                          <option value="HR">🇭🇷 Croácia</option>
                          <option value="SK">🇸🇰 Eslováquia</option>
                          <option value="SI">🇸🇮 Eslovénia</option>
                          <option value="EE">🇪🇪 Estónia</option>
                          <option value="LV">🇱🇻 Letónia</option>
                          <option value="LT">🇱🇹 Lituânia</option>
                          <option value="MT">🇲🇹 Malta</option>
                          <option value="CY">🇨🇾 Chipre</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleContinueToPayment}
                      disabled={!isFormValid()}
                      className="w-full px-8 py-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 text-base font-bold shadow-lg shadow-sky-300/50 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-400/60 active:scale-95"
                    >
                      <span className="flex items-center justify-center gap-3">
                        Continuar para Pagamento Seguro
                        <i className="ri-arrow-right-line text-xl"></i>
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border-2 border-sky-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Pagamento Seguro</h2>
                    <button
                      onClick={() => setStep('shipping')}
                      disabled={loading}
                      className="text-sky-600 hover:text-blue-700 font-medium cursor-pointer hover:underline transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-left-line mr-1"></i>
                      Voltar
                    </button>
                  </div>

                  {/* Métodos de Pagamento */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Métodos de Pagamento Aceites</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-sky-50 to-blue-100 p-4 rounded-xl border-2 border-sky-300 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer hover:shadow-lg">
                        <i className="ri-bank-card-line text-3xl text-sky-600"></i>
                      </div>
                      <div className="bg-gradient-to-br from-sky-50 to-blue-100 p-4 rounded-xl border-2 border-sky-300 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer hover:shadow-lg">
                        <i className="ri-mastercard-line text-3xl text-sky-600"></i>
                      </div>
                      <div className="bg-gradient-to-br from-sky-50 to-blue-100 p-4 rounded-xl border-2 border-sky-300 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer hover:shadow-lg">
                        <i className="ri-google-line text-3xl text-sky-600"></i>
                      </div>
                      <div className="bg-gradient-to-br from-sky-50 to-blue-100 p-4 rounded-xl border-2 border-sky-300 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer hover:shadow-lg">
                        <i className="ri-apple-line text-3xl text-sky-600"></i>
                      </div>
                    </div>
                  </div>

                  {/* Garantias de Segurança */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <i className="ri-shield-check-line text-3xl text-green-600"></i>
                      <div>
                        <h4 className="font-bold text-green-900 mb-2">Pagamento 100% Seguro</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>✓ Encriptação SSL de nível bancário</li>
                          <li>✓ Conformidade PCI DSS Nível 1</li>
                          <li>✓ Autenticação 3D Secure</li>
                          <li>✓ Processamento seguro pela tecnologia líder mundial</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Resumo dos Dados */}
                  <div className="bg-sky-50 p-4 rounded-xl mb-6 border-2 border-sky-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Dados de Envio</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Nome:</strong> {shippingData.full_name}</p>
                      <p><strong>Email:</strong> {shippingData.email}</p>
                      <p><strong>Telefone:</strong> {shippingData.phone}</p>
                      <p><strong>Morada:</strong> {shippingData.street}, {shippingData.city}, {shippingData.postal_code}, {shippingData.country}</p>
                    </div>
                  </div>

                  {/* Opção de guardar cartão */}
                  {user && (
                    <div className="mb-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-5 h-5 text-sky-600 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">Guardar informações de pagamento para compras futuras</span>
                      </label>
                    </div>
                  )}

                  {/* Botão de Pagamento */}
                  <button
                    onClick={handlePayment}
                    disabled={loading || !isFormValid()}
                    className="w-full px-8 py-5 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-xl hover:from-sky-700 hover:to-blue-800 transition-all duration-300 font-bold text-lg shadow-xl shadow-sky-300/50 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-400/60 active:scale-95"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <i className="ri-loader-4-line animate-spin text-2xl"></i>
                        A processar pagamento seguro...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <i className="ri-lock-line text-xl"></i>
                        Pagar €{finalTotal.toFixed(2)} com Segurança
                      </span>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    Ao clicar em "Pagar", será redirecionado para uma página de pagamento segura
                  </p>
                </div>
              )}
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-sky-200 sticky top-24">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-gray-600">Qtd: {item.quantity}</p>
                        <p className="text-sm font-semibold text-sky-600">€{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mb-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* 🔥 NOVO: Mostrar custo de envio dinâmico por país */}
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">
                      Envio ({countryShippingRates.find(c => c.code === shippingData.country)?.name || shippingData.country})
                    </span>
                    <span className="font-semibold text-gray-800">
                      {actualShippingCost === 0 ? (
                        <span className="text-green-600 font-bold">Grátis 🎉</span>
                      ) : (
                        `€${actualShippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  {/* Aviso de envio grátis */}
                  {total < freeShippingThreshold && freeShippingThreshold > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-700">
                        💡 Faltam <strong>€{(freeShippingThreshold - total).toFixed(2)}</strong> para envio grátis em {countryShippingRates.find(c => c.code === shippingData.country)?.name || shippingData.country}!
                      </p>
                    </div>
                  )}
                  
                  {/* IVA */}
                  {vatEnabled && vatRate > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-gray-700">
                        IVA ({vatRate}%) - {shippingData.country}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {vatIncluded ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <span className="text-gray-600">€{(vatAmount + shippingVat).toFixed(2)}</span>
                            <span className="text-xs">(incluído)</span>
                          </span>
                        ) : (
                          <span className="text-sky-600">€{(vatAmount + shippingVat).toFixed(2)}</span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">
                      Total
                    </span>
                    <span className="text-3xl font-bold text-sky-600">
                      €{finalTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Texto legal sobre IVA */}
                  {vatEnabled && (
                    <div className="pt-2 border-t border-gray-200">
                      {vatIncluded ? (
                        <p className="text-xs text-gray-500 text-center">
                          {vatSettings?.legalText || 'Os preços incluem IVA conforme a legislação da União Europeia.'}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 text-center">
                          O IVA foi calculado conforme o país de entrega selecionado ({shippingData.country}).
                        </p>
                      )}
                      
                      {/* Breakdown do IVA */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium mb-2 text-center">
                          📊 Detalhes do IVA:
                        </p>
                        <div className="space-y-1 text-xs text-blue-600">
                          {vatIncluded ? (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal produtos:</span>
                                <span className="font-semibold">€{total.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-blue-500 text-[10px]">
                                <span className="pl-2">• Base (sem IVA):</span>
                                <span>€{(total - vatAmount).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-blue-500 text-[10px]">
                                <span className="pl-2">• IVA ({vatRate}%):</span>
                                <span>€{vatAmount.toFixed(2)}</span>
                              </div>
                              
                              {actualShippingCost > 0 && (
                                <>
                                  <div className="flex justify-between mt-2">
                                    <span>Envio:</span>
                                    <span className="font-semibold">€{actualShippingCost.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-blue-500 text-[10px]">
                                    <span className="pl-2">• Base (sem IVA):</span>
                                    <span>€{(actualShippingCost - shippingVat).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-blue-500 text-[10px]">
                                    <span className="pl-2">• IVA ({vatRate}%):</span>
                                    <span>€{shippingVat.toFixed(2)}</span>
                                  </div>
                                </>
                              )}
                              
                              <div className="flex justify-between border-t border-blue-200 pt-1 mt-2">
                                <span className="font-medium">IVA total incluído:</span>
                                <span className="font-bold text-green-600">€{(vatAmount + shippingVat).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-blue-200 pt-1">
                                <span className="font-medium">Total a pagar:</span>
                                <span className="font-bold">€{finalTotal.toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal (sem IVA):</span>
                                <span className="font-semibold">€{total.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>IVA sobre produtos ({vatRate}%):</span>
                                <span className="font-semibold text-sky-600">+ €{vatAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Envio:</span>
                                <span className="font-semibold">
                                  {actualShippingCost === 0 ? 'Grátis' : `+ €${actualShippingCost.toFixed(2)}`}
                                </span>
                              </div>
                              {actualShippingCost > 0 && shippingVat > 0 && (
                                <div className="flex justify-between">
                                  <span>IVA sobre envio ({vatRate}%):</span>
                                  <span className="font-semibold text-sky-600">+ €{shippingVat.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-blue-200 pt-1">
                                <span>Total a pagar:</span>
                                <span className="font-bold">€{finalTotal.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suporte ao Cliente */}
                <div className="mt-6 p-4 bg-sky-50 rounded-xl border-2 border-sky-200">
                  <div className="flex items-start gap-3">
                    <i className="ri-customer-service-line text-2xl text-sky-600"></i>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Precisa de Ajuda?</h4>
                      <p className="text-xs text-gray-600 mb-2">Estamos aqui para si!</p>
                      <div className="text-xs text-gray-700 space-y-1">
                        <p>👨‍💼 <strong>Suporte:</strong> 8:30-18:00</p>
                        <p>📞 <strong>Tel:</strong> +352 631 377 168</p>
                        <p>📧 <strong>Email:</strong> contacto@marisol.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
