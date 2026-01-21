import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface SiteConfig {
  id?: string;
  store_name: string;
  store_email: string;
  store_phone: string;
  store_whatsapp: string;
  store_address: string;
  business_hours: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  pinterest_url: string;
  free_shipping_threshold: number;
  currency: string;
  tax_rate: number;
}

interface SiteConfigManagementProps {
  darkMode?: boolean;
}

export default function SiteConfigManagement({ darkMode = false }: SiteConfigManagementProps) {
  const [activeSection, setActiveSection] = useState<'general' | 'integrations' | 'seo'>('general');
  const [config, setConfig] = useState<SiteConfig>({
    store_name: 'Marisol',
    store_email: 'contacto@marisol.com',
    store_phone: '+352 631 377 168',
    store_whatsapp: '+352631377168',
    store_address: 'Luxembourg',
    business_hours: 'Seg-Sex: 8:30-18:00',
    facebook_url: 'https://facebook.com',
    instagram_url: 'https://instagram.com',
    twitter_url: 'https://twitter.com',
    linkedin_url: 'https://linkedin.com',
    pinterest_url: 'https://pinterest.com',
    free_shipping_threshold: 80,
    currency: 'EUR',
    tax_rate: 17,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar:', error);
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update(config)
          .eq('id', existing.id);

        if (error) {
          console.error('Erro ao atualizar:', error);
          throw new Error('Erro ao guardar. Por favor, verifique as permissões da tabela site_settings no Supabase.');
        }

        setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([config]);

        if (error) {
          console.error('Erro ao inserir:', error);
          throw new Error('Erro ao guardar. Por favor, verifique as permissões da tabela site_settings no Supabase.');
        }

        setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao guardar configurações:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao guardar configurações. Verifique o console para mais detalhes.' 
      });
    } finally {
      setSaving(false);
    }
  };

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
          Configurações do Site
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Gerir configurações gerais, integrações e preferências
        </p>
      </div>

      {/* Mensagem de Sucesso/Erro */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            <i className={`${message.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} text-2xl`}></i>
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveSection('general')}
          className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'general'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
              : `${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
          }`}
        >
          <i className="ri-settings-3-line mr-2"></i>
          Geral
        </button>
        <button
          onClick={() => setActiveSection('integrations')}
          className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'integrations'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
              : `${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
          }`}
        >
          <i className="ri-plug-line mr-2"></i>
          Integrações
        </button>
        <button
          onClick={() => setActiveSection('seo')}
          className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'seo'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : `${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
          }`}
        >
          <i className="ri-search-line mr-2"></i>
          SEO
        </button>
      </div>

      {/* Content */}
      {activeSection === 'general' && (
        <div className="space-y-6">
          {/* Informações da Loja */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Informações da Loja
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={config.store_name}
                  onChange={(e) => setConfig({ ...config, store_name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={config.store_email}
                  onChange={(e) => setConfig({ ...config, store_email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Telefone
                </label>
                <input
                  type="tel"
                  value={config.store_phone}
                  onChange={(e) => setConfig({ ...config, store_phone: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Moeda
                </label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Endereço
                </label>
                <textarea
                  value={config.store_address}
                  onChange={(e) => setConfig({ ...config, store_address: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Envios e Taxas */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Configurações de Envio e Taxas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Envio Grátis Acima de (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.free_shipping_threshold}
                  onChange={(e) => setConfig({ ...config, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Taxa de IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.tax_rate}
                  onChange={(e) => setConfig({ ...config, tax_rate: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                  placeholder="17"
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Taxa de IVA aplicada aos produtos (ex: 17% para Luxemburgo)
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i>
                A guardar...
              </span>
            ) : (
              <>
                <i className="ri-save-line mr-2"></i>
                Guardar Configurações
              </>
            )}
          </button>
        </div>
      )}

      {activeSection === 'integrations' && (
        <div className="space-y-6">
          {/* Stripe */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <i className="ri-bank-card-line text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Stripe
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Processamento de pagamentos
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Conectado
              </span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              O Stripe está configurado e pronto para processar pagamentos.
            </p>
          </div>

          {/* Supabase */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="ri-database-2-line text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Supabase
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Base de dados e autenticação
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Conectado
              </span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              O Supabase está configurado para base de dados, autenticação e storage.
            </p>
          </div>

          {/* Google Analytics */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <i className="ri-line-chart-line text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Google Analytics
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Análise de tráfego
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                Não Configurado
              </span>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ID de Medição (G-XXXXXXXXXX)"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap">
                Conectar Google Analytics
              </button>
            </div>
          </div>

          {/* Facebook Pixel */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <i className="ri-facebook-fill text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Facebook Pixel
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rastreamento de conversões
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                Não Configurado
              </span>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ID do Pixel"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
              <button className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer whitespace-nowrap">
                Conectar Facebook Pixel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'seo' && (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Configurações de SEO
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Título do Site
              </label>
              <input
                type="text"
                placeholder="Marisol - Elegância Atemporal"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Meta Descrição
              </label>
              <textarea
                rows={3}
                placeholder="Descrição do site para motores de busca..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Palavras-chave
              </label>
              <input
                type="text"
                placeholder="moda, roupa, elegância, marisol"
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
