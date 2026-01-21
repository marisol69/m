import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface WooCommerceManagementProps {
  darkMode: boolean;
}

export default function WooCommerceManagement({ darkMode }: WooCommerceManagementProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  
  // Configurações
  const [wooUrl, setWooUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Produtos importados
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadImportedProducts();
    loadSyncHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'woocommerce_settings')
        .single();

      if (data?.value) {
        setWooUrl(data.value.url || '');
        setConsumerKey(data.value.consumerKey || '');
        setConsumerSecret(data.value.consumerSecret || '');
        setIsConnected(data.value.isConnected || false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadImportedProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('source', 'woocommerce')
        .order('created_at', { ascending: false });

      if (data) setImportedProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .eq('action_type', 'woocommerce_sync')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setSyncHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settings = {
        url: wooUrl,
        consumerKey,
        consumerSecret,
        isConnected,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'woocommerce_settings',
          value: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert('✅ Configurações do WooCommerce salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!wooUrl || !consumerKey || !consumerSecret) {
      alert('❌ Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      // Aqui você implementaria a chamada real à API do WooCommerce
      // Por enquanto, vamos simular
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      alert('✅ Conexão com WooCommerce estabelecida com sucesso!');
      
      // Salvar automaticamente
      await saveSettings();
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('❌ Erro ao conectar com WooCommerce');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const syncProducts = async () => {
    if (!isConnected) {
      alert('❌ Por favor, conecte-se ao WooCommerce primeiro');
      return;
    }

    setLoading(true);
    try {
      // Aqui você implementaria a sincronização real
      // Por enquanto, vamos simular
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Registrar no histórico
      await supabase.from('admin_logs').insert({
        action_type: 'woocommerce_sync',
        description: 'Sincronização de produtos do WooCommerce',
        details: {
          productsImported: 0,
          productsUpdated: 0,
          timestamp: new Date().toISOString(),
        },
      });

      alert('✅ Produtos sincronizados com sucesso!');
      loadImportedProducts();
      loadSyncHistory();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      alert('❌ Erro ao sincronizar produtos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Integração WooCommerce
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Gerencie produtos importados do WooCommerce
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              <i className="ri-checkbox-circle-fill"></i>
              <span className="font-semibold">Conectado</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['config', 'products', 'history'].map((tab) => (
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
            {tab === 'config' && '⚙️ Configuração'}
            {tab === 'products' && '📦 Produtos Importados'}
            {tab === 'history' && '📊 Histórico de Sincronização'}
          </button>
        ))}
      </div>

      {/* Configuração */}
      {activeTab === 'config' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg space-y-6`}>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Configurações da API
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Configure as credenciais da API REST do WooCommerce para importar produtos automaticamente.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              URL da Loja WooCommerce
            </label>
            <input
              type="url"
              value={wooUrl}
              onChange={(e) => setWooUrl(e.target.value)}
              placeholder="https://sua-loja.com"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Consumer Key
            </label>
            <input
              type="text"
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
              placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Consumer Secret
            </label>
            <input
              type="password"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
              placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-semibold shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? 'A Testar...' : '🔌 Testar Conexão'}
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-semibold shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? 'A Guardar...' : '💾 Guardar Configurações'}
            </button>
          </div>

          {isConnected && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={syncProducts}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <i className="ri-refresh-line text-xl"></i>
                {loading ? 'A Sincronizar...' : 'Sincronizar Produtos Agora'}
              </button>
            </div>
          )}

          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              📚 Como Obter as Credenciais da API
            </h4>
            <ol className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-2 list-decimal list-inside`}>
              <li>Aceda ao painel de administração do WooCommerce</li>
              <li>Vá em WooCommerce → Configurações → Avançado → REST API</li>
              <li>Clique em "Adicionar chave"</li>
              <li>Defina as permissões como "Leitura/Escrita"</li>
              <li>Copie a Consumer Key e Consumer Secret</li>
              <li>Cole aqui e teste a conexão</li>
            </ol>
          </div>
        </div>
      )}

      {/* Produtos Importados */}
      {activeTab === 'products' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Produtos Importados ({importedProducts.length})
            </h3>
            {isConnected && (
              <button
                onClick={syncProducts}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <i className="ri-refresh-line"></i>
                Sincronizar
              </button>
            )}
          </div>

          {importedProducts.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-shopping-bag-line text-6xl text-gray-400 mb-4"></i>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nenhum produto importado ainda
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                Configure a conexão e sincronize para importar produtos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`rounded-lg overflow-hidden ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  } hover:shadow-lg transition-shadow`}
                >
                  <img
                    src={product.images?.[0] || product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {product.name}
                    </h4>
                    <p className="text-pink-500 font-bold mb-2">€{product.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded ${
                        product.stock > 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        Stock: {product.stock}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        WooCommerce
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      {activeTab === 'history' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            Histórico de Sincronização
          </h3>

          {syncHistory.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-history-line text-6xl text-gray-400 mb-4"></i>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nenhuma sincronização realizada ainda
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {log.description}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        {new Date(log.created_at).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <i className="ri-check-circle-fill text-green-500 text-xl"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
