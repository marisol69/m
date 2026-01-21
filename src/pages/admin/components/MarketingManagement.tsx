import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface MarketingManagementProps {
  darkMode?: boolean;
}

export default function MarketingManagement({ darkMode = false }: MarketingManagementProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignType, setCampaignType] = useState<'email' | 'sms' | 'notification'>('email');

  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    message: '',
    target_audience: 'all',
    segment_filter: '',
    scheduled_date: '',
    status: 'draft',
  });

  const [targetOptions, setTargetOptions] = useState({
    all_customers: true,
    newsletter_subscribers: false,
    recent_buyers: false,
    inactive_customers: false,
    high_value_customers: false,
    custom_segment: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData] = await Promise.all([
        supabase.from('customers').select('*'),
      ]);

      if (customersData.data) setCustomers(customersData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!formData.name || !formData.message) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Aqui você implementaria a lógica de envio real
      alert(`Campanha "${formData.name}" criada com sucesso!\n\nTipo: ${formData.type}\nPúblico: ${getTargetAudienceLabel()}\nMensagem: ${formData.message}`);
      
      setShowCampaignModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      alert('Erro ao criar campanha');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      message: '',
      target_audience: 'all',
      segment_filter: '',
      scheduled_date: '',
      status: 'draft',
    });
    setTargetOptions({
      all_customers: true,
      newsletter_subscribers: false,
      recent_buyers: false,
      inactive_customers: false,
      high_value_customers: false,
      custom_segment: false,
    });
  };

  const getTargetAudienceLabel = () => {
    const selected = [];
    if (targetOptions.all_customers) selected.push('Todos os clientes');
    if (targetOptions.newsletter_subscribers) selected.push('Subscritores da newsletter');
    if (targetOptions.recent_buyers) selected.push('Compradores recentes');
    if (targetOptions.inactive_customers) selected.push('Clientes inativos');
    if (targetOptions.high_value_customers) selected.push('Clientes de alto valor');
    if (targetOptions.custom_segment) selected.push('Segmento personalizado');
    
    return selected.length > 0 ? selected.join(', ') : 'Nenhum público selecionado';
  };

  const getEstimatedReach = () => {
    if (targetOptions.all_customers) return customers.length;
    
    let count = 0;
    if (targetOptions.newsletter_subscribers) count += Math.floor(customers.length * 0.6);
    if (targetOptions.recent_buyers) count += Math.floor(customers.length * 0.3);
    if (targetOptions.inactive_customers) count += Math.floor(customers.length * 0.4);
    if (targetOptions.high_value_customers) count += Math.floor(customers.length * 0.15);
    
    return Math.min(count, customers.length);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Marketing e Campanhas
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Gerir campanhas de email, SMS e notificações
          </p>
        </div>
      </div>

      {/* Tipos de Campanha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => {
            setCampaignType('email');
            setFormData({ ...formData, type: 'email' });
            setShowCampaignModal(true);
          }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-pink-500' : 'bg-white border-gray-200 hover:border-pink-500'} border-2 rounded-2xl p-8 text-center transition-all hover:shadow-lg cursor-pointer group`}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="ri-mail-line text-3xl text-white"></i>
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Campanha de Email
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enviar emails personalizados para clientes
          </p>
        </button>

        <button
          onClick={() => {
            setCampaignType('sms');
            setFormData({ ...formData, type: 'sms' });
            setShowCampaignModal(true);
          }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'} border-2 rounded-2xl p-8 text-center transition-all hover:shadow-lg cursor-pointer group`}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="ri-message-3-line text-3xl text-white"></i>
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Campanha de SMS
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enviar mensagens SMS para clientes
          </p>
        </button>

        <button
          onClick={() => {
            setCampaignType('notification');
            setFormData({ ...formData, type: 'notification' });
            setShowCampaignModal(true);
          }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-500'} border-2 rounded-2xl p-8 text-center transition-all hover:shadow-lg cursor-pointer group`}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="ri-notification-3-line text-3xl text-white"></i>
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Notificações Push
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enviar notificações push para clientes
          </p>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total de Clientes</span>
            <i className="ri-user-line text-pink-500 text-xl"></i>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {customers.length}
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subscritores</span>
            <i className="ri-mail-line text-blue-500 text-xl"></i>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {Math.floor(customers.length * 0.6)}
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Compradores Recentes</span>
            <i className="ri-shopping-bag-line text-green-500 text-xl"></i>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {Math.floor(customers.length * 0.3)}
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Alto Valor</span>
            <i className="ri-vip-crown-line text-yellow-500 text-xl"></i>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {Math.floor(customers.length * 0.15)}
          </p>
        </div>
      </div>

      {/* Modal Criar Campanha */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {campaignType === 'email' && 'Nova Campanha de Email'}
                {campaignType === 'sms' && 'Nova Campanha de SMS'}
                {campaignType === 'notification' && 'Nova Notificação Push'}
              </h2>
              <div className={`px-4 py-2 rounded-lg ${
                campaignType === 'email' ? 'bg-pink-100 text-pink-700' :
                campaignType === 'sms' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                <i className={`${
                  campaignType === 'email' ? 'ri-mail-line' :
                  campaignType === 'sms' ? 'ri-message-3-line' :
                  'ri-notification-3-line'
                } mr-2`}></i>
                {campaignType.toUpperCase()}
              </div>
            </div>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} p-6 rounded-xl`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Informações da Campanha
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nome da Campanha *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Promoção de Verão 2024"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                      } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                    />
                  </div>

                  {campaignType === 'email' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Assunto do Email *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Ex: 🎉 Descontos até 50% - Não perca!"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                        } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                      />
                    </div>
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Mensagem *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      placeholder={
                        campaignType === 'email' ? 'Escreva o conteúdo do email aqui...' :
                        campaignType === 'sms' ? 'Escreva a mensagem SMS (máx. 160 caracteres)...' :
                        'Escreva o texto da notificação...'
                      }
                      maxLength={campaignType === 'sms' ? 160 : undefined}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                      } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                    />
                    {campaignType === 'sms' && (
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formData.message.length}/160 caracteres
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Agendar Envio (Opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                      } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Deixe em branco para enviar imediatamente
                    </p>
                  </div>
                </div>
              </div>

              {/* Público-Alvo */}
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} p-6 rounded-xl`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Selecionar Público-Alvo
                </h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={targetOptions.all_customers}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTargetOptions({
                          all_customers: checked,
                          newsletter_subscribers: checked ? false : targetOptions.newsletter_subscribers,
                          recent_buyers: checked ? false : targetOptions.recent_buyers,
                          inactive_customers: checked ? false : targetOptions.inactive_customers,
                          high_value_customers: checked ? false : targetOptions.high_value_customers,
                          custom_segment: checked ? false : targetOptions.custom_segment,
                        });
                      }}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer mt-0.5"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Todos os Clientes
                      </span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Enviar para todos os clientes registados ({customers.length} pessoas)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={targetOptions.newsletter_subscribers}
                      disabled={targetOptions.all_customers}
                      onChange={(e) => setTargetOptions({ ...targetOptions, newsletter_subscribers: e.target.checked })}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer mt-0.5 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Subscritores da Newsletter
                      </span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clientes que subscreveram a newsletter (~{Math.floor(customers.length * 0.6)} pessoas)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={targetOptions.recent_buyers}
                      disabled={targetOptions.all_customers}
                      onChange={(e) => setTargetOptions({ ...targetOptions, recent_buyers: e.target.checked })}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer mt-0.5 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Compradores Recentes
                      </span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clientes que compraram nos últimos 30 dias (~{Math.floor(customers.length * 0.3)} pessoas)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={targetOptions.inactive_customers}
                      disabled={targetOptions.all_customers}
                      onChange={(e) => setTargetOptions({ ...targetOptions, inactive_customers: e.target.checked })}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer mt-0.5 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Clientes Inativos
                      </span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clientes sem compras há mais de 90 dias (~{Math.floor(customers.length * 0.4)} pessoas)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={targetOptions.high_value_customers}
                      disabled={targetOptions.all_customers}
                      onChange={(e) => setTargetOptions({ ...targetOptions, high_value_customers: e.target.checked })}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer mt-0.5 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Clientes de Alto Valor
                      </span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clientes com compras superiores a €500 (~{Math.floor(customers.length * 0.15)} pessoas)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={targetOptions.custom_segment}
                      disabled={targetOptions.all_customers}
                      onChange={(e) => setTargetOptions({ ...targetOptions, custom_segment: e.target.checked })}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer mt-0.5 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Segmento Personalizado
                      </span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Definir filtros personalizados
                      </p>
                    </div>
                  </label>

                  {targetOptions.custom_segment && (
                    <div className="ml-8 mt-2">
                      <input
                        type="text"
                        value={formData.segment_filter}
                        onChange={(e) => setFormData({ ...formData, segment_filter: e.target.value })}
                        placeholder="Ex: cidade=Lisboa, idade>25"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                        } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                      />
                    </div>
                  )}
                </div>

                {/* Alcance Estimado */}
                <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-600/50' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Alcance Estimado
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getTargetAudienceLabel()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {getEstimatedReach()}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        pessoas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handleSendCampaign}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-send-plane-line mr-2"></i>
                {formData.scheduled_date ? 'Agendar Campanha' : 'Enviar Agora'}
              </button>
              <button
                onClick={() => {
                  setShowCampaignModal(false);
                  resetForm();
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
