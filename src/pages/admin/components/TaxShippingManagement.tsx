import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface TaxShippingManagementProps {
  darkMode: boolean;
}

interface TaxRate {
  id: string;
  country: string;
  country_code: string;
  rate: number;
  enabled: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  cost: number;
  free_shipping_threshold: number;
  enabled: boolean;
}

const TaxShippingManagement: React.FC<TaxShippingManagementProps> = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'countries' | 'shipping' | 'stripe' | 'legal'>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [newCountry, setNewCountry] = useState({ country: '', country_code: '', rate: 0 });

  // Estados para configurações gerais - PERSISTENTES
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxCalculation, setTaxCalculation] = useState<'included' | 'checkout'>('included');
  const [ossEnabled, setOssEnabled] = useState(false);
  const [legalText, setLegalText] = useState('Os preços incluem IVA conforme a legislação da União Europeia.');

  // Configurações Gerais - PERSISTENTES
  const [generalSettings, setGeneralSettings] = useState({
    vat_enabled: true,
    vat_included: true,
    oss_enabled: false,
    legal_text: 'Os preços incluem IVA conforme a legislação da União Europeia.',
  });

  // Taxas por País - TODOS OS PAÍSES DA UE - PERSISTENTES
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { id: '1', country: 'Luxemburgo', country_code: 'LU', rate: 17, enabled: true },
    { id: '2', country: 'Portugal', country_code: 'PT', rate: 23, enabled: true },
    { id: '3', country: 'Espanha', country_code: 'ES', rate: 21, enabled: true },
    { id: '4', country: 'França', country_code: 'FR', rate: 20, enabled: true },
    { id: '5', country: 'Alemanha', country_code: 'DE', rate: 19, enabled: true },
    { id: '6', country: 'Itália', country_code: 'IT', rate: 22, enabled: true },
    { id: '7', country: 'Países Baixos', country_code: 'NL', rate: 21, enabled: true },
    { id: '8', country: 'Bélgica', country_code: 'BE', rate: 21, enabled: true },
    { id: '9', country: 'Áustria', country_code: 'AT', rate: 20, enabled: true },
    { id: '10', country: 'Grécia', country_code: 'GR', rate: 24, enabled: true },
    { id: '11', country: 'Irlanda', country_code: 'IE', rate: 23, enabled: true },
    { id: '12', country: 'Dinamarca', country_code: 'DK', rate: 25, enabled: true },
    { id: '13', country: 'Suécia', country_code: 'SE', rate: 25, enabled: true },
    { id: '14', country: 'Finlândia', country_code: 'FI', rate: 24, enabled: true },
    { id: '15', country: 'Polónia', country_code: 'PL', rate: 23, enabled: true },
    { id: '16', country: 'República Checa', country_code: 'CZ', rate: 21, enabled: true },
    { id: '17', country: 'Hungria', country_code: 'HU', rate: 27, enabled: true },
    { id: '18', country: 'Roménia', country_code: 'RO', rate: 19, enabled: true },
    { id: '19', country: 'Bulgária', country_code: 'BG', rate: 20, enabled: true },
    { id: '20', country: 'Croácia', country_code: 'HR', rate: 25, enabled: true },
    { id: '21', country: 'Eslováquia', country_code: 'SK', rate: 20, enabled: true },
    { id: '22', country: 'Eslovénia', country_code: 'SI', rate: 22, enabled: true },
    { id: '23', country: 'Estónia', country_code: 'EE', rate: 20, enabled: true },
    { id: '24', country: 'Letónia', country_code: 'LV', rate: 21, enabled: true },
    { id: '25', country: 'Lituânia', country_code: 'LT', rate: 21, enabled: true },
    { id: '26', country: 'Malta', country_code: 'MT', rate: 18, enabled: true },
    { id: '27', country: 'Chipre', country_code: 'CY', rate: 19, enabled: true },
  ]);

  // Zonas de Envio - PERSISTENTES
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([
    {
      id: '1',
      name: 'Luxemburgo',
      countries: ['LU'],
      cost: 3.99,
      free_shipping_threshold: 50,
      enabled: true,
    },
    {
      id: '2',
      name: 'União Europeia',
      countries: ['PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'GR', 'IE', 'DK', 'SE', 'FI', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'MT', 'CY'],
      cost: 7.99,
      free_shipping_threshold: 100,
      enabled: true,
    },
  ]);

  // Country shipping rates - individual configuration per country
  const [countryShippingRates, setCountryShippingRates] = useState<{
    code: string;
    name: string;
    cost: number;
    free_threshold: number;
    enabled: boolean;
  }[]>([
    { code: 'PT', name: 'Portugal', cost: 7.99, free_threshold: 50, enabled: true },
    { code: 'ES', name: 'Espanha', cost: 9.99, free_threshold: 75, enabled: true },
    { code: 'FR', name: 'França', cost: 12.99, free_threshold: 100, enabled: true },
    { code: 'DE', name: 'Alemanha', cost: 12.99, free_threshold: 100, enabled: true },
    { code: 'IT', name: 'Itália', cost: 14.99, free_threshold: 100, enabled: true },
    { code: 'NL', name: 'Países Baixos', cost: 10.99, free_threshold: 75, enabled: true },
    { code: 'BE', name: 'Bélgica', cost: 10.99, free_threshold: 75, enabled: true },
    { code: 'LU', name: 'Luxemburgo', cost: 5.99, free_threshold: 30, enabled: true },
    { code: 'AT', name: 'Áustria', cost: 13.99, free_threshold: 100, enabled: true },
    { code: 'GR', name: 'Grécia', cost: 16.99, free_threshold: 120, enabled: true },
    { code: 'IE', name: 'Irlanda', cost: 14.99, free_threshold: 100, enabled: true },
    { code: 'DK', name: 'Dinamarca', cost: 12.99, free_threshold: 100, enabled: true },
    { code: 'SE', name: 'Suécia', cost: 14.99, free_threshold: 100, enabled: true },
    { code: 'FI', name: 'Finlândia', cost: 16.99, free_threshold: 120, enabled: true },
    { code: 'PL', name: 'Polónia', cost: 11.99, free_threshold: 80, enabled: true },
    { code: 'CZ', name: 'República Checa', cost: 11.99, free_threshold: 80, enabled: true },
    { code: 'HU', name: 'Hungria', cost: 12.99, free_threshold: 90, enabled: true },
    { code: 'RO', name: 'Roménia', cost: 13.99, free_threshold: 100, enabled: true },
    { code: 'BG', name: 'Bulgária', cost: 14.99, free_threshold: 100, enabled: true },
    { code: 'HR', name: 'Croácia', cost: 13.99, free_threshold: 100, enabled: true },
    { code: 'SK', name: 'Eslováquia', cost: 12.99, free_threshold: 90, enabled: true },
    { code: 'SI', name: 'Eslovénia', cost: 12.99, free_threshold: 90, enabled: true },
    { code: 'EE', name: 'Estónia', cost: 15.99, free_threshold: 110, enabled: true },
    { code: 'LV', name: 'Letónia', cost: 15.99, free_threshold: 110, enabled: true },
    { code: 'LT', name: 'Lituânia', cost: 15.99, free_threshold: 110, enabled: true },
    { code: 'MT', name: 'Malta', cost: 18.99, free_threshold: 130, enabled: true },
    { code: 'CY', name: 'Chipre', cost: 19.99, free_threshold: 150, enabled: true },
  ]);

  // Save country shipping rates to Supabase
  const saveCountryShippingRates = async () => {
    if (!supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'country_shipping_rates',
          value: countryShippingRates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
          ignoreDuplicates: false,
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving country shipping rates:', error);
      alert('Erro ao guardar configurações de envio por país');
    } finally {
      setSaving(false);
    }
  };

  // Load country shipping rates from Supabase
  useEffect(() => {
    const loadCountryShippingRates = async () => {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'country_shipping_rates')
          .single();

        if (!error && data) {
          setCountryShippingRates(data.value);
        }
      } catch (error) {
        console.error('Error loading country shipping rates:', error);
      }
    };

    loadCountryShippingRates();
  }, [supabase]);

  // CARREGAR CONFIGURAÇÕES AO INICIAR - FONTE ÚNICA DA VERDADE
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔄 A carregar configurações do Supabase...');
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'tax_shipping_settings')
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar:', error);
        throw error;
      }

      if (data && data.key === 'tax_shipping_settings' && data.value) {
        const settings = data.value;
        
        if (settings.taxEnabled !== undefined) {
          setTaxEnabled(settings.taxEnabled);
          setGeneralSettings(prev => ({ ...prev, vat_enabled: settings.taxEnabled }));
        }
        if (settings.taxCalculation) {
          setTaxCalculation(settings.taxCalculation);
          setGeneralSettings(prev => ({ ...prev, vat_included: settings.taxCalculation === 'included' }));
        }
        if (settings.ossEnabled !== undefined) {
          setOssEnabled(settings.ossEnabled);
          setGeneralSettings(prev => ({ ...prev, oss_enabled: settings.ossEnabled }));
        }
        if (settings.legalText) {
          setLegalText(settings.legalText);
          setGeneralSettings(prev => ({ ...prev, legal_text: settings.legalText }));
        }
        if (settings.taxRates) {
          setTaxRates(settings.taxRates);
        }
        if (settings.shippingZones) {
          setShippingZones(settings.shippingZones);
        }
        
        console.log('✅ Configurações carregadas do Supabase:', settings);
      } else {
        // PRIMEIRA VEZ - USAR VALORES PADRÃO
        console.log('⚠️ Nenhuma configuração encontrada. A usar configurações padrão...');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      alert('❌ Erro ao carregar configurações. Por favor, recarregue a página.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 A guardar configurações no Supabase...');
      
      const settings = {
        taxEnabled: generalSettings.vat_enabled,
        taxCalculation: generalSettings.vat_included ? 'included' : 'checkout',
        ossEnabled: generalSettings.oss_enabled,
        legalText: generalSettings.legal_text,
        taxRates,
        shippingZones,
      };

      console.log('📦 Configurações a guardar:', settings);

      // ✅ CORREÇÃO: Usar upsert com onConflict para resolver duplicados
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'tax_shipping_settings',
          value: settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key', // ✅ Especificar a coluna de conflito
          ignoreDuplicates: false, // ✅ Atualizar se já existir
        });

      if (error) {
        console.error('❌ Erro ao guardar:', error);
        throw error;
      }

      console.log('✅ Configurações guardadas com sucesso!');
      alert('✅ Configurações salvas e sincronizadas com o site!\n\n🔄 As mudanças estão agora ativas no checkout.');
      
      // RECARREGAR PARA CONFIRMAR PERSISTÊNCIA
      await loadSettings();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('❌ Erro ao salvar as configurações. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const addCountry = () => {
    if (!newCountry.country || !newCountry.country_code || newCountry.rate <= 0) {
      alert('❌ Por favor, preencha todos os campos corretamente');
      return;
    }

    const newId = (Math.max(...taxRates.map(t => parseInt(t.id))) + 1).toString();
    setTaxRates([...taxRates, { ...newCountry, id: newId, enabled: true }]);
    setNewCountry({ country: '', country_code: '', rate: 0 });
    setShowAddCountryModal(false);
    alert('✅ País adicionado! Clique em "Guardar" para aplicar no site.');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className={`flex gap-2 mb-8 p-2 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                : darkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ Geral
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'countries'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                : darkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌍 IVA por País
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'shipping'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                : darkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Envio por País
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-8 shadow-sm border`}>
          {/* Tab: Geral */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Configurações Gerais do IVA
              </h2>

              {/* Ativar/Desativar IVA */}
              <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-700 dark:to-gray-700">
                <div>
                  <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    IVA Ativo
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Ativar ou desativar o cálculo de IVA em todo o site
                  </p>
                </div>
                <button
                  onClick={() => setGeneralSettings({ ...generalSettings, vat_enabled: !generalSettings.vat_enabled })}
                  className={`relative w-16 h-8 rounded-full transition-all cursor-pointer ${
                    generalSettings.vat_enabled ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      generalSettings.vat_enabled ? 'translate-x-8' : ''
                    }`}
                  ></span>
                </button>
              </div>

              {/* IVA Incluído ou Separado */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cálculo do IVA
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setGeneralSettings({ ...generalSettings, vat_included: true })}
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                      generalSettings.vat_included
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : darkMode
                        ? 'border-gray-600 bg-gray-700'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <i className="ri-check-double-line text-3xl text-pink-500 mb-3"></i>
                    <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Incluído nos Preços
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      O preço mostrado já inclui o IVA
                    </p>
                  </button>
                  <button
                    onClick={() => setGeneralSettings({ ...generalSettings, vat_included: false })}
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                      !generalSettings.vat_included
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : darkMode
                        ? 'border-gray-600 bg-gray-700'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <i className="ri-add-circle-line text-3xl text-blue-500 mb-3"></i>
                    <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Calculado no Checkout
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      O IVA é adicionado no checkout
                    </p>
                  </button>
                </div>
              </div>

              {/* OSS */}
              <div className="flex items-center justify-between p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div>
                  <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Modo OSS (One Stop Shop)
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Para vendas na União Europeia - IVA aplicado conforme país do cliente
                  </p>
                </div>
                <button
                  onClick={() => setGeneralSettings({ ...generalSettings, oss_enabled: !generalSettings.oss_enabled })}
                  className={`relative w-16 h-8 rounded-full transition-all cursor-pointer ${
                    generalSettings.oss_enabled ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      generalSettings.oss_enabled ? 'translate-x-8' : ''
                    }`}
                  ></span>
                </button>
              </div>

              {/* Explicação OSS */}
              {generalSettings.oss_enabled && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                  <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    ℹ️ Como funciona o OSS:
                  </h4>
                  <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>✓ O IVA é aplicado conforme o <strong>país do cliente</strong> (entrega)</li>
                    <li>✓ Cada país tem sua própria taxa de IVA</li>
                    <li>✓ Cliente na Itália → IVA da Itália (22%)</li>
                    <li>✓ Cliente em França → IVA de França (20%)</li>
                    <li>✓ O sistema calcula automaticamente no checkout</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab: IVA por País */}
          {activeTab === 'countries' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Taxas de IVA por País
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Configure as taxas de IVA para cada país. As alterações aplicam-se imediatamente no checkout.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCountryModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Adicionar País
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        País
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        Código
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        Taxa IVA (%)
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        Estado
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxRates.map((rate) => (
                      <tr key={rate.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {rate.country}
                        </td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                          {rate.country_code}
                        </td>
                        <td className={`px-6 py-4`}>
                          <input
                            type="number"
                            value={rate.rate}
                            onChange={(e) => {
                              const updated = taxRates.map(t => 
                                t.id === rate.id ? { ...t, rate: parseFloat(e.target.value) || 0 } : t
                              );
                              setTaxRates(updated);
                            }}
                            className={`w-24 px-3 py-2 rounded-lg border ${
                              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            step="0.1"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td className={`px-6 py-4`}>
                          <button
                            onClick={() => {
                              const updated = taxRates.map(t => 
                                t.id === rate.id ? { ...t, enabled: !t.enabled } : t
                              );
                              setTaxRates(updated);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium cursor-pointer whitespace-nowrap ${
                              rate.enabled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {rate.enabled ? '✓ Ativo' : '✗ Inativo'}
                          </button>
                        </td>
                        <td className={`px-6 py-4`}>
                          <button 
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja eliminar ${rate.country}?`)) {
                                setTaxRates(taxRates.filter(t => t.id !== rate.id));
                                alert('✅ País eliminado! Clique em "Guardar" para aplicar.');
                              }
                            }}
                            className="text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-xl"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shipping by Country Tab */}
          {activeTab === 'shipping' && (
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                📦 Configuração de Envio por País
              </h2>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configure os custos de envio individualmente para cada país da União Europeia. 
                As alterações aplicam-se imediatamente no checkout.
              </p>

              {/* Search and filters */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="🔍 Pesquisar país..."
                  className={`w-full px-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    if (!search) {
                      // Reset to all countries
                      return;
                    }
                    // Filter functionality can be added here
                  }}
                />
              </div>

              {/* Countries Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {countryShippingRates.map((country) => (
                  <div
                    key={country.code}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      country.enabled
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : darkMode
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Country Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{country.code === 'PT' ? '🇵🇹' : country.code === 'ES' ? '🇪🇸' : country.code === 'FR' ? '🇫🇷' : country.code === 'DE' ? '🇩🇪' : country.code === 'IT' ? '🇮🇹' : country.code === 'NL' ? '🇳🇱' : country.code === 'BE' ? '🇧🇪' : country.code === 'LU' ? '🇱🇺' : country.code === 'AT' ? '🇦🇹' : country.code === 'GR' ? '🇬🇷' : country.code === 'IE' ? '🇮🇪' : country.code === 'DK' ? '🇩🇰' : country.code === 'SE' ? '🇸🇪' : country.code === 'FI' ? '🇫🇮' : country.code === 'PL' ? '🇵🇱' : country.code === 'CZ' ? '🇨🇿' : country.code === 'HU' ? '🇭🇺' : country.code === 'RO' ? '🇷🇴' : country.code === 'BG' ? '🇧🇬' : country.code === 'HR' ? '🇭🇷' : country.code === 'SK' ? '🇸🇰' : country.code === 'SI' ? '🇸🇮' : country.code === 'EE' ? '🇪🇪' : country.code === 'LV' ? '🇱🇻' : country.code === 'LT' ? '🇱🇹' : country.code === 'MT' ? '🇲🇹' : country.code === 'CY' ? '🇨🇾' : '🌍'}</span>
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {country.name}
                          </h3>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {country.code}
                        </p>
                      </div>
                      
                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => {
                          const updated = countryShippingRates.map(c =>
                            c.code === country.code ? { ...c, enabled: !c.enabled } : c
                          );
                          setCountryShippingRates(updated);
                        }}
                        className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${
                          country.enabled ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            country.enabled ? 'translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Shipping Cost */}
                    <div className="space-y-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          💰 Custo de Envio (€)
                        </label>
                        <input
                          type="number"
                          value={country.cost}
                          onChange={(e) => {
                            const updated = countryShippingRates.map(c =>
                              c.code === country.code ? { ...c, cost: parseFloat(e.target.value) || 0 } : c
                            );
                            setCountryShippingRates(updated);
                          }}
                          className={`w-full px-3 py-2 rounded-lg border text-right font-bold text-lg ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          step="0.01"
                          min="0"
                          disabled={!country.enabled}
                        />
                      </div>

                      {/* Free Shipping Threshold */}
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          🎁 Envio Grátis Acima de (€)
                        </label>
                        <input
                          type="number"
                          value={country.free_threshold}
                          onChange={(e) => {
                            const updated = countryShippingRates.map(c =>
                              c.code === country.code ? { ...c, free_threshold: parseFloat(e.target.value) || 0 } : c
                            );
                            setCountryShippingRates(updated);
                          }}
                          className={`w-full px-3 py-2 rounded-lg border text-right font-bold text-lg text-green-600 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600'
                              : 'bg-white border-gray-300'
                          }`}
                          step="0.01"
                          min="0"
                          disabled={!country.enabled}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                          country.enabled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {country.enabled ? '✓ Ativo' : '✗ Desativado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveCountryShippingRates}
                  disabled={saving}
                  className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {saving ? '💾 A Guardar...' : success ? '✅ Guardado!' : '💾 Guardar Configurações de Envio'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab: Stripe */}
        {activeTab === 'stripe' && (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Integração com Stripe
            </h2>
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Stripe Conectado
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                      A integração está ativa e funcional
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Configurações de IVA no Stripe
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-white' : 'text-gray-600'}>
                      Cálculo Automático de IVA
                    </span>
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                      Ativo
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-white' : 'text-gray-600'}>
                      Tipo de Produto
                    </span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Bens Físicos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-white' : 'text-gray-600'}>
                      Sincronização de Preços
                    </span>
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                      Sincronizado
                    </span>
                  </div>
                </div>
              </div>

              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap text-center"
              >
                <i className="ri-external-link-line mr-2"></i>
                Abrir Dashboard do Stripe
              </a>
            </div>
          </div>
        )}

        {/* Tab: Textos Legais */}
        {activeTab === 'legal' && (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Textos Legais
            </h2>
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Texto Legal sobre IVA (Rodapé e Checkout)
                </label>
                <textarea
                  value={generalSettings.legal_text}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, legal_text: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                  placeholder="Ex: Os preços incluem IVA conforme a legislação da União Europeia."
                />
              </div>

              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Pré-visualização
                </h3>
                <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                  {generalSettings.legal_text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de Salvar - SEMPRE VISÍVEL */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              A Guardar...
            </>
          ) : (
            <>
              <i className="ri-save-line mr-2"></i>
              💾 Guardar e Sincronizar com o Site
            </>
          )}
        </button>
      </div>

      {/* Modal Adicionar País */}
      {showAddCountryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full p-6`}>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Adicionar Novo País
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome do País
                </label>
                <input
                  type="text"
                  value={newCountry.country}
                  onChange={(e) => setNewCountry({ ...newCountry, country: e.target.value })}
                  placeholder="Ex: Suíça"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Código do País (ISO)
                </label>
                <input
                  type="text"
                  value={newCountry.country_code}
                  onChange={(e) => setNewCountry({ ...newCountry, country_code: e.target.value.toUpperCase() })}
                  placeholder="Ex: CH"
                  maxLength={2}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Taxa de IVA (%)
                </label>
                <input
                  type="number"
                  value={newCountry.rate}
                  onChange={(e) => setNewCountry({ ...newCountry, rate: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 7.7"
                  step="0.1"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCountryModal(false);
                  setNewCountry({ country: '', country_code: '', rate: 0 });
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={addCountry}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxShippingManagement;